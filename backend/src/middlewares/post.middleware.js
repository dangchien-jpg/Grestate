import prisma from "../libs/prisma.js";

const directions = [
  "Đông",
  "Tây",
  "Nam",
  "Bắc",
  "Đông Bắc",
  "Đông Nam",
  "Tây Bắc",
  "Tây Nam",
];
const furniture = [
  "Đầy đủ nội thất",
  "Cơ bản",
  "Chưa có",
];
const empty = (value) => value === undefined || value === null || value === "";

export const requirePostOwner = async (req, res, next) => {
  if (!req.user || req.user.deletedAt || req.user.trangThai !== "HOAT_DONG") {
    return res.status(403).json({ message: "Tài khoản phải đang hoạt động" });
  }
  const id = Number(req.params.maTinDang);
  if (!/^\d+$/.test(req.params.maTinDang) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
  }
  try {
    const post = await prisma.tinDang.findFirst({
      where: { maTinDang: id, deletedAt: null },
      include: { hinhAnhTinDangs: true },
    });
    if (!post) return res.status(404).json({ message: "Không tìm thấy tin đăng" });
    if (post.maNguoiDung !== req.user.maNguoiDung) {
      return res.status(403).json({ message: "Bạn chỉ được sửa hoặc xóa tin đăng của mình" });
    }
    req.existingPost = post;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể kiểm tra quyền truy cập tin đăng" });
  }
};

const validatePost = (updating = false) => async (req, res, next) => {
  if (!req.user || req.user.deletedAt || req.user.trangThai !== "HOAT_DONG") {
    return res.status(403).json({ message: "Tài khoản phải đang hoạt động" });
  }
  let input;
  try {
    input =
      typeof req.body?.data === "string" ? JSON.parse(req.body.data) : req.body;
  } catch {
    return res.status(400).json({ message: "Trường data phải chứa dữ liệu JSON hợp lệ" });
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return res.status(400).json({ message: "Dữ liệu tin đăng không hợp lệ" });
  }
  const errors = {};
  const coordinate = (key, min, max) => {
    const raw = input[key];
    if (empty(raw)) return null;
    if (!["string", "number"].includes(typeof raw) || String(raw).trim() === "" ||
        !Number.isFinite(Number(raw)) || Number(raw) < min || Number(raw) > max) {
      errors[key] = `Tọa độ phải là số trong khoảng từ ${min} đến ${max}`;
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
      errors[key] = `Vui lòng nhập nội dung, tối đa ${max} ký tự`;
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
      errors[key] = `Giá trị phải là số nguyên ${required ? "dương" : "không âm"}, không vượt quá 2147483647`;
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
        `Giá trị phải là số ${allowZero ? "không âm" : "dương"}, tối đa ${digits} chữ số phần nguyên và 2 chữ số thập phân`;
      return null;
    }
    return String(raw);
  };
  const choice = (key, options) => {
    if (empty(input[key])) return null;
    if (!options.includes(input[key])) {
      errors[key] = "Giá trị được chọn không hợp lệ";
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
    errors.coordinates = "Vui lòng cung cấp đầy đủ cả vĩ độ và kinh độ";
  if (data.moTa && Buffer.byteLength(data.moTa, "utf8") > 65535)
    errors.description = "Mô tả vượt quá giới hạn lưu trữ 65.535 byte";
  if (
    data.soDienThoaiLienHe &&
    !/^\+?[0-9]{9,15}$/.test(data.soDienThoaiLienHe)
  )
    errors.soDienThoaiLienHe = "Số điện thoại phải gồm 9–15 chữ số, có thể bắt đầu bằng dấu +";
  const imagesCount = updating && req.files?.length === 0
    ? req.existingPost.hinhAnhTinDangs.length
    : req.files?.length;
  if (!Array.isArray(req.files) || imagesCount < 1 || imagesCount > 6)
    errors.images = "Tin đăng phải có từ 1 đến 6 hình ảnh";
  else if (
    req.files.some(
      (file) => !Buffer.isBuffer(file.buffer) || file.buffer.length === 0,
    )
  )
    errors.images = "Tệp hình ảnh bị trống hoặc không hợp lệ";
  if (Object.keys(errors).length)
    return res.status(400).json({ message: "Dữ liệu tin đăng không hợp lệ", errors });
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
      errors.categoryId = "Loại bất động sản không tồn tại hoặc đã bị xóa";
    if (maGiayTo !== null && !legalDocument)
      errors.legalDocumentId =
        "Giấy tờ pháp lý không tồn tại hoặc đã bị xóa";
    if (!ward) errors.wardId = "Phường/xã không tồn tại hoặc không thuộc tỉnh/thành đã chọn";
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
      return res.status(400).json({ message: "Dữ liệu tin đăng không hợp lệ", errors });
    req.postData = data;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể kiểm tra dữ liệu tin đăng" });
  }
};

export const validateCreatePost = validatePost();
export const validateUpdatePost = validatePost(true);
