import { test, after } from "node:test";
import assert from "node:assert/strict";
import prisma from "../src/libs/prisma.js";
import { acceptPost, rejectPost } from "../src/controllers/admin-censor-post.controller.js";

after(() => prisma.$disconnect());

test("post moderation validates access, transitions and atomic history", async () => {
  const original = prisma.$transaction;
  const oldError = console.error;
  let post, history, failHistory, transactions;
  function reset() {
    post = { maTinDang: 7, trangThai: "CHO_KIEM_DUYET", ngayDang: null, deletedAt: null };
    history = [];
    failHistory = false;
    transactions = 0;
  }
  const req = () => ({
    params: { maTinDang: "7" },
    user: { maNguoiDung: 42, maVaiTro: 2, trangThai: "HOAT_DONG", deletedAt: null },
    body: { lyDoTuChoi: "  Invalid listing  " },
  });
  async function call(handler, request = req()) {
    const res = {
      status(code) { this.code = code; return this; },
      json(body) { this.body = body; return this; },
    };
    await handler(request, res);
    return res;
  }
  prisma.$transaction = async (callback) => {
    transactions++;
    const snapshot = structuredClone({ post, history });
    try {
      return await callback({
        tinDang: {
          updateMany: async ({ where, data }) => {
            assert.deepEqual(where, { maTinDang: 7, deletedAt: null, trangThai: "CHO_KIEM_DUYET" });
            if (!post || post.deletedAt || post.trangThai !== where.trangThai) return { count: 0 };
            Object.assign(post, data);
            return { count: 1 };
          },
          findFirst: async () => post && !post.deletedAt ? { maTinDang: 7 } : null,
          findUnique: async () => ({ maTinDang: 7, trangThai: post.trangThai, ngayDang: post.ngayDang }),
        },
        lichSuKiemDuyet: {
          create: async ({ data }) => {
            if (failHistory) throw new Error("History write failed");
            history.push(data);
            return data;
          },
        },
      });
    } catch (error) {
      ({ post, history } = snapshot);
      throw error;
    }
  };
  console.error = () => {};
  try {
    reset();
    assert.equal((await call(acceptPost, { ...req(), user: null })).code, 401);
    for (const overrides of [{ maVaiTro: 1 }, { trangThai: "BI_KHOA" }, { deletedAt: new Date() }]) {
      assert.equal((await call(acceptPost, { ...req(), user: { ...req().user, ...overrides } })).code, 403);
    }
    for (const id of ["abc", "0", "-1", "1.5"]) {
      assert.equal((await call(acceptPost, { ...req(), params: { maTinDang: id } })).code, 400);
    }
    for (const reason of [undefined, null, 123, "  ", "a".repeat(65536)]) {
      assert.equal((await call(rejectPost, { ...req(), body: { lyDoTuChoi: reason } })).code, 400);
    }
    assert.equal(transactions, 0);

    assert.equal((await call(acceptPost)).code, 200);
    assert.equal(post.trangThai, "DA_DUYET");
    assert.ok(post.ngayDang instanceof Date);
    assert.deepEqual(history, [{ maTinDang: 7, maNguoiDung: 42, ketQua: "DA_DUYET", lyDoTuChoi: null }]);
    assert.equal((await call(rejectPost)).code, 409);
    assert.equal(history.length, 1);

    reset();
    assert.equal((await call(rejectPost)).code, 200);
    assert.equal(post.trangThai, "TU_CHOI");
    assert.equal(post.ngayDang, null);
    assert.equal(history[0].lyDoTuChoi, "Invalid listing");
    assert.equal(history[0].ketQua, "TU_CHOI");

    for (const absent of [null, { ...post, deletedAt: new Date() }]) {
      reset();
      post = absent;
      assert.equal((await call(acceptPost)).code, 404);
      assert.equal(history.length, 0);
    }

    reset();
    failHistory = true;
    assert.equal((await call(acceptPost)).code, 500);
    assert.equal(post.trangThai, "CHO_KIEM_DUYET");
    assert.equal(history.length, 0);
  } finally {
    prisma.$transaction = original;
    console.error = oldError;
  }
});
