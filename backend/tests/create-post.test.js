import { test, before, beforeEach, afterEach, after, mock } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import express from "express";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../src/libs/prisma.js";
import postRoute from "../src/routes/post.route.js";

let server, url, token, saved;
let uploadCount, uploadFailure, databaseFailure, group, wardExists, categoryExists, legalExists;
const removed = [];
const restorePrisma = [];
function stubPrisma(model, method, implementation) {
  const delegate = prisma[model];
  const original = delegate[method];
  delegate[method] = implementation;
  restorePrisma.push(() => { delegate[method] = original; });
}
const base = () => ({
  title: "Test listing", description: "Description", categoryId: 1,
  legalDocumentId: 1, provinceCode: "01", wardId: 1, address: "Address",
  price: "2000000000", area: "50.25", matTien: "5.5", matDuong: "6",
  bedrooms: "2", bathrooms: "1", floors: "3", nguoiLienHe: "Contact",
  soDienThoaiLienHe: "0912345678",
});
before(async () => {
  process.env.ACCESS_TOKEN_SECRET = "post-tests-only-secret";
  token = jwt.sign({ userId: 42 }, process.env.ACCESS_TOKEN_SECRET);
  const app = express();
  app.use(express.json());
  app.use("/api/posts", postRoute);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  url = `http://127.0.0.1:${server.address().port}/api/posts`;
});
beforeEach(() => {
  saved = null; uploadCount = 0; uploadFailure = 0; databaseFailure = false;
  group = "NHA"; wardExists = categoryExists = legalExists = true; removed.length = 0;
  mock.method(console, "error", () => {});
  stubPrisma("nguoiDung", "findUnique", async () => ({ maNguoiDung: 42, trangThai: "HOAT_DONG", deletedAt: null }));
  stubPrisma("loaiBatDongSan", "findFirst", async () => categoryExists ? { nhomBatDongSan: group } : null);
  stubPrisma("giayToPhapLy", "findFirst", async () => legalExists ? { maGiayTo: 1 } : null);
  stubPrisma("phuongXa", "findFirst", async () => wardExists ? { maPhuongXa: 1 } : null);
  stubPrisma("tinDang", "create", async ({ data }) => {
    if (databaseFailure) throw new Error("Database unavailable");
    saved = data;
    return { ...data, maTinDang: 123, viDo: null, kinhDo: null, hinhAnhTinDangs: data.hinhAnhTinDangs.create };
  });
  mock.method(cloudinary.uploader, "upload_stream", (options, callback) => {
    assert.equal(options.folder, "Grestate/post");
    assert.equal(options.resource_type, "image");
    const index = ++uploadCount;
    return new Writable({ write(_chunk, _encoding, done) { done(); }, final(done) {
      if (uploadFailure === index) callback(new Error("Upload failed"));
      else callback(null, { public_id: `post-${index}`, secure_url: `https://example.test/${index}.jpg` });
      done();
    } });
  });
  mock.method(cloudinary.uploader, "destroy", async (id) => { removed.push(id); return { result: "ok" }; });
});
afterEach(() => { restorePrisma.splice(0).reverse().forEach(restore => restore()); mock.restoreAll(); });
after(async () => { await new Promise(resolve => server.close(resolve)); await prisma.$disconnect(); });
async function send(data = base(), { count = 1, mime = "image/jpeg", auth = true, size = 3 } = {}) {
  const form = new FormData();
  form.append("data", typeof data === "string" ? data : JSON.stringify(data));
  for (let i = 0; i < count; i++) form.append("images", new Blob([Buffer.alloc(size)], { type: mime }), `image-${i}.jpg`);
  const response = await fetch(url, { method: "POST", headers: auth ? { Authorization: `Bearer ${token}` } : {}, body: form });
  return { status: response.status, body: await response.json() };
}
test("creates listing and ordered images, server controls ownership and status", async () => {
  const {status, body} = await send({...base(), maNguoiDung: 999, trangThai: "DA_DUYET"}, {count: 2});
  assert.equal(status, 201);
  assert.equal(saved.maNguoiDung, 42);
  assert.equal(saved.trangThai, "CHO_KIEM_DUYET");
  assert.equal(saved.soPhongNgu, 2);
  assert.equal(body.post.giaNiemYet, 2000000000);
  assert.equal(body.post.matTien, 5.5);
  assert.deepEqual(saved.hinhAnhTinDangs.create.map(i => [i.thuTuHienThi, i.laAnhDaiDien]), [[0,true],[1,false]]);
});
test("requires authentication before receiving images", async () => {
  assert.equal((await send(base(), {auth:false})).status, 403);
  assert.equal(uploadCount, 0);
});
test("rejects missing contacts and invalid decimals before uploading", async () => {
  for (const change of [{nguoiLienHe:" "}, {soDienThoaiLienHe:"abc"}, {price:"2.000.000.000"}, {area:"1.234"}, {area:"10000000000"}, {bedrooms:"-1"}]) {
    assert.equal((await send({...base(), ...change})).status, 400);
  }
  assert.equal(uploadCount, 0);
});
test("rejects invalid JSON, missing, excessive, unsupported and empty files", async () => {
  assert.equal((await send("{")).status, 400);
  for (const options of [{count:0}, {count:7}, {mime:"text/plain"}, {size:0}, {size:10*1024*1024+1}]) {
    assert.equal((await send(base(), options)).status, 400);
  }
  assert.equal(uploadCount, 0);
});
test("validates database references before uploading", async () => {
  wardExists = false;
  assert.equal((await send()).status, 400);
  wardExists = true; categoryExists = false;
  assert.equal((await send()).status, 400);
  categoryExists = true; legalExists = false;
  assert.equal((await send()).status, 400);
  assert.equal(uploadCount, 0);
});
test("land ignores house-only fields and accepts optional legal document", async () => {
  group = "DAT";
  assert.equal((await send({...base(), bedrooms:"invalid", legalDocumentId:null})).status, 201);
  assert.equal(saved.soPhongNgu, null);
  assert.equal(saved.noiThat, null);
  assert.equal(saved.huongBanCong, null);
  assert.equal(saved.maGiayTo, null);
});
test("cleans up earlier uploads when a later upload fails", async () => {
  uploadFailure = 2;
  assert.equal((await send(base(), {count:3})).status, 500);
  assert.deepEqual(removed, ["post-1"]);
  assert.equal(saved, null);
});
test("cleans up all images when atomic database create fails", async () => {
  databaseFailure = true;
  assert.equal((await send(base(), {count:2})).status, 500);
  assert.deepEqual(removed.sort(), ["post-1", "post-2"]);
});


