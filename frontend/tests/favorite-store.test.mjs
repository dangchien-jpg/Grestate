import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { create } from "zustand";

// Exercise the actual TypeScript store with isolated auth/network dependencies.
// No server, browser, database or persisted login is used by these tests.
const auth = create(() => ({ user: null }));
const requests = [];
let fetchHandler, addHandler, removeHandler;
const service = {
  fetchAll: () => { requests.push(["GET"]); return fetchHandler(); },
  add: (id) => { requests.push(["POST", id]); return addHandler(id); },
  remove: (id) => { requests.push(["DELETE", id]); return removeHandler(id); },
};
const source = await readFile(new URL("../src/stores/favoriteStore.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 },
}).outputText;
const context = vm.createContext({ console });
const dependencies = {
  zustand: { create },
  "@/services/favoriteService": { favoriteService: service },
  "@/stores/authStore": { useAuthStore: auth },
};
const module = new vm.SourceTextModule(compiled, { context });
await module.link((specifier) => {
  const exports = dependencies[specifier];
  assert.ok(exports, `Unexpected dependency: ${specifier}`);
  return new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
  }, { context });
});
await module.evaluate();
const store = module.namespace.useFavoriteStore;
const post = {
  maTinDang: 7, tieuDe: "Nhà mẫu", giaNiemYet: 3e9, dienTich: 100,
  soPhongNgu: 2, soPhongTam: 1, diaChiChiTiet: "Đường mẫu",
  ngayDang: null, createdAt: "2026-11-09T01:00:00Z", trangThai: "DANG_HIEN_THI",
  phuongXa: { maPhuongXa: 4, tenPhuongXa: "Phường Ba Đình", tinhThanh: { maTinhThanh: "01", tenTinhThanh: "Hà Nội" } },
  anhDaiDienUrl: null, hinhAnhTinDangs: [],
};

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  auth.setState({ user: null });
  auth.setState({ user: { maNguoiDung: 12 } });
  requests.length = 0;
  fetchHandler = async () => ({ posts: [] });
  addHandler = async () => {};
  removeHandler = async () => {};
});

test("loads once, saves via POST and unsaves via DELETE", async () => {
  assert.equal(await store.getState().toggleFavorite(post), true);
  assert.equal(store.getState().posts[0].maTinDang, 7);
  assert.equal(store.getState().posts[0].soHinhAnh, 0);
  assert.equal(await store.getState().toggleFavorite(post), false);
  assert.equal(store.getState().posts.length, 0);
  assert.deepEqual(requests, [["GET"], ["POST", 7], ["DELETE", 7]]);
});

test("hydrates existing favorites before deciding to remove", async () => {
  fetchHandler = async () => ({ posts: [{ ...post, ngayLuu: "2026-11-09T01:00:00Z" }] });
  assert.equal(await store.getState().toggleFavorite(post), false);
  assert.deepEqual(requests, [["GET"], ["DELETE", 7]]);
});

test("coalesces loads and ignores repeated clicks for a pending post", async () => {
  const loading = deferred();
  fetchHandler = () => loading.promise;
  const firstLoad = store.getState().fetchFavorites();
  const secondLoad = store.getState().fetchFavorites();
  const firstClick = store.getState().toggleFavorite(post);
  assert.equal(await store.getState().toggleFavorite(post), null);
  loading.resolve({ posts: [] });
  await Promise.all([firstLoad, secondLoad, firstClick]);
  assert.deepEqual(requests, [["GET"], ["POST", 7]]);
  assert.equal(store.getState().pendingIds.length, 0);
});

test("failed saves keep the heart unsaved and allow retry", async () => {
  addHandler = async () => { throw new Error("offline"); };
  await assert.rejects(store.getState().toggleFavorite(post), /offline/);
  assert.equal(store.getState().posts.length, 0);
  assert.equal(store.getState().pendingIds.length, 0);
  addHandler = async () => {};
  assert.equal(await store.getState().toggleFavorite(post), true);
});

test("failed removes retain the saved post", async () => {
  await store.getState().toggleFavorite(post);
  removeHandler = async () => { throw new Error("offline"); };
  await assert.rejects(store.getState().removeFavorite(7), /offline/);
  assert.equal(store.getState().posts.length, 1);
  assert.equal(store.getState().pendingIds.length, 0);
  removeHandler = async () => {};
  assert.equal(await store.getState().removeFavorite(7), true);
  assert.equal(store.getState().posts.length, 0);
});

test("switching accounts rejects a delayed favorite list from the previous user", async () => {
  const oldRequest = deferred();
  fetchHandler = () => oldRequest.promise;
  const loading = store.getState().fetchFavorites();
  auth.setState({ user: { maNguoiDung: 34 } });
  fetchHandler = async () => ({ posts: [] });
  await store.getState().fetchFavorites();
  oldRequest.resolve({ posts: [{ ...post, ngayLuu: "2026-11-09T01:00:00Z" }] });
  await loading;
  assert.equal(store.getState().posts.length, 0);
  assert.equal(store.getState().loaded, true);
});

test("logout clears favorites and ignores a save already in flight", async () => {
  await store.getState().fetchFavorites();
  const saving = deferred();
  addHandler = () => saving.promise;
  const clicking = store.getState().toggleFavorite(post);
  await Promise.resolve();
  auth.setState({ user: null });
  saving.resolve();
  assert.equal(await clicking, null);
  assert.equal(store.getState().posts.length, 0);
  assert.equal(store.getState().pendingIds.length, 0);
  const count = requests.length;
  assert.equal(await store.getState().toggleFavorite(post), null);
  assert.equal(requests.length, count);
});
