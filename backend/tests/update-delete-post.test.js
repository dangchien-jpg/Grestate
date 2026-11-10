import { test, before, beforeEach, afterEach, after, mock } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import express from "express";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../src/libs/prisma.js";
import postRoute from "../src/routes/post.route.js";

let server, baseUrl, token, existing, updateData, deleteQuery;
let accountActive, categoryGroup, validWard, validCategory, validLegal;
let uploads, failUpload, failDatabase, deletedDuringRequest;
const removed = [];
const restores = [];
const oldSecret = process.env.ACCESS_TOKEN_SECRET;
const data = () => ({
  title: "Nhà được cập nhật", description: "Thông tin mô tả",
  categoryId: 1, legalDocumentId: 1, provinceCode: "01", wardId: 4,
  address: "123 đường mẫu", price: "3000000000", area: "65.25",
  bedrooms: 2, bathrooms: 1, floors: 3,
  nguoiLienHe: "Người liên hệ", soDienThoaiLienHe: "0912345678",
});
function stub(model, method, implementation) {
  const original = prisma[model][method];
  prisma[model][method] = implementation;
  restores.push(() => { prisma[model][method] = original; });
}

before(async () => {
  process.env.ACCESS_TOKEN_SECRET = "post-management-tests-only";
  token = jwt.sign({ userId: 42 }, process.env.ACCESS_TOKEN_SECRET);
  const app = express();
  app.use(express.json());
  app.use("/api/posts", postRoute);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/posts`;
});

beforeEach(() => {
  existing = {
    maTinDang: 7, maNguoiDung: 42, deletedAt: null, trangThai: "DA_DUYET",
    ngayDang: new Date("2026-11-01T01:00:00Z"),
    hinhAnhTinDangs: [{
      maHinhAnh: 11, hinhAnhId: "old-image", hinhAnhUrl: "https://example.test/old.jpg",
      thuTuHienThi: 0, laAnhDaiDien: true,
    }],
  };
  updateData = deleteQuery = null;
  accountActive = validWard = validCategory = validLegal = true;
  categoryGroup = "NHA";
  uploads = failUpload = 0;
  failDatabase = deletedDuringRequest = false;
  removed.length = 0;
  mock.method(console, "error", () => {});
  stub("nguoiDung", "findUnique", async () => ({
    maNguoiDung: 42, deletedAt: null, trangThai: accountActive ? "HOAT_DONG" : "BI_KHOA",
  }));
  stub("tinDang", "findFirst", async ({ where }) =>
    existing && existing.maTinDang === where.maTinDang && existing.deletedAt === null ? existing : null);
  stub("loaiBatDongSan", "findFirst", async () => validCategory ? { nhomBatDongSan: categoryGroup } : null);
  stub("giayToPhapLy", "findFirst", async () => validLegal ? { maGiayTo: 1 } : null);
  stub("phuongXa", "findFirst", async () => validWard ? { maPhuongXa: 4 } : null);
  stub("tinDang", "update", async ({ where, data }) => {
    assert.deepEqual(where, { maTinDang: 7, maNguoiDung: 42, deletedAt: null });
    if (deletedDuringRequest) throw Object.assign(new Error("Record disappeared"), { code: "P2025" });
    if (failDatabase) throw new Error("Database error");
    updateData = data;
    return {
      ...existing, ...data,
      hinhAnhTinDangs: data.hinhAnhTinDangs?.create ?? existing.hinhAnhTinDangs,
    };
  });
  stub("tinDang", "updateMany", async (query) => {
    if (failDatabase) throw new Error("Database error");
    deleteQuery = query;
    if (deletedDuringRequest) return { count: 0 };
    existing.deletedAt = query.data.deletedAt;
    return { count: 1 };
  });
  stub("tinDang", "delete", async () => { assert.fail("Must never hard-delete a post"); });
  mock.method(cloudinary.uploader, "upload_stream", (_options, callback) => {
    const index = ++uploads;
    return new Writable({
      write(_chunk, _encoding, done) { done(); },
      final(done) {
        if (index === failUpload) callback(new Error("Upload failed"));
        else callback(null, { public_id: `new-${index}`, secure_url: `https://example.test/${index}.jpg` });
        done();
      },
    });
  });
  mock.method(cloudinary.uploader, "destroy", async (id) => {
    removed.push(id);
    return { result: "ok" };
  });
});

