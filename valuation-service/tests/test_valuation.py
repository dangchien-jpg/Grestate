import asyncio
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from app import app, load_bundle
from build_model import prepare, split_time, select_winner, make_pipeline
from features import FEATURES, has_term, infer_legal, normalize_direction, canonical_district


async def request(path, payload=None, method="POST"):
    messages = []
    body = json.dumps(payload).encode() if payload is not None else b""
    delivered = False
    async def receive():
        nonlocal delivered
        if not delivered:
            delivered = True
            return {"type": "http.request", "body": body, "more_body": False}
        await asyncio.sleep(60)
        return {"type": "http.disconnect"}
    async def send(message):
        messages.append(message)
    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": method,
             "scheme": "http", "path": path, "raw_path": path.encode(), "query_string": b"",
             "root_path": "", "headers": [(b"content-type", b"application/json")],
             "client": ("127.0.0.1", 12345), "server": ("test", 80)}
    await app(scope, receive, send)
    status = next(message["status"] for message in messages if message["type"] == "http.response.start")
    data = b"".join(message.get("body", b"") for message in messages if message["type"] == "http.response.body")
    return status, json.loads(data)


class FeatureTests(unittest.TestCase):
    def test_amenity_word_boundaries_and_negation(self):
        self.assertEqual(has_term("cửa hàng", "biển|mỹ khê|sông hàn"), 0)
        self.assertEqual(has_term("không gần biển", "biển"), 0)
        self.assertEqual(has_term("gần biển Mỹ Khê", "biển"), 1)
        self.assertEqual(infer_legal("nhà đẹp chưa có sổ đỏ"), "Hợp đồng/Khác")
        self.assertEqual(infer_legal("nhà đẹp"), "Không rõ")

    def test_canonical_categories(self):
        self.assertEqual(canonical_district("Quận Hải Châu"), "Hải Châu")
        self.assertEqual(canonical_district(""), "")
        self.assertEqual(canonical_district("Châu"), "")
        self.assertEqual(normalize_direction("Tây - Bắc"), "Tây Bắc")
        self.assertNotIn("length", FEATURES)
        self.assertNotIn("lat", FEATURES)

    def test_selection_is_not_fixed_to_an_algorithm(self):
        for winner in ["Ridge", "Random Forest", "XGBoost"]:
            results = {name: {"mape": 10 if name == winner else 20, "mae": 3} for name in ["Ridge", "Random Forest", "XGBoost"]}
            self.assertEqual(select_winner(results), winner)
        self.assertEqual(select_winner({"a": {"mape": 10, "mae": 2}, "b": {"mape": 10, "mae": 1}}), "b")

    def test_preprocessing_is_independent(self):
        a, b = make_pipeline(Ridge()), make_pipeline(Ridge())
        self.assertIsNot(a.named_steps["preprocessor"], b.named_steps["preprocessor"])

    def test_reposts_do_not_cross_chronological_splits(self):
        rows = []
        for day in range(40):
            for i in range(100):
                rows.append({"name": f"house {day}-{i}", "description": "near school", "district_name": "Hải Châu",
                             "ward_name": "Hòa Cường Bắc", "street_name": "A", "property_type_name": "Nhà", "area": 100,
                             "price": 5e9, "published_at": (pd.Timestamp("2025-01-01") + pd.Timedelta(days=day)).isoformat()})
        for row in rows[:100]:
            rows.append({**row, "price": 6e9, "published_at": "2025-02-09"})
        df, report = prepare(pd.DataFrame(rows))
        self.assertEqual(report["reposts_removed"], 100)
        parts = split_time(df)
        previous = None
        seen = set()
        for part in parts.values():
            if previous is not None:
                self.assertLess(previous, part.published_at.min())
            previous = part.published_at.max()
            groups = set(part.listing_group)
            self.assertFalse(seen.intersection(groups))
            seen.update(groups)


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.state.bundle = load_bundle()
        metadata = app.state.bundle["metadata"]
        district, info = next((name, data) for name, data in metadata["districts"].items() if data["wards"])
        cls.base = {"district": district, "ward": info["wards"][0], "street": info["streets"][0],
                    "property_type": "Nhà", "legal_status": "Không rõ", "direction": "Không rõ",
                    "area": 100, "lat": info["lat"], "lon": info["lon"], "amenity_text": "Gần trường học",
                    "frontage": 5, "road_width": 6, "num_floors": 2, "num_bedrooms": 3, "num_toilets": 2}

    def call(self, payload):
        return asyncio.run(request("/api/predict", payload))

    def test_predict_with_required_inputs_without_depth(self):
        status, body = self.call(self.base)
        self.assertEqual(status, 200, body)
        self.assertGreater(body["total_price_billion"], 0)
        self.assertLess(body["min_price_billion"], body["total_price_billion"])
        self.assertGreater(body["max_price_billion"], body["total_price_billion"])
        self.assertEqual(body["model_name"], app.state.bundle["metrics"]["selected_model"])

    def test_invalid_requests_have_field_errors(self):
        for patch, field in [({"area": 0}, "area"), ({"frontage": -1}, "frontage"), ({"lat": 21}, "lat"),
                             ({"district": ""}, "district"), ({"ward": "not a supported ward"}, "ward"),
                             ({"length": 20}, "length"), ({"num_floors": 1.5}, "num_floors"),
                             ({"property_type": "invalid"}, "property_type")]:
            with self.subTest(field=field):
                status, body = self.call(self.base | patch)
                self.assertEqual(status, 422, body)
                self.assertTrue(any(error["loc"][-1] == field for error in body["detail"]))

    def test_required_request_fields_reject_missing_or_null(self):
        for field in self.base:
            for omitted in [True, False]:
                if field == "amenity_text" and omitted:
                    continue
                with self.subTest(field=field, omitted=omitted):
                    payload = dict(self.base)
                    if omitted:
                        payload.pop(field)
                    else:
                        payload[field] = None
                    status, body = self.call(payload)
                    self.assertEqual(status, 422, body)
                    self.assertTrue(any(error["loc"][-1] == field for error in body["detail"]))

    def test_blank_text_is_rejected(self):
        for field in ["district", "ward", "street", "property_type", "legal_status", "direction"]:
            with self.subTest(field=field):
                status, body = self.call(self.base | {field: "   "})
                self.assertEqual(status, 422, body)
                self.assertTrue(any(error["loc"][-1] == field for error in body["detail"]))

    def test_optional_amenities_accept_missing_empty_or_whitespace(self):
        prices = []
        for value in [None, "", "   "]:
            payload = dict(self.base)
            if value is None:
                payload.pop("amenity_text")
            else:
                payload["amenity_text"] = value
            with self.subTest(value=value):
                status, body = self.call(payload)
                self.assertEqual(status, 200, body)
                self.assertGreater(body["total_price_billion"], 0)
                prices.append(body["total_price_billion"])
        self.assertEqual(prices[0], prices[1])
        self.assertEqual(prices[1], prices[2])
        status, body = self.call(self.base | {"amenity_text": "a" * 4001})
        self.assertEqual(status, 422, body)

    def test_explicit_zero_counts_and_road_width_are_valid(self):
        status, body = self.call(self.base | {"road_width": 0, "num_floors": 0, "num_bedrooms": 0, "num_toilets": 0})
        self.assertEqual(status, 200, body)

    def test_land_ignores_room_counts(self):
        a = self.call(self.base | {"property_type": "Đất", "num_floors": 0, "num_bedrooms": 0, "num_toilets": 0})
        b = self.call(self.base | {"property_type": "Đất", "num_floors": 10, "num_bedrooms": 20, "num_toilets": 30})
        self.assertEqual(a[0], 200)
        self.assertEqual(a[1]["total_price_billion"], b[1]["total_price_billion"])

    def test_pin_is_display_only_not_untrained_gps_feature(self):
        a = self.call(self.base)[1]
        b = self.call(self.base | {"lat": 16.1, "lon": 108.25})[1]
        self.assertEqual(a["total_price_billion"], b["total_price_billion"])
        self.assertNotEqual(a["dist_center_km"], b["dist_center_km"])

    def test_metadata_matches_selected_artifact(self):
        status, body = asyncio.run(request("/api/metadata", method="GET"))
        self.assertEqual(status, 200)
        self.assertEqual(body["model"]["name"], select_winner(body["metrics"]["validation"]))
        self.assertGreaterEqual(body["metrics"]["test"]["interval_coverage"], 0)
        self.assertLessEqual(body["metrics"]["test"]["interval_coverage"], 1)


if __name__ == "__main__":
    unittest.main()