test("persists coordinates with seven decimal places", async () => {
  assert.equal((await send({...base(), viDo: 10.762622, kinhDo: 106.660172})).status, 201);
  assert.equal(saved.viDo, "10.7626220");
  assert.equal(saved.kinhDo, "106.6601720");
});

test("rejects invalid or incomplete coordinate pairs before upload", async () => {
  for (const change of [
    {viDo: 91, kinhDo: 106}, {viDo: 10, kinhDo: 181},
    {viDo: 10}, {kinhDo: 106}, {viDo: "abc", kinhDo: 106},
    {viDo: " ", kinhDo: " "}, {viDo: true, kinhDo: 106},
  ]) assert.equal((await send({...base(), ...change})).status, 400);
  assert.equal(uploadCount, 0);
});


test("creates a listing without coordinates or a geocoding key", async () => {
  const previousKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  delete process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
  try {
    const {status, body} = await send();
    assert.equal(status, 201);
    assert.equal(saved.viDo, null);
    assert.equal(saved.kinhDo, null);
    assert.equal(body.post.viDo, null);
    assert.equal(body.post.kinhDo, null);
    assert.equal(saved.diaChiChiTiet, base().address);
    assert.equal(saved.maPhuongXa, base().wardId);
    assert.equal(uploadCount, 1);
  } finally {
    if (previousKey === undefined) delete process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
    else process.env.GOOGLE_MAPS_GEOCODING_API_KEY = previousKey;
  }
});

test("accepts explicitly empty coordinates", async () => {
  for (const value of [null, ""]) {
    assert.equal((await send({...base(), viDo: value, kinhDo: value})).status, 201);
    assert.equal(saved.viDo, null);
    assert.equal(saved.kinhDo, null);
  }
});