afterEach(() => {
  restores.splice(0).reverse().forEach((restore) => restore());
  mock.restoreAll();
});
after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
  await prisma.$disconnect();
  if (oldSecret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = oldSecret;
});

async function send(payload = data(), { method = "PUT", id = 7, count = 0, auth = true, mime = "image/jpeg", size = 3 } = {}) {
  const form = new FormData();
  form.append("data", typeof payload === "string" ? payload : JSON.stringify(payload));
  for (let index = 0; index < count; index++) {
    form.append("images", new Blob([Buffer.alloc(size)], { type: mime }), `${index}.jpg`);
  }
  const response = await fetch(`${baseUrl}/${id}`, {
    method, headers: auth ? { Authorization: `Bearer ${token}` } : {},
    ...(method === "PUT" ? { body: form } : {}),
  });
  return { status: response.status, body: await response.json() };
}

test("owner can edit data without replacing images and moderation is reset", async () => {
  const response = await send({ ...data(), maNguoiDung: 99, trangThai: "DA_DUYET", deletedAt: "2020-01-01" });
  assert.equal(response.status, 200);
  assert.equal(updateData.tieuDe, data().title);
  assert.equal(updateData.trangThai, "CHO_KIEM_DUYET");
  assert.equal(updateData.ngayDang, null);
  assert.equal("maNguoiDung" in updateData, false);
  assert.equal("deletedAt" in updateData, false);
  assert.equal("hinhAnhTinDangs" in updateData, false);
  assert.equal(response.body.post.giaNiemYet, 3000000000);
  assert.equal(response.body.post.dienTich, 65.25);
  assert.equal(response.body.post.anhDaiDienUrl, "https://example.test/old.jpg");
  assert.equal(uploads, 0);
  assert.deepEqual(removed, []);
});

test("update and delete require an active authenticated owner", async () => {
  for (const method of ["PUT", "DELETE"]) {
    assert.equal((await send(data(), { method, auth: false, count: 1 })).status, 403);
    existing.maNguoiDung = 99;
    assert.equal((await send(data(), { method, count: 1 })).status, 403);
    existing.maNguoiDung = 42;
    accountActive = false;
    assert.equal((await send(data(), { method })).status, 403);
    accountActive = true;
  }
  assert.equal(uploads, 0);
  assert.equal(updateData, null);
  assert.equal(deleteQuery, null);
});

test("both endpoints reject invalid IDs and missing or already-deleted posts", async () => {
  for (const method of ["PUT", "DELETE"]) {
    for (const id of ["abc", 0, -1, "1.5", 2147483648]) {
      assert.equal((await send(data(), { method, id })).status, 400);
    }
    assert.equal((await send(data(), { method, id: 99 })).status, 404);
    existing.deletedAt = new Date();
    assert.equal((await send(data(), { method })).status, 404);
    existing.deletedAt = null;
  }
  assert.equal(uploads, 0);
});

test("update reuses create validation for required text, numbers, phone and coordinates", async () => {
  for (const patch of [
    { title: " " }, { description: "" }, { address: "" }, { nguoiLienHe: "" },
    { soDienThoaiLienHe: "invalid" }, { area: 0 }, { price: "3.000.000.000" },
    { bedrooms: -1 }, { viDo: 91, kinhDo: 100 }, { viDo: 10 },
  ]) {
    const response = await send({ ...data(), ...patch }, { count: 1 });
    assert.equal(response.status, 400, JSON.stringify(patch));
    assert.ok(response.body.errors);
  }
  assert.equal((await send("{")).status, 400);
  assert.equal(uploads, 0);
  assert.equal(updateData, null);
});

