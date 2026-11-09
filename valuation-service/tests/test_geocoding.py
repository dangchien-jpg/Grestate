import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi import HTTPException
import geocoding
from app import require_service_token


class GeocodingTests(unittest.TestCase):
    def setUp(self):
        geocoding._cache.clear()
        geocoding._last_call = 0

    def test_cache_avoids_repeating_provider_request(self):
        result = [{"lat": "16.06", "lon": "108.22", "address": {"road": "Đường A"}}]
        with patch.object(geocoding, "urlopen", return_value=io.StringIO(json.dumps(result))) as upstream, patch.object(geocoding.time, "sleep"):
            first = geocoding.lookup("search", {"q": "A, Da Nang"})
            second = geocoding.lookup("search", {"q": "A, Da Nang"})
            self.assertEqual(first, second)
            self.assertEqual(first["street"], "A")
            self.assertEqual(upstream.call_count, 1)
            self.assertIn("bounded=1", upstream.call_args.args[0].full_url)
            self.assertEqual(upstream.call_args.kwargs["timeout"], 8)

    def test_provider_calls_are_spaced(self):
        geocoding._last_call = 10
        with patch.object(geocoding.time, "monotonic", return_value=10.5), patch.object(geocoding.time, "sleep") as sleep, patch.object(geocoding, "urlopen", return_value=io.StringIO("[]")):
            geocoding.lookup("search", {"q": "B"})
            self.assertAlmostEqual(sleep.call_args.args[0], .6)

    def test_outside_region_is_not_returned(self):
        with patch.object(geocoding, "urlopen", return_value=io.StringIO('[{"lat": "21", "lon": "105"}]')), patch.object(geocoding.time, "sleep"):
            self.assertIsNone(geocoding.lookup("search", {"q": "C"}))

    def test_upstream_failure_has_safe_message(self):
        with patch.object(geocoding, "urlopen", side_effect=OSError("internal-detail")), patch.object(geocoding.time, "sleep"):
            with self.assertRaises(HTTPException) as caught:
                geocoding.lookup("search", {"q": "D"})
            self.assertEqual(caught.exception.status_code, 503)
            self.assertNotIn("internal-detail", caught.exception.detail)

    def test_configured_service_token_is_enforced(self):
        with patch.dict("os.environ", {"VALUATION_SERVICE_TOKEN": "test-key"}):
            with self.assertRaises(HTTPException) as caught:
                require_service_token("wrong-key")
            self.assertEqual(caught.exception.status_code, 401)
            require_service_token("test-key")


if __name__ == "__main__":
    unittest.main()
