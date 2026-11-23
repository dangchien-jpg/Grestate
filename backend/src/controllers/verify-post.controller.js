import { verificationFields, withVerification } from "../utils/post-verification.js";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import prisma from "../libs/prisma.js";
import {
  uploadVerificationFile,
  removeVerificationFiles,
} from "../middlewares/uploadVerifyPost.middleware.js";

const validId = (value) => {
  return (
    /^[1-9]\d*$/.test(String(value)) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) <= 2147483647
  );
};

const conflict = (message) => {
  return Object.assign(new Error(message), { status: 409 });
};

const sendError = (res, error, message) => {
  if (error.status === 404 || error.status === 409) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.code === "P2034")
    return res
      .status(409)
      .json({ message: "Dữ liệu vừa thay đổi. Vui lòng thử lại" });
  console.error(error);
  return res.status(500).json({ message });
};

const postFields = {
  maNguoiDung: true,
  trangThai: true,
  deletedAt: true,
  phienBanXacThuc: true,
};
const visible = (post) => {
  return post && !post.deletedAt && post.trangThai === "DA_DUYET";
};

export const submitVerification = async (req, res) => {
  const uploaded = [];
  let request;
  try {
    if (!validId(req.params.maTinDang) || !validId(req.body.maGiayTo)) {
      return res
        .status(400)
        .json({ message: "Mã tin đăng hoặc mã giấy tờ không hợp lệ" });
    }
    const maTinDang = Number(req.params.maTinDang);
    const maGiayTo = Number(req.body.maGiayTo);
    const maNguoiYeuCau = req.user.maNguoiDung;
    const note = req.body.ghiChuNguoiGui;
    if (
      note != null &&
      (typeof note !== "string" || note.trim().length > 2000)
    ) {
      return res
        .status(400)
        .json({ message: "Ghi chú không được vượt quá 2000 ký tự" });
    }
    const legal = req.files?.hoSoPhapLy ?? [];
    const property = req.files?.batDongSan ?? [];
    if (!legal.length || !property.length) {
      return res
        .status(400)
        .json({
          message:
            "Cần có ảnh hồ sơ pháp lý và ít nhất một ảnh hoặc video bất động sản",
        });
    }
    const post = await prisma.tinDang.findUnique({
      where: { maTinDang },
      select: postFields,
    });
    if (!visible(post))
      return res
        .status(404)
        .json({ message: "Không tìm thấy tin đăng đang hiển thị" });
    if (post.maNguoiDung !== maNguoiYeuCau)
      return res
        .status(403)
        .json({ message: "Chỉ chủ tin được yêu cầu xác thực" });
    const document = await prisma.giayToPhapLy.findFirst({
      where: { maGiayTo, deletedAt: null },
      select: { maGiayTo: true },
    });
    if (!document)
      return res
        .status(400)
        .json({ message: "Loại giấy tờ không tồn tại hoặc đã ngừng sử dụng" });

    const existing = {
      maTinDang,
      OR: [
        { trangThai: "CHO_XU_LY" },
        { trangThai: "DA_XAC_THUC", phienBanTinLucGui: post.phienBanXacThuc },
      ],
    };
    if (
      await prisma.yeuCauXacThucTinDang.findFirst({
        where: existing,
        select: { maYeuCau: true },
      })
    ) {
      return res
        .status(409)
        .json({
          message: "Tin đang chờ xác thực hoặc phiên bản này đã được xác thực",
        });
    }
    const folder = `Grestate/xac-thuc-tin-dang/${maTinDang}/${randomUUID()}`;
    const evidence = [];
    for (const file of [...legal, ...property]) {
      const isLegal = file.fieldname === "hoSoPhapLy";
      const asset = await uploadVerificationFile(
        file,
        folder + (isLegal ? "/phap-ly" : "/thuc-te"),
      );
      if (asset?.public_id) uploaded.push(asset);
      if (
        !asset?.public_id ||
        !asset.format ||
        !asset.bytes ||
        !["image", "video"].includes(asset.resource_type)
      ) {
        throw new Error("Cloudinary trả về metadata minh chứng không hợp lệ");
      }
      evidence.push({
        nhomMinhChung: isLegal ? "HO_SO_PHAP_LY" : "BAT_DONG_SAN_THUC_TE",
        loaiTep: asset.resource_type === "video" ? "VIDEO" : "ANH",
        maGiayTo: isLegal ? maGiayTo : null,
        maTepCloudinary: asset.public_id,
        dinhDangTep: asset.format,
        dungLuongByte: BigInt(asset.bytes),
        thuTuHienThi: evidence.length,
      });
    }
    request = await prisma.$transaction(
      async (tx) => {
        const current = await tx.tinDang.findUnique({
          where: { maTinDang },
          select: postFields,
        });
        if (
          !visible(current) ||
          current.maNguoiDung !== maNguoiYeuCau ||
          current.phienBanXacThuc !== post.phienBanXacThuc
        ) {
          throw conflict(
            "Tin đã thay đổi trong khi gửi minh chứng. Vui lòng kiểm tra lại",
          );
        }
        if (
          await tx.yeuCauXacThucTinDang.findFirst({
            where: existing,
            select: { maYeuCau: true },
          })
        ) {
          throw conflict("Tin đã có yêu cầu chờ xử lý hoặc đã được xác thực");
        }
        return tx.yeuCauXacThucTinDang.create({
          data: {
            maTinDang,
            maNguoiYeuCau,
            phienBanTinLucGui: current.phienBanXacThuc,
            ghiChuNguoiGui: note?.trim() || null,
            minhChungs: { create: evidence },
          },
          select: {
            maYeuCau: true,
            maTinDang: true,
            trangThai: true,
            ngayGui: true,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    await removeVerificationFiles(uploaded);
    if (error.code === "P2002")
      return res
        .status(409)
        .json({ message: "Tin đã có yêu cầu đang chờ xử lý" });
    return sendError(res, error, "Gửi yêu cầu xác thực thất bại");
  }
  return res
    .status(201)
    .json({ message: "Đã gửi yêu cầu xác thực", yeuCau: request });
};

const validateDecision = (req, res, trangThai) => {
  if (req.user.maVaiTro !== 2) {
    res
      .status(403)
      .json({ message: "Chỉ quản trị viên được xử lý yêu cầu xác thực" });
    return false;
  }
  if (!validId(req.params.maYeuCau)) {
    res.status(400).json({ message: "Mã yêu cầu không hợp lệ" });
    return false;
  }
  const reason = req.body?.lyDoXuLy;
  if (reason != null && (typeof reason !== "string" || reason.trim().length > 2000)) {
    res.status(400).json({ message: "Lý do xử lý phải là chuỗi tối đa 2000 ký tự" });
    return false;
  }
  if (trangThai === "TU_CHOI" && !reason?.trim()) {
    res.status(400).json({ message: "Vui lòng nhập lý do từ chối xác thực" });
    return false;
  }
  return true;
};

const recordDecision = async (tx, req, trangThai) => {
  const maYeuCau = Number(req.params.maYeuCau);
  const data = {
    trangThai,
    maNguoiXuLy: req.user.maNguoiDung,
    ngayXuLy: new Date(),
    lyDoXuLy: req.body?.lyDoXuLy?.trim() || null,
  };
  const result = await tx.yeuCauXacThucTinDang.updateMany({
    where: { maYeuCau, trangThai: "CHO_XU_LY" },
    data,
  });
  if (!result.count) {
    const exists = await tx.yeuCauXacThucTinDang.findUnique({
      where: { maYeuCau },
      select: { maYeuCau: true },
    });
    if (!exists)
      throw Object.assign(new Error("Không tìm thấy yêu cầu xác thực"), {
        status: 404,
      });
    throw conflict("Yêu cầu xác thực đã được xử lý");
  }
  return { maYeuCau, ...data };
};

export const acceptVerification = async (req, res) => {
  try {
    if (!validateDecision(req, res, "DA_XAC_THUC")) return;
    const yeuCau = await prisma.$transaction(
      async (tx) => {
        const current = await tx.yeuCauXacThucTinDang.findUnique({
          where: { maYeuCau: Number(req.params.maYeuCau) },
          select: {
            phienBanTinLucGui: true,
            maNguoiYeuCau: true,
            tinDang: { select: postFields },
          },
        });
        if (!current)
          throw Object.assign(new Error("Không tìm thấy yêu cầu xác thực"), {
            status: 404,
          });
        if (
          !visible(current.tinDang) ||
          current.tinDang.phienBanXacThuc !== current.phienBanTinLucGui ||
          current.tinDang.maNguoiDung !== current.maNguoiYeuCau
        ) {
          throw conflict(
            "Tin đã thay đổi hoặc không còn hiển thị. Vui lòng từ chối hồ sơ cũ",
          );
        }
        return recordDecision(tx, req, "DA_XAC_THUC");
      },
      { isolationLevel: "Serializable" },
    );
    return res
      .status(200)
      .json({ message: "Đã chấp nhận xác thực tin đăng", yeuCau });
  } catch (error) {
    return sendError(res, error, "Chấp nhận xác thực thất bại");
  }
};

export const rejectVerification = async (req, res) => {
  try {
    if (!validateDecision(req, res, "TU_CHOI")) return;
    const yeuCau = await prisma.$transaction((tx) =>
      recordDecision(tx, req, "TU_CHOI"),
    );
    return res
      .status(200)
      .json({ message: "Đã từ chối yêu cầu xác thực", yeuCau });
  } catch (error) {
    return sendError(res, error, "Từ chối xác thực thất bại");
  }
};

const queueFields = {
  maYeuCau: true, maTinDang: true, ngayGui: true,
  nguoiYeuCau: { select: { hoTen: true } },
  tinDang: { select: { tieuDe: true, ...verificationFields } },
};

export const listPendingVerifications = async (req, res) => {
  try {
    if (req.user?.maVaiTro !== 2) return res.status(403).json({ message: "Chỉ quản trị viên được xem hồ sơ xác thực" });
    const trangThai = req.query.trangThai ?? "CHO_XU_LY";
    if (!["CHO_XU_LY", "DA_XAC_THUC", "TU_CHOI"].includes(trangThai)) {
      return res.status(400).json({ message: "Trạng thái xác thực không hợp lệ" });
    }
    const requests = await prisma.yeuCauXacThucTinDang.findMany({
      where: { trangThai }, orderBy: [{ ngayGui: "asc" }, { maYeuCau: "asc" }], select: {
        ...queueFields,
        minhChungs: {
          where: { nhomMinhChung: "HO_SO_PHAP_LY", maGiayTo: { not: null } },
          orderBy: { thuTuHienThi: "asc" },
          take: 1,
          select: { giayTo: { select: { tenGiayTo: true } } },
        },
      },
    });
    return res.set("Cache-Control", "private, no-store").json({ requests: requests.map(request => ({ ...request, tinDang: withVerification(request.tinDang) })) });
  } catch (error) {
    return sendError(res, error, "Không thể tải danh sách chờ xác thực");
  }
};

export const getPendingVerification = async (req, res) => {
  try {
    if (req.user?.maVaiTro !== 2) return res.status(403).json({ message: "Chỉ quản trị viên được xem minh chứng" });
    if (!validId(req.params.maYeuCau)) return res.status(400).json({ message: "Mã yêu cầu không hợp lệ" });
    const request = await prisma.yeuCauXacThucTinDang.findFirst({
      where: { maYeuCau: Number(req.params.maYeuCau) },
      select: {
        ...queueFields, trangThai: true, lyDoXuLy: true, ghiChuNguoiGui: true, phienBanTinLucGui: true, maNguoiYeuCau: true,
        tinDang: { select: { ...postFields, ...verificationFields, tieuDe: true, diaChiChiTiet: true } },
        minhChungs: {
          orderBy: [{ thuTuHienThi: "asc" }, { maMinhChung: "asc" }],
          select: { maMinhChung: true, nhomMinhChung: true, loaiTep: true, moTa: true, giayTo: { select: { tenGiayTo: true } }, maTepCloudinary: true, dinhDangTep: true },
        },
      },
    });
    if (!request) return res.status(404).json({ message: "Hồ sơ không tồn tại" });
    const expiresAt = Math.floor(Date.now() / 1000) + 900;
    const minhChungs = request.minhChungs.map(({ maTepCloudinary, dinhDangTep, ...file }) => ({
      ...file, url: cloudinary.utils.private_download_url(maTepCloudinary, dinhDangTep, {
        resource_type: file.loaiTep === "VIDEO" ? "video" : "image", type: "authenticated",
        expires_at: expiresAt, attachment: false, secure: true,
      }),
    }));
    const coTheXacThuc = request.trangThai === "CHO_XU_LY" && visible(request.tinDang) && request.tinDang.phienBanXacThuc === request.phienBanTinLucGui
      && request.tinDang.maNguoiDung === request.maNguoiYeuCau;
    return res.set("Cache-Control", "private, no-store").json({ yeuCau: { ...request, tinDang: withVerification(request.tinDang), minhChungs, coTheXacThuc } });
  } catch (error) {
    return sendError(res, error, "Không thể tải minh chứng xác thực");
  }
};