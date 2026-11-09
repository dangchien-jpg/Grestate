"""Internal prediction API. Public requests pass through the authenticated Node gateway."""
from contextlib import asynccontextmanager
import hashlib
import hmac
import importlib.metadata
import json
import logging
import math
import os
from pathlib import Path
import threading
from typing import Annotated

import joblib
import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, field_validator
from features import (AREA_MAX, AREA_MIN, BOUNDS, FEATURES, SCHEMA_VERSION, UNKNOWN,
                      canonical_district, distance_km, engineer_features, normalize_direction, normalize_location)
from geocoding import lookup

BASE_DIR = Path(__file__).resolve().parent
logger = logging.getLogger("valuation")
_inference_slots = threading.BoundedSemaphore(2)


def load_bundle(root=BASE_DIR / "artifacts"):
    pointer = json.loads((root / "current.json").read_text(encoding="utf-8"))
    version = pointer["version"]
    if not version or Path(version).name != version or "/" in version or "\\" in version:
        raise ValueError("Invalid artifact version")
    directory = root / version
    if directory.resolve().parent != root.resolve():
        raise ValueError("Artifact path must stay inside artifact root")
    bundle = {name: json.loads((directory / f"{name}.json").read_text(encoding="utf-8"))
              for name in ["manifest", "metadata", "metrics", "calibration"]}
    manifest = bundle["manifest"]
    if manifest["schema_version"] != SCHEMA_VERSION or manifest["features"] != FEATURES:
        raise ValueError("Artifact feature schema mismatch; retrain the model")
    if hashlib.sha256((BASE_DIR / "features.py").read_text(encoding="utf-8").encode("utf-8")).hexdigest() != manifest["feature_code_sha256"]:
        raise ValueError("Shared preprocessing changed; retrain before serving")
    if hashlib.sha256((directory / "model.joblib").read_bytes()).hexdigest() != manifest["model_sha256"]:
        raise ValueError("Artifact checksum mismatch")
    for package, expected in manifest["packages"].items():
        if importlib.metadata.version(package) != expected:
            raise ValueError(f"Model requires {package}=={expected}; install requirements.txt")
    model = joblib.load(directory / "model.joblib")
    if list(model.feature_names_in_) != FEATURES:
        raise ValueError("Model columns differ from manifest")
    if "n_jobs" in model.named_steps["regressor"].get_params():
        model.named_steps["regressor"].set_params(n_jobs=2)
    bundle["model"] = model
    return bundle


@asynccontextmanager
async def lifespan(app):
    app.state.bundle = load_bundle()
    yield


def require_service_token(x_valuation_token: Annotated[str | None, Header()] = None):
    expected = os.getenv("VALUATION_SERVICE_TOKEN")
    if expected and not hmac.compare_digest(expected, x_valuation_token or ""):
        raise HTTPException(401, "Unauthorized service request")


app = FastAPI(title="Grestate Valuation", lifespan=lifespan, dependencies=[Depends(require_service_token)])


class ValuationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)
    district: str = Field(min_length=1, max_length=80)
    ward: str = Field(min_length=1, max_length=100)
    street: str = Field(min_length=1, max_length=160)
    property_type: str = Field(min_length=1, max_length=80)
    legal_status: str = Field(min_length=1, max_length=80)
    direction: str = Field(min_length=1, max_length=40)
    lat: float = Field(ge=BOUNDS["south"], le=BOUNDS["north"])
    lon: float = Field(ge=BOUNDS["west"], le=BOUNDS["east"])
    area: float = Field(ge=AREA_MIN, le=AREA_MAX)
    frontage: float = Field(gt=0, le=1000)
    road_width: float = Field(ge=0, le=200)
    num_bedrooms: int = Field(ge=0, le=100)
    num_toilets: int = Field(ge=0, le=100)
    num_floors: int = Field(ge=0, le=100)
    amenity_text: str = Field(default="", max_length=4000)

    @field_validator("district")
    @classmethod
    def district_supported(cls, value):
        result = canonical_district(value)
        if not result:
            raise ValueError("Quận/huyện chưa được hỗ trợ")
        return result

    @field_validator("ward", "street")
    @classmethod
    def clean_location(cls, value):
        value = normalize_location(value)
        if not value:
            raise ValueError("Địa chỉ không được để trống")
        return value

    @field_validator("direction")
    @classmethod
    def clean_direction(cls, value):
        return normalize_direction(value)


