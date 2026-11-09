"""Bounded, cached Nominatim access. Run one API worker for the global rate limit."""
from collections import OrderedDict
import json
import os
import threading
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from fastapi import HTTPException
from features import BOUNDS, canonical_district, normalize_location

_lock = threading.Lock()
_cache = OrderedDict()
_last_call = 0.0
_TTL = 86400


def lookup(kind, params):
    global _last_call
    key = (kind, tuple(sorted(params.items())))
    # Reject excess concurrency instead of creating an unbounded queue.
    if not _lock.acquire(timeout=2):
        raise HTTPException(429, "Tra cứu địa chỉ đang bận. Vui lòng thử lại.")
    try:
        now = time.monotonic()
        cached = _cache.get(key)
        if cached and now - cached[0] < _TTL:
            _cache.move_to_end(key)
            return cached[1]
        time.sleep(max(0, 1.1 - (now - _last_call)))
        _last_call = time.monotonic()
        base = os.getenv("GEOCODER_URL", "https://nominatim.openstreetmap.org").rstrip("/")
        query = {"format": "json", "accept-language": "vi", "addressdetails": "1", **params}
        if kind == "search":
            query.update(limit="1", countrycodes="vn", bounded="1",
                         viewbox=f"{BOUNDS['west']},{BOUNDS['north']},{BOUNDS['east']},{BOUNDS['south']}")
        request = Request(f"{base}/{kind}?{urlencode(query)}", headers={"User-Agent": os.getenv("GEOCODER_USER_AGENT", "GrestateValuation/2.0 (property-location lookup)")})
        try:
            with urlopen(request, timeout=8) as response:
                data = json.load(response)
        except Exception as error:
            raise HTTPException(503, "Không tra cứu được địa chỉ. Bạn có thể ghim vị trí trên bản đồ.") from error
        item = (data[0] if data else None) if kind == "search" else data
        result = None
        if item and "lat" in item and "lon" in item:
            lat, lon = float(item["lat"]), float(item["lon"])
            if BOUNDS["south"] <= lat <= BOUNDS["north"] and BOUNDS["west"] <= lon <= BOUNDS["east"]:
                address = item.get("address", {})
                district = next((canonical_district(address.get(key, "")) for key in ["city_district", "county", "suburb"] if canonical_district(address.get(key, ""))), "")
                result = {"lat": lat, "lon": lon, "street": normalize_location(address.get("road", "")),
                          "district": district, "label": item.get("display_name", "")}
        _cache[key] = (time.monotonic(), result)
        _cache.move_to_end(key)
        while len(_cache) > 2000:
            _cache.popitem(last=False)
        return result
    finally:
        _lock.release()
