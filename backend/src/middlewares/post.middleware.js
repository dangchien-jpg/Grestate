import prisma from "../libs/prisma.js";

const directions = [
  "\u0110\u00f4ng",
  "T\u00e2y",
  "Nam",
  "B\u1eafc",
  "\u0110\u00f4ng B\u1eafc",
  "\u0110\u00f4ng Nam",
  "T\u00e2y B\u1eafc",
  "T\u00e2y Nam",
];
const furniture = [
  "\u0110\u1ea7y \u0111\u1ee7 n\u1ed9i th\u1ea5t",
  "C\u01a1 b\u1ea3n",
  "Ch\u01b0a c\u00f3",
];
const empty = (value) => value === undefined || value === null || value === "";

export const validateCreatePost = async (req, res, next) => {
  if (!req.user || req.user.deletedAt || req.user.trangThai !== "HOAT_DONG") {
    return res.status(403).json({ message: "An active account is required" });
  }
  let input;
  try {
    input =
      typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  } catch {
    return res.status(400).json({ message: "data must contain valid JSON" });
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return res.status(400).json({ message: "Invalid post data" });
  }
  const errors = {};
  const coordinate = (key, min, max) => {
    const raw = input[key];
    if (empty(raw)) return null;
    if (!["string", "number"].includes(typeof raw) || String(raw).trim() === "" ||
        !Number.isFinite(Number(raw)) || Number(raw) < min || Number(raw) > max) {
      errors[key] = `Expected coordinate between ${min} and ${max}`;
      return null;
    }
    return Number(raw).toFixed(7);
  };
  const text = (key, max, required = true) => {
    const value = input[key];
    if (!required && empty(value)) return null;
    if (
      typeof value !== "string" ||
      !value.trim() ||
      [...value.trim()].length > max
    ) {
      errors[key] = `Required text, maximum ${max} characters`;
      return null;
    }
    return value.trim();
  };
  const integer = (key, required = true) => {
    if (!required && empty(input[key])) return null;
    const raw = input[key];
    if (
      !["string", "number"].includes(typeof raw) ||
      !/^\d+$/.test(String(raw)) ||
      !Number.isSafeInteger(Number(raw)) ||
      Number(raw) > 2147483647 ||
      Number(raw) < (required ? 1 : 0)
    ) {
      errors[key] = "Invalid integer";
      return null;
    }
    return Number(raw);
  };
  const decimal = (key, digits, required = true, allowZero = false) => {
    if (!required && empty(input[key])) return null;
    const raw = input[key];
    if (
      !["string", "number"].includes(typeof raw) ||
      !new RegExp(`^\\d{1,${digits}}(?:\\.\\d{1,2})?$`).test(String(raw)) ||
      (!allowZero && Number(raw) === 0)
    ) {
      errors[key] =
        `Expected ${allowZero ? "non-negative" : "positive"} decimal with up to ${digits} integer digits and 2 decimal places`;
      return null;
    }
    return String(raw);
  };
  const choice = (key, options) => {
    if (empty(input[key])) return null;
    if (!options.includes(input[key])) {
      errors[key] = "Invalid selection";
      return null;
    }
    return input[key];
  };
  const maLoaiBatDongSan = integer("categoryId");
  const maGiayTo = integer("legalDocumentId", false);
  const maPhuongXa = integer("wardId");
  const province = text("provinceCode", 20);
  const data = {
    viDo: coordinate("viDo", -90, 90),
    kinhDo: coordinate("kinhDo", -180, 180),
    tieuDe: text("title", 200),
    moTa: text("description", 65535),
    diaChiChiTiet: text("address", 255),
    nguoiLienHe: text("nguoiLienHe", 100),
    soDienThoaiLienHe: text("soDienThoaiLienHe", 15),
    giaNiemYet: decimal("price", 16, true, true),
    dienTich: decimal("area", 10),
    matTien: decimal("matTien", 10, false),
    matDuong: decimal("matDuong", 10, false),
    huongNha: choice("houseDirection", directions),
    maLoaiBatDongSan,
    maGiayTo,
    maPhuongXa,
  };
  if ((data.viDo === null) !== (data.kinhDo === null))
    errors.coordinates = "Provide both latitude and longitude";
  if (data.moTa && Buffer.byteLength(data.moTa, "utf8") > 65535)
    errors.description = "Description exceeds TEXT storage limit";
  if (
    data.soDienThoaiLienHe &&
    !/^\+?[0-9]{9,15}$/.test(data.soDienThoaiLienHe)
  )
    errors.soDienThoaiLienHe = "Invalid phone number";
  if (!Array.isArray(req.files) || req.files.length < 1 || req.files.length > 6)
    errors.images = "Provide 1 to 6 images";
  else if (
    req.files.some(
      (file) => !Buffer.isBuffer(file.buffer) || file.buffer.length === 0,
    )
  )
    errors.images = "Empty image file";
  if (Object.keys(errors).length)
    return res.status(400).json({ message: "Invalid post data", errors });
  try {
    const [category, legalDocument, ward] = await Promise.all([
      prisma.loaiBatDongSan.findFirst({
        where: { maLoaiBatDongSan, deletedAt: null },
      }),
      maGiayTo === null
        ? null
        : prisma.giayToPhapLy.findFirst({
            where: { maGiayTo, deletedAt: null },
          }),
      prisma.phuongXa.findFirst({
        where: { maPhuongXa, maTinhThanh: province },
      }),
    ]);
    if (!category)
      errors.categoryId = "Category does not exist or has been deleted";
    if (maGiayTo !== null && !legalDocument)
      errors.legalDocumentId =
        "Legal document does not exist or has been deleted";
    if (!ward) errors.wardId = "Ward does not belong to the selected province";
    if (category?.nhomBatDongSan === "NHA") {
      data.soPhongNgu = integer("bedrooms", false);
      data.soPhongTam = integer("bathrooms", false);
      data.soTang = integer("floors", false);
      data.huongBanCong = choice("huongBanCong", directions);
      data.noiThat = choice("noiThat", furniture);
    } else {
      data.soPhongNgu =
        data.soPhongTam =
        data.soTang =
        data.huongBanCong =
        data.noiThat =
          null;
    }
    if (Object.keys(errors).length)
      return res.status(400).json({ message: "Invalid post data", errors });
    req.postData = data;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to validate post data" });
  }
};
