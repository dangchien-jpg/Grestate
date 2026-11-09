import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/libs/prisma.js";
import { protectedRoute } from "../src/middlewares/auth.middleware.js";
import valuationRoute from "../src/routes/valuation.route.js";

let gateway, upstream, base, lastRequest;
let savedFind;
const environment = {};
const listen = (server) =>
  new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const close = (server) =>
  new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
const headers = (id = 1) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${jwt.sign({ userId: id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" })}`,
});

before(async () => {
  for (const key of [
    "ACCESS_TOKEN_SECRET",
    "VALUATION_SERVICE_URL",
    "VALUATION_SERVICE_TOKEN",
  ])
    environment[key] = process.env[key];
  process.env.ACCESS_TOKEN_SECRET = "isolated-valuation-test-secret";
  process.env.VALUATION_SERVICE_TOKEN = "isolated-service-test-key";
  savedFind = prisma.nguoiDung.findUnique;
  // No real database reads or writes during these tests.
  prisma.nguoiDung.findUnique = async ({ where }) => ({
    maNguoiDung: where.maNguoiDung,
  });
  upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length
      ? JSON.parse(Buffer.concat(chunks).toString())
      : null;
    lastRequest = {
      url: req.url,
      body,
      token: req.headers["x-valuation-token"],
    };
    res.setHeader("Content-Type", "application/json");
    if (body?.area === 0) {
      res.statusCode = 422;
      res.end(
        JSON.stringify({
          detail: [{ loc: ["body", "area"], msg: "Invalid area" }],
        }),
      );
    } else
      res.end(
        JSON.stringify({ status: "success", model_name: "selected-model" }),
      );
  });
  await listen(upstream);
  process.env.VALUATION_SERVICE_URL = `http://127.0.0.1:${upstream.address().port}`;
  const app = express();
  app.use(express.json());
  app.use("/api/valuation", protectedRoute, valuationRoute);
  gateway = http.createServer(app);
  await listen(gateway);
  base = `http://127.0.0.1:${gateway.address().port}/api/valuation`;
});

after(async () => {
  await close(gateway);
  await close(upstream);
  prisma.nguoiDung.findUnique = savedFind;
  await prisma.$disconnect();
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("valuation endpoints require authentication", async () => {
  const response = await fetch(`${base}/metadata`);
  assert.equal(response.status, 403);
});

test("authenticated prediction forwards payload without depth and service token", async () => {
  const payload = { area: 100, frontage: null };
  const response = await fetch(`${base}/predict`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(lastRequest.body, payload);
  assert.equal(lastRequest.url, "/api/predict");
  assert.equal(lastRequest.token, "isolated-service-test-key");
});

test("field validation details reach the frontend", async () => {
  const response = await fetch(`${base}/predict`, {
    method: "POST",
    headers: headers(2),
    body: JSON.stringify({ area: 0 }),
  });
  assert.equal(response.status, 422);
  assert.deepEqual((await response.json()).detail[0].loc, ["body", "area"]);
});

test("geocoding query is encoded and unknown parameters are not forwarded", async () => {
  const query = "Đường A & B, Đà Nẵng";
  const response = await fetch(
    `${base}/geocode?q=${encodeURIComponent(query)}&url=ignored`,
    { headers: headers() },
  );
  assert.equal(response.status, 200);
  const parsed = new URL(lastRequest.url, "http://test");
  assert.equal(parsed.searchParams.get("q"), query);
  assert.equal(parsed.searchParams.has("url"), false);
});

test("prediction rate is limited per account", async () => {
  for (let i = 0; i < 12; i++) {
    const response = await fetch(`${base}/predict`, {
      method: "POST",
      headers: headers(3),
      body: JSON.stringify({ area: 100 }),
    });
    assert.equal(response.status, 200);
    await response.json();
  }
  const response = await fetch(`${base}/predict`, {
    method: "POST",
    headers: headers(3),
    body: JSON.stringify({ area: 100 }),
  });
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("Retry-After")) > 0);
});
