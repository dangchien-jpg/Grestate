import { after, before, beforeEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/libs/prisma.js";
import postRoute from "../src/routes/post.route.js";

let server, baseUrl, query, calls = 0, fail = false;
let rows = [];
const originalFindUser = prisma.nguoiDung.findUnique;
const originalFindPosts = prisma.tinDang.findMany;
const originalSecret = process.env.ACCESS_TOKEN_SECRET;

before(async () => {
  process.env.ACCESS_TOKEN_SECRET = "user-posts-tests-only";
  prisma.nguoiDung.findUnique = async ({ where }) => ({ maNguoiDung: where.maNguoiDung });
  // Isolate reads: no real database calls are made.
  prisma.tinDang.findMany = async (options) => {
    query = options;
    calls++;
    if (fail) throw new Error("Database error");
    return rows.filter((post) => post.deletedAt === null &&
      (options.where.maNguoiDung === undefined || post.maNguoiDung === options.where.maNguoiDung));
  };
  const app = express();
  app.use("/api/posts", postRoute);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/posts`;
});

beforeEach(() => { rows = []; fail = false; });
after(async () => {
  await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });
  prisma.nguoiDung.findUnique = originalFindUser;
  prisma.tinDang.findMany = originalFindPosts;
  if (originalSecret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = originalSecret;
  await prisma.$disconnect();
});

const headers = (id) => ({
  Authorization: `Bearer ${jwt.sign({ userId: id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" })}`,
});

test("my posts require login before querying the database", async () => {
  const previousCalls = calls;
  assert.equal((await fetch(`${baseUrl}/me`)).status, 403);
  assert.equal(calls, previousCalls);
});

test("my posts exclude deleted records and other accounts regardless of query parameters", async () => {
  const post = {
    maTinDang: 7, maNguoiDung: 12, deletedAt: null,
    trangThai: "CHO_KIEM_DUYET", giaNiemYet: "3000000000", dienTich: "65.25",
    matTien: null, matDuong: null, viDo: null, kinhDo: null,
    hinhAnhTinDangs: [{ hinhAnhUrl: "https://example.test/cover.jpg", laAnhDaiDien: true }],
  };
  rows = [post, { ...post, maTinDang: 8, deletedAt: new Date() },
    { ...post, maTinDang: 9, maNguoiDung: 34 },
    { ...post, maTinDang: 10, trangThai: "DA_DUYET", hinhAnhTinDangs: [] }];
  const response = await fetch(`${baseUrl}/me?maNguoiDung=34`, { headers: headers(12) });
  assert.equal(response.status, 200);
  assert.deepEqual(query.where, { maNguoiDung: 12, deletedAt: null });
  assert.deepEqual(query.orderBy, [{ createdAt: "desc" }, { maTinDang: "desc" }]);
  const body = await response.json();
  assert.equal(body.total, 2);
  assert.deepEqual(body.posts.map((item) => item.maTinDang), [7, 10]);
  assert.equal(body.posts[0].giaNiemYet, 3000000000);
  assert.equal(body.posts[0].dienTich, 65.25);
  assert.equal(body.posts[0].anhDaiDienUrl, "https://example.test/cover.jpg");
  assert.equal(body.posts[1].anhDaiDienUrl, null);
});

test("another account gets its own empty list", async () => {
  const response = await fetch(`${baseUrl}/me`, { headers: headers(34) });
  assert.equal(response.status, 200);
  assert.deepEqual(query.where, { maNguoiDung: 34, deletedAt: null });
  assert.deepEqual(await response.json(), { posts: [], total: 0 });
});

test("database errors return a safe JSON message", async () => {
  fail = true;
  const log = mock.method(console, "error", () => {});
  try {
    const response = await fetch(`${baseUrl}/me`, { headers: headers(12) });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: "Lấy danh sách tin đăng thất bại" });
  } finally { log.mock.restore(); }
});