test("update validates category, legal document and ward before upload", async () => {
  validWard = false;
  assert.equal((await send(data(), { count: 1 })).body.errors.wardId.length > 0, true);
  validWard = true; validCategory = false;
  assert.equal((await send()).status, 400);
  validCategory = true; validLegal = false;
  assert.equal((await send()).status, 400);
  assert.equal(uploads, 0);
});

test("land edit clears house-only attributes and can clear optional legal document", async () => {
  categoryGroup = "DAT";
  assert.equal((await send({ ...data(), bedrooms: "not-applicable", legalDocumentId: null })).status, 200);
  for (const key of ["soPhongNgu", "soPhongTam", "soTang", "huongBanCong", "noiThat", "maGiayTo"]) {
    assert.equal(updateData[key], null);
  }
});

test("new images replace the old set in one database update", async () => {
  assert.equal((await send(data(), { count: 2 })).status, 200);
  assert.deepEqual(updateData.hinhAnhTinDangs.deleteMany, {});
  assert.deepEqual(updateData.hinhAnhTinDangs.create.map((image) =>
    [image.thuTuHienThi, image.laAnhDaiDien]), [[0, true], [1, false]]);
  assert.deepEqual(removed, ["old-image"]);
});

test("invalid, excessive, empty or oversized uploads are rejected", async () => {
  for (const options of [{ count: 7 }, { count: 1, mime: "text/plain" }, { count: 1, size: 0 }, { count: 1, size: 10 * 1024 * 1024 + 1 }]) {
    assert.equal((await send(data(), options)).status, 400);
  }
  existing.hinhAnhTinDangs = [];
  assert.equal((await send()).status, 400);
  assert.equal(uploads, 0);
});

test("later upload failure cleans new assets while keeping the original images", async () => {
  failUpload = 2;
  assert.equal((await send(data(), { count: 2 })).status, 500);
  assert.deepEqual(removed, ["new-1"]);
  assert.equal(updateData, null);
});

test("database failure cleans new images without removing original cloud assets", async () => {
  failDatabase = true;
  assert.equal((await send(data(), { count: 2 })).status, 500);
  assert.deepEqual(removed, ["new-1", "new-2"]);
});

test("old image cleanup failure does not report a committed edit as failed", async () => {
  mock.method(cloudinary.uploader, "destroy", async () => { throw new Error("Cloud unavailable"); });
  assert.equal((await send(data(), { count: 1 })).status, 200);
  assert.ok(updateData);
});

test("soft delete only sets deletedAt, keeps images, and hides the detail endpoint", async () => {
  assert.equal((await send(data(), { method: "DELETE" })).status, 200);
  assert.deepEqual(deleteQuery.where, { maTinDang: 7, maNguoiDung: 42, deletedAt: null });
  assert.deepEqual(Object.keys(deleteQuery.data), ["deletedAt"]);
  assert.ok(deleteQuery.data.deletedAt instanceof Date);
  assert.equal(existing.hinhAnhTinDangs.length, 1);
  assert.equal(uploads, 0);
  assert.deepEqual(removed, []);
  assert.equal((await fetch(`${baseUrl}/7`)).status, 404);
  assert.equal((await send(data(), { method: "DELETE" })).status, 404);
});

test("a post deleted after authorization cannot be updated or deleted again", async () => {
  deletedDuringRequest = true;
  assert.equal((await send(data(), { count: 1 })).status, 404);
  assert.deepEqual(removed, ["new-1"]);
  assert.equal((await send(data(), { method: "DELETE" })).status, 404);
});

test("database soft delete error returns a safe failure response", async () => {
  failDatabase = true;
  const response = await send(data(), { method: "DELETE" });
  assert.equal(response.status, 500);
  assert.equal(existing.deletedAt, null);
});
