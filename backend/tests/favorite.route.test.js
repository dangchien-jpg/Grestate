import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import prisma from "../src/libs/prisma.js";
import { protectedRoute } from "../src/middlewares/auth.middleware.js";
import favoriteRoute from "../src/routes/favorite.route.js";

let server, base, lastQuery;
let records = [];
let findCalls = 0;
const originalFindUser = prisma.nguoiDung.findUnique;
const originalFindFavorites = prisma.tinDangYeuThich.findMany;
const originalSecret = process.env.ACCESS_TOKEN_SECRET;

before(async () => {
  process.env.ACCESS_TOKEN_SECRET = "favorite-route-test-only";
  prisma.nguoiDung.findUnique = async ({ where }) => ({
    maNguoiDung: where.maNguoiDung,
  });
  // These tests never query or mutate a real database.
  prisma.tinDangYeuThich.findMany = async (query) => {
    findCalls++;
    lastQuery = query;
    return records;
  };
  const app = express();
  app.use("/api/favorites", protectedRoute, favoriteRoute);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}/api/favorites`;
});

after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
  prisma.nguoiDung.findUnique = originalFindUser;
  prisma.tinDangYeuThich.findMany = originalFindFavorites;
  if (originalSecret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = originalSecret;
  await prisma.$disconnect();
});

function headers(userId) {
  return {
    Authorization: `Bearer ${jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" })}`,
  };
}

test("favorites require login before querying favorites", async () => {
  const beforeCalls = findCalls;
  const response = await fetch(base);
  assert.equal(response.status, 403);
  assert.equal(findCalls, beforeCalls);
});

test("favorites use the authenticated account and exclude deleted posts", async () => {
  records = [];
  for (const id of [12, 34]) {
    const response = await fetch(`${base}?maNguoiDung=999`, { headers: headers(id) });
    assert.equal(response.status, 200);
    assert.deepEqual(lastQuery.where, {
      maNguoiDung: id,
      tinDang: { deletedAt: null },
    });
    assert.deepEqual(await response.json(), { posts: [], total: 0 });
  }
  assert.deepEqual(lastQuery.orderBy, [{ ngayLuu: "desc" }, { maTinDang: "desc" }]);
});

test("favorite cards serialize numeric prices, photo count and location", async () => {
  const saved = "2026-11-09T01:00:00.000Z";
  const post = {
    maTinDang: 7,
    tieuDe: "Căn hộ tham khảo",
    giaNiemYet: "5500000.00",
    dienTich: "64.00",
    soPhongNgu: 2,
    soPhongTam: 2,
    diaChiChiTiet: "123 đường mẫu",
    ngayDang: saved,
    createdAt: saved,
    trangThai: "CHO_KIEM_DUYET",
    phuongXa: {
      maPhuongXa: 4,
      tenPhuongXa: "Phường Ba Đình",
      tinhThanh: { maTinhThanh: "01", tenTinhThanh: "Thành phố Hà Nội" },
    },
    hinhAnhTinDangs: [{ hinhAnhUrl: "https://example.com/cover.jpg" }],
    _count: { hinhAnhTinDangs: 9 },
  };
  records = [{ ngayLuu: saved, tinDang: post }];
  const response = await fetch(base, { headers: headers(12) });
  assert.equal(response.status, 200);
  const { posts, total } = await response.json();
  assert.equal(total, 1);
  assert.equal(posts[0].giaNiemYet, 5500000);
  assert.equal(posts[0].dienTich, 64);
  assert.equal(posts[0].soHinhAnh, 9);
  assert.equal(posts[0].anhDaiDienUrl, "https://example.com/cover.jpg");
  assert.deepEqual(posts[0].phuongXa, post.phuongXa);
  assert.equal(posts[0].ngayLuu, saved);
  assert.equal(posts[0].daYeuThich, true);
  assert.equal("_count" in posts[0], false);
  assert.equal(lastQuery.select.tinDang.select.hinhAnhTinDangs.take, 1);
  assert.deepEqual(lastQuery.select.tinDang.select.hinhAnhTinDangs.orderBy[0], {
    laAnhDaiDien: "desc",
  });

  records = [{ ngayLuu: saved, tinDang: {
    ...post, soPhongNgu: null, soPhongTam: null,
    hinhAnhTinDangs: [], _count: { hinhAnhTinDangs: 0 },
  } }];
  const emptyImageResponse = await fetch(base, { headers: headers(12) });
  const body = await emptyImageResponse.json();
  assert.equal(body.posts[0].anhDaiDienUrl, null);
  assert.equal(body.posts[0].soHinhAnh, 0);
  assert.equal(body.posts[0].soPhongNgu, null);
});
