"""Train candidates, select on validation only, calibrate, then evaluate once."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import sys

import joblib
import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.compute as pc
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, TargetEncoder
from xgboost import XGBRegressor
from features import (AREA_MAX, AREA_MIN, BOUNDS, DISTRICT_COORDS, FEATURES,
                      HIGH_CARD, LOW_CARD, NUMERIC, SCHEMA_VERSION, UNKNOWN,
                      canonical_district, engineer_features, infer_legal, normalize_location, text)

BASE_DIR = Path(__file__).resolve().parent
SEED = 42
COVERAGE = 0.9


def load_local_data(cache_dir=None):
    root = Path(cache_dir) if cache_dir else Path.home() / ".cache/huggingface/datasets/tinixai___vietnam-real-estates"
    candidates = sorted({p.parent for p in root.rglob("*.arrow")}, key=lambda p: p.stat().st_mtime, reverse=True)
    if not candidates:
        raise FileNotFoundError("No cached dataset. Run with --download or provide --cache-dir.")
    files = sorted(candidates[0].glob("*.arrow"))
    kept = []
    for path in files:
        with pa.memory_map(str(path), "r") as source:
            for batch in pa.ipc.open_stream(source):
                selected = batch.filter(pc.fill_null(pc.match_substring(batch.column("province_name"), "Đà Nẵng"), False))
                if selected.num_rows:
                    kept.append(selected)
    if not kept:
        raise ValueError("No Da Nang rows in cache")
    fingerprint = hashlib.sha256("\n".join(f"{p.name}:{p.stat().st_size}" for p in files).encode()).hexdigest()
    return pa.Table.from_batches(kept).to_pandas(), {"dataset": "tinixai/vietnam-real-estates", "cache_revision": candidates[0].name, "file_inventory_sha256": fingerprint}


def prepare(raw):
    df = raw.copy()
    report = {"raw_region_rows": len(df)}
    df.rename(columns={"district_name": "district", "ward_name": "ward", "street_name": "street",
                       "property_type_name": "property_type", "frontage_width": "frontage",
                       "bedroom_count": "num_bedrooms", "bathroom_count": "num_toilets",
                       "floor_count": "num_floors", "house_direction": "direction"}, inplace=True)
    df["district"] = df.district.map(canonical_district)
    for col in ["ward", "street"]:
        df[col] = df[col].map(normalize_location).replace("", UNKNOWN)
    df["property_type"] = df.property_type.map(text).replace("Nhà riêng", "Nhà")
    df["published_at"] = pd.to_datetime(df.published_at, utc=True, errors="coerce", format="mixed")
    df["price_billion"] = pd.to_numeric(df.price, errors="coerce") / 1e9
    df["area"] = pd.to_numeric(df.area, errors="coerce")
    unit = df.price_billion * 1000 / df.area
    # Fixed domain rules only. No thresholds fitted on future validation/test prices.
    df = df[df.district.ne("") & df.published_at.notna() & df.area.between(AREA_MIN, AREA_MAX)
            & df.price_billion.between(.4, 80) & unit.between(5, 320)].copy()
    report["eligible_rows"] = len(df)
    df["amenity_text"] = df["name"].fillna("") + ". " + df.description.fillna("")
    df["legal_status"] = df.amenity_text.map(infer_legal)
    # Conservative repeated-listing grouping: same title, location, type and area.
    # Price/date/description may change between reposts and are excluded from the key.
    keys = df[["district", "ward", "street", "property_type", "area"]].copy()
    keys["title"] = df["name"].map(text).str.casefold()
    empty_title = keys.title.eq("")
    keys.loc[empty_title, "title"] = df.loc[empty_title, "description"].map(text).str.casefold()
    df["listing_group"] = pd.util.hash_pandas_object(keys, index=False).astype(str)
    df.sort_values("published_at", kind="stable", inplace=True)
    df = df.drop_duplicates("listing_group", keep="last").reset_index(drop=True)
    report["reposts_removed"] = report["eligible_rows"] - len(df)
    report["deduplicated_rows"] = len(df)
    report["data_start"] = df.published_at.min().isoformat()
    report["data_end"] = df.published_at.max().isoformat()
    return df, report


def split_time(df):
    days = df.published_at.dt.floor("D")
    dates = sorted(days.unique())
    if len(dates) < 20:
        raise ValueError("Need at least 20 distinct dates for chronological holdouts")
    cutoffs = [dates[int(len(dates)*fraction)] for fraction in [.60, .75, .85]]
    parts = {
        "train": df[days < cutoffs[0]],
        "validation": df[(days >= cutoffs[0]) & (days < cutoffs[1])],
        "calibration": df[(days >= cutoffs[1]) & (days < cutoffs[2])],
        "test": df[days >= cutoffs[2]],
    }
    if any(len(part) < 200 for part in parts.values()):
        raise ValueError("A chronological split has fewer than 200 rows")
    return parts


def make_pipeline(estimator):
    prep = ColumnTransformer([
        ("num", Pipeline([("imputer", SimpleImputer(strategy="median", add_indicator=True, keep_empty_features=True)), ("scale", StandardScaler())]), NUMERIC),
        ("target", TargetEncoder(smooth="auto", cv=5, shuffle=True, random_state=SEED), HIGH_CARD),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False), LOW_CARD),
    ])
    return Pipeline([("preprocessor", prep), ("regressor", clone(estimator))])


def target(df):
    return np.log(df.price_billion.to_numpy() * 1000 / df.area.to_numpy())


def predict_total(model, df):
    values = np.exp(model.predict(engineer_features(df))) * df.area.to_numpy() / 1000
    if not np.isfinite(values).all() or (values <= 0).any():
        raise ValueError("Model produced non-finite/non-positive predictions")
    return values


def scores(df, pred):
    truth = df.price_billion.to_numpy()
    error = np.abs((pred-truth)/truth)
    return {"n": len(df), "r2": float(r2_score(truth, pred)),
            "mae": float(mean_absolute_error(truth, pred)),
            "rmse": float(np.sqrt(mean_squared_error(truth, pred))),
            "mape": float(error.mean()*100), "within_10_percent": float((error <= .1).mean()*100)}


def select_winner(results):
    return min(results, key=lambda name: (results[name]["mape"], results[name]["mae"], name))


def conformal_quantile(residuals, coverage=COVERAGE):
    # Finite-sample order statistic for split conformal calibration.
    rank = min(len(residuals), math.ceil((len(residuals)+1)*coverage))
    return float(np.sort(residuals)[rank-1])


def make_metadata(df):
    return {
        "districts": {name: {"wards": sorted(set(group.ward)-{UNKNOWN}),
                             "streets": sorted(set(group.street)-{UNKNOWN}),
                             "lat": DISTRICT_COORDS[name][0], "lon": DISTRICT_COORDS[name][1]}
                      for name, group in df.groupby("district")},
        "property_types": sorted(df.property_type.unique()),
        "directions": [UNKNOWN, "Bắc", "Nam", "Đông", "Tây", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"],
        "legal_statuses": [UNKNOWN, "Đã có sổ", "Hợp đồng/Khác"],
        "bounds": BOUNDS, "area_min": AREA_MIN, "area_max": AREA_MAX,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache-dir")
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--jobs", type=int, default=min(4, os.cpu_count() or 1))
    args = parser.parse_args()
    if args.download:
        from datasets import load_dataset
        load_dataset("tinixai/vietnam-real-estates", split="train")
    raw, dataset = load_local_data(args.cache_dir)
    df, report = prepare(raw)
    del raw
    parts = split_time(df)
    report["splits"] = {name: {"rows": len(part), "start": part.published_at.min().isoformat(), "end": part.published_at.max().isoformat()}
                        for name, part in parts.items()}
    print(json.dumps(report, ensure_ascii=True), flush=True)
    models = {
        "Ridge": Ridge(alpha=10),
        "Random Forest": RandomForestRegressor(n_estimators=250, max_depth=16, min_samples_leaf=2, random_state=SEED, n_jobs=args.jobs),
        "XGBoost": XGBRegressor(n_estimators=800, learning_rate=.03, max_depth=7, min_child_weight=3, subsample=.85, colsample_bytree=.85, reg_alpha=.5, reg_lambda=2, random_state=SEED, n_jobs=args.jobs, tree_method="hist"),
    }
    results = {}
    for name, estimator in models.items():
        print(f"Training {name}...", flush=True)
        candidate = make_pipeline(estimator)
        candidate.fit(engineer_features(parts["train"]), target(parts["train"]))
        results[name] = scores(parts["validation"], predict_total(candidate, parts["validation"]))
        print(json.dumps({name: results[name]}), flush=True)
        del candidate
    winner = select_winner(results)
    print(f"Selected {winner} by validation MAPE; refitting train + validation...", flush=True)
    development = pd.concat([parts["train"], parts["validation"]])
    model = make_pipeline(models[winner])
    model.fit(engineer_features(development), target(development))
    calibration_pred = predict_total(model, parts["calibration"])
    residuals = np.abs(np.log(parts["calibration"].price_billion.to_numpy()/calibration_pred))
    calibration = {"nominal_coverage": COVERAGE, "global_log_radius": conformal_quantile(residuals), "by_property_type": {}}
    for kind in parts["calibration"].property_type.unique():
        mask = parts["calibration"].property_type.eq(kind).to_numpy()
        if mask.sum() >= 200:
            calibration["by_property_type"][kind] = conformal_quantile(residuals[mask])
    test = parts["test"]
    pred = predict_total(model, test)
    radii = test.property_type.map(calibration["by_property_type"]).fillna(calibration["global_log_radius"]).to_numpy()
    inside = (test.price_billion.to_numpy() >= pred*np.exp(-radii)) & (test.price_billion.to_numpy() <= pred*np.exp(radii))
    final_scores = scores(test, pred)
    final_scores["interval_coverage"] = float(inside.mean())
    segments = {kind: scores(test[test.property_type.eq(kind)], pred[test.property_type.eq(kind).to_numpy()]) for kind in test.property_type.unique()}
    metrics = {"selection_metric": "validation_mape", "selected_model": winner, "validation": results, "test": final_scores, "test_by_property_type": segments}
    # Artifact includes all dictionaries from development only, avoiding future vocabulary.
    metadata = make_metadata(development)
    version = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    directory = BASE_DIR / "artifacts" / version
    directory.mkdir(parents=True, exist_ok=False)
    joblib.dump(model, directory / "model.joblib", compress=3)
    restored = joblib.load(directory / "model.joblib")
    np.testing.assert_allclose(predict_total(restored, test.iloc[:20]), pred[:20], rtol=1e-10)
    versions = {name: importlib.metadata.version(name) for name in ["scikit-learn", "xgboost", "numpy", "pandas", "joblib"]}
    manifest = {"schema_version": SCHEMA_VERSION, "model_version": version, "model_name": winner, "selection_metric": "validation_mape",
                "target": "log_price_per_m2_million", "features": FEATURES, "location_resolution": "district_ward_street",
                "model_sha256": hashlib.sha256((directory / "model.joblib").read_bytes()).hexdigest(),
                "feature_code_sha256": hashlib.sha256((BASE_DIR / "features.py").read_text(encoding="utf-8").encode("utf-8")).hexdigest(),
                "feature_hash_format": "utf8_lf", "dataset": dataset, "data_report": report, "packages": versions}
    for name, data in [("metadata.json", metadata), ("metrics.json", metrics), ("calibration.json", calibration), ("manifest.json", manifest)]:
        (directory / name).write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")
    # Switch only after every artifact and reload check succeeds.
    pointer = BASE_DIR / "artifacts" / "current.json"
    temp = pointer.with_suffix(".tmp")
    temp.write_text(json.dumps({"version": version}), encoding="utf-8")
    temp.replace(pointer)
    (BASE_DIR / "model_metrics.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"active_version": version, "selected_model": winner, "test": final_scores}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()
