import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/libs/prisma.js";
import { fetchCensorPosts, fetchCensorPostDetail } from "../src/controllers/admin-censor-post.controller.js";

after(() => prisma.$disconnect());

test("admin listing and detail validate input and return safe relations", async () => {
  const originals = { transaction: prisma.$transaction, count: prisma.tinDang.count, many: prisma.tinDang.findMany, first: prisma.tinDang.findFirst };
  const record = { maTinDang: 7, giaNiemYet: "3000000000", dienTich: "65.5", matTien: null, matDuong: "5", viDo: null, kinhDo: null, hinhAnhTinDangs: [{ maHinhAnh: 1, hinhAnhUrl: "cover.jpg", laAnhDaiDien: true }], lichSuKiemDuyets: [] };
  const user = { maNguoiDung: 42, maVaiTro: 2, trangThai: "HOAT_DONG", deletedAt: null };
  let listQuery, detailQuery, countQuery, found = record;
  prisma.$transaction = async (operations) => Promise.all(operations);
  prisma.tinDang.count = async (query) => { countQuery = query; return 10; };
  prisma.tinDang.findMany = async (query) => { listQuery = query; return [record]; };
  prisma.tinDang.findFirst = async (query) => { detailQuery = query; return found; };
  async function call(fn, overrides = {}) {
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await fn({ user, query: {}, params: { maTinDang: "7" }, ...overrides }, res);
    return res;
  }
  try {
    for (const handler of [fetchCensorPosts, fetchCensorPostDetail]) {
      assert.equal((await call(handler, { user: null })).code, 401);
      for (const override of [{ maVaiTro: 1 }, { trangThai: "BI_KHOA" }, { deletedAt: new Date() }]) {
        assert.equal((await call(handler, { user: { ...user, ...override } })).code, 403);
      }
    }
    for (const query of [{ status: "INVALID" }, { page: "0" }, { limit: "51" }, { page: "1.2" }]) {
      assert.equal((await call(fetchCensorPosts, { query })).code, 400);
    }
    const response = await call(fetchCensorPosts, { query: { status: "CHO_KIEM_DUYET", page: "2", limit: "9" } });
    assert.equal(response.code, 200);
    assert.equal(response.body.total, 10);
    assert.equal(response.body.posts[0].giaNiemYet, 3000000000);
    assert.equal(response.body.posts[0].anhDaiDienUrl, "cover.jpg");
    assert.equal(listQuery.skip, 9);
    assert.equal(listQuery.take, 9);
    assert.deepEqual(listQuery.where, { deletedAt: null, trangThai: "CHO_KIEM_DUYET" });
    assert.deepEqual(countQuery.where, listQuery.where);
    assert.equal(listQuery.include.nguoiDang.select.matKhauHash, undefined);
    await call(fetchCensorPosts, { query: { status: "ALL" } });
    assert.deepEqual(listQuery.where, { deletedAt: null });
    assert.equal((await call(fetchCensorPostDetail, { params: { maTinDang: "bad" } })).code, 400);
    assert.equal((await call(fetchCensorPostDetail)).code, 200);
    assert.deepEqual(detailQuery.where, { maTinDang: 7, deletedAt: null });
    assert.deepEqual(detailQuery.include.lichSuKiemDuyets.include.nguoiDung, { select: { hoTen: true } });
    found = null;
    assert.equal((await call(fetchCensorPostDetail)).code, 404);
  } finally {
    prisma.$transaction = originals.transaction;
    prisma.tinDang.count = originals.count;
    prisma.tinDang.findMany = originals.many;
    prisma.tinDang.findFirst = originals.first;
  }
});
