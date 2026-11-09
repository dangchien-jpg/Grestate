import { Router } from "express";

const router = Router();
const requests = new Map();

// This router is mounted after protectedRoute; req.user is already authenticated.
function rateLimit(req, res, next) {
  const now = Date.now();
  for (const [key, entry] of requests)
    if (entry.until <= now) requests.delete(key);
  const isPrediction = req.method === "POST";
  const key = `${req.user.maNguoiDung}:${isPrediction ? "predict" : "lookup"}`;
  const entry = requests.get(key) || { count: 0, until: now + 60_000 };
  if (++entry.count > (isPrediction ? 12 : 60)) {
    res.set(
      "Retry-After",
      String(Math.max(1, Math.ceil((entry.until - now) / 1000))),
    );
    return res
      .status(429)
      .json({ detail: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau." });
  }
  requests.set(key, entry);
  next();
}

async function forward(req, res) {
  const service = (
    process.env.VALUATION_SERVICE_URL || "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
  const url = new URL(`${service}/api${req.path}`);
  for (const key of ["q", "lat", "lon"]) {
    if (typeof req.query[key] === "string")
      url.searchParams.set(key, req.query[key]);
  }
  try {
    const headers = { "Content-Type": "application/json" };
    if (process.env.VALUATION_SERVICE_TOKEN)
      headers["X-Valuation-Token"] = process.env.VALUATION_SERVICE_TOKEN;
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
      signal: AbortSignal.timeout(25_000),
    });
    const body = await response.json();
    return res.status(response.status).json(body);
  } catch (error) {
    console.error("Valuation service request failed:", error.message);
    return res
      .status(503)
      .json({ detail: "Dịch vụ định giá chưa sẵn sàng. Vui lòng thử lại." });
  }
}

router.use(rateLimit);
router.get("/metadata", forward);
router.post("/predict", forward);
router.get("/geocode", forward);
router.get("/reverse-geocode", forward);
export default router;
