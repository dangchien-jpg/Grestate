"""Shared, deterministic preprocessing for training and inference (schema v2)."""
import re
import unicodedata
import numpy as np
import pandas as pd

SCHEMA_VERSION = 2
UNKNOWN = "Không rõ"
DISTRICT_COORDS = {
    "Hải Châu": (16.0611, 108.2208), "Thanh Khê": (16.065, 108.19),
    "Sơn Trà": (16.078, 108.238), "Ngũ Hành Sơn": (16.015, 108.252),
    "Liên Chiểu": (16.075, 108.145), "Cẩm Lệ": (16.012, 108.205),
    "Hòa Vang": (15.985, 108.12),
}
# Coarse service envelope, NOT administrative district polygons.
BOUNDS = {"south": 15.7, "north": 16.3, "west": 107.7, "east": 108.4}
AREA_MIN, AREA_MAX = 25, 1200
OPTIONAL_NUMERIC = {
    "frontage": (0.01, 1000), "road_width": (0, 200),
    "num_bedrooms": (0, 100), "num_toilets": (0, 100), "num_floors": (0, 100),
}
NUMERIC = ["area", "log_area", *OPTIONAL_NUMERIC, "total_rooms", "is_car_road",
           "near_school", "near_hospital", "near_market", "near_beach", "amenity_score"]
LOW_CARD = ["district", "property_type", "legal_status", "direction"]
HIGH_CARD = ["ward_key", "street_key"]
FEATURES = LOW_CARD + HIGH_CARD + NUMERIC


def text(value):
    if value is None or pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", str(value))).strip()


def normalize_location(value):
    return re.sub(r"^(quận|huyện|phường|xã|thị xã|thành phố|đường|phố|kiệt|hẻm)\s+",
                  "", text(value), flags=re.I).strip()


def canonical_district(value):
    cleaned = normalize_location(value).casefold()
    return next((name for name in DISTRICT_COORDS if name.casefold() == cleaned), "")


def normalize_direction(value):
    value = re.sub(r"\s*[-,]\s*", " ", text(value)).casefold()
    directions = ["Bắc", "Nam", "Đông", "Tây", "Đông Bắc", "Đông Nam", "Tây Bắc", "Tây Nam"]
    return next((d for d in directions if d.casefold() == value), UNKNOWN)


AMENITIES = {
    "near_school": r"trường|đại học|cấp [123]|mầm non",
    "near_hospital": r"bệnh viện|y tế|phòng khám|đa khoa",
    "near_market": r"chợ|siêu thị|winmart|vincom|coopmart|lotte|tttm",
    "near_beach": r"biển|mỹ khê|sông hàn",
}


def has_term(value, pattern):
    value = text(value).casefold()
    for match in re.finditer(r"(?<!\w)(?:" + pattern + r")(?!\w)", value):
        prefix = value[max(0, match.start() - 45):match.start()]
        if not re.search(r"(?:không|chưa|xa|cách xa)(?:\s+\w+){0,4}\s*$", prefix):
            return 1
    return 0


def infer_legal(value):
    if has_term(value, r"sổ đỏ|sổ hồng|sổ sẵn|pháp lý chuẩn|công chứng"):
        return "Đã có sổ"
    if has_term(value, r"hợp đồng mua bán|giấy tay|vi bằng|chưa có sổ"):
        return "Hợp đồng/Khác"
    return UNKNOWN


def engineer_features(frame):
    frame = frame.copy()
    frame["district"] = frame["district"].map(canonical_district)
    for col in ["ward", "street"]:
        frame[col] = frame[col].map(normalize_location).replace("", UNKNOWN)
    frame["direction"] = frame["direction"].map(normalize_direction)
    frame["property_type"] = frame["property_type"].map(text).replace("Nhà riêng", "Nhà")
    frame["legal_status"] = frame["legal_status"].map(text).replace("", UNKNOWN)
    frame["ward_key"] = frame["district"] + "|" + frame["ward"].str.casefold()
    frame["street_key"] = frame["district"] + "|" + frame["street"].str.casefold()
    for col, (lower, upper) in OPTIONAL_NUMERIC.items():
        values = pd.to_numeric(frame[col], errors="coerce")
        frame[col] = values.where(values.between(lower, upper))
    is_land = frame["property_type"].eq("Đất")
    frame.loc[is_land, ["num_bedrooms", "num_toilets", "num_floors"]] = 0
    frame["log_area"] = np.log1p(frame["area"])
    frame["total_rooms"] = frame["num_bedrooms"] + frame["num_toilets"]
    frame["is_car_road"] = np.where(frame["road_width"].isna(), np.nan, (frame["road_width"] >= 4.5).astype(float))
    for name, pattern in AMENITIES.items():
        frame[name] = frame["amenity_text"].map(lambda value: has_term(value, pattern))
    frame["amenity_score"] = frame.near_school * 1.5 + frame.near_hospital + frame.near_market * 1.5 + frame.near_beach * 2
    # Detailed GPS is deliberately excluded: training data has no property GPS.
    return frame[FEATURES]


def distance_km(lat, lon, target_lat, target_lon):
    lat, lon, target_lat, target_lon = np.radians([lat, lon, target_lat, target_lon])
    a = np.sin((target_lat-lat)/2)**2 + np.cos(lat)*np.cos(target_lat)*np.sin((target_lon-lon)/2)**2
    return float(6371 * 2 * np.arcsin(np.sqrt(np.clip(a, 0, 1))))