class ValuationResponse(BaseModel):
    status: str
    total_price_billion: float
    unit_price_million_m2: float
    min_price_billion: float
    max_price_billion: float
    dist_center_km: float
    dist_beach_km: float
    model_name: str
    model_version: str
    interval_nominal_coverage: float
    interval_test_coverage: float
    warnings: list[str]


def metadata_payload(bundle):
    manifest = bundle["manifest"]
    return {"location_meta": bundle["metadata"], "metrics": bundle["metrics"],
            "model": {"name": manifest["model_name"], "version": manifest["model_version"],
                      "location_resolution": manifest["location_resolution"],
                      "data_end": manifest["data_report"]["data_end"]}}


@app.get("/api/metadata")
def metadata():
    return metadata_payload(app.state.bundle)


@app.get("/health")
def health():
    return {"status": "ok", "model_version": app.state.bundle["manifest"]["model_version"]}


def field_error(field, message):
    raise HTTPException(422, detail=[{"loc": ["body", field], "msg": message, "type": "value_error"}])


def predict(payload, bundle):
    meta = bundle["metadata"]
    district = meta["districts"].get(payload.district)
    if district is None:
        field_error("district", "Quận/huyện chưa có dữ liệu huấn luyện")
    ward = next((name for name in district["wards"] if name.casefold() == payload.ward.casefold()), None)
    if ward is None:
        field_error("ward", "Phường/xã không thuộc danh mục được hỗ trợ của quận/huyện")
    if payload.property_type not in meta["property_types"]:
        field_error("property_type", "Loại bất động sản chưa được hỗ trợ")
    if payload.legal_status not in meta["legal_statuses"]:
        field_error("legal_status", "Tình trạng pháp lý không hợp lệ")
    values = payload.model_dump()
    values["ward"] = ward
    frame = engineer_features(pd.DataFrame([values]))
    unit_price = float(np.exp(bundle["model"].predict(frame)[0]))
    total = unit_price * payload.area / 1000
    if not math.isfinite(total) or total <= 0:
        raise ValueError("Non-finite or non-positive model output")
    calibration = bundle["calibration"]
    radius = calibration["by_property_type"].get(payload.property_type, calibration["global_log_radius"])
    warnings = ["Giá được ước tính theo quận, phường, đường và đặc điểm bất động sản. Ghim bản đồ dùng để tính khoảng cách tham khảo."]
    if payload.street.casefold() not in {name.casefold() for name in district["streets"]}:
        warnings.append("Đường này chưa có trong danh mục huấn luyện; ước tính dùng thêm thông tin khu vực.")
    return {
        "status": "success", "total_price_billion": round(total, 6),
        "unit_price_million_m2": round(unit_price, 4),
        "min_price_billion": round(total*np.exp(-radius), 6), "max_price_billion": round(total*np.exp(radius), 6),
        "dist_center_km": round(distance_km(payload.lat, payload.lon, 16.0611, 108.2274), 2),
        "dist_beach_km": round(distance_km(payload.lat, payload.lon, 16.0598, 108.2458), 2),
        "model_name": bundle["manifest"]["model_name"], "model_version": bundle["manifest"]["model_version"],
        "interval_nominal_coverage": calibration["nominal_coverage"],
        "interval_test_coverage": bundle["metrics"]["test"]["interval_coverage"], "warnings": warnings,
    }


@app.post("/api/predict", response_model=ValuationResponse)
def predict_price(payload: ValuationRequest):
    if not _inference_slots.acquire(blocking=False):
        raise HTTPException(429, "Dịch vụ đang bận. Vui lòng thử lại sau ít giây.")
    try:
        return predict(payload, app.state.bundle)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Prediction failed")
        raise HTTPException(500, "Không thể tính giá lúc này. Vui lòng thử lại.") from None
    finally:
        _inference_slots.release()


@app.get("/api/geocode")
def geocode(q: Annotated[str, Query(min_length=3, max_length=400)]):
    return {"location": lookup("search", {"q": q})}


@app.get("/api/reverse-geocode")
def reverse_geocode(lat: Annotated[float, Query(ge=BOUNDS["south"], le=BOUNDS["north"])],
                    lon: Annotated[float, Query(ge=BOUNDS["west"], le=BOUNDS["east"])]):
    return {"location": lookup("reverse", {"lat": str(lat), "lon": str(lon)})}
