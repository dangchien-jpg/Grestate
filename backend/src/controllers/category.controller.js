import prisma from "../libs/prisma.js";

export const fetchCategories = async (req, res) => {
  try {
    const records = await prisma.loaiBatDongSan.findMany({
      where: { deletedAt: null },
    });

    return res.status(200).json({ categories: records });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy loại bất động sản lỗi" });
  }
};

export const createCategory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    if (
      req.user.maVaiTro !== 2 ||
      req.user.deletedAt ||
      req.user.trangThai !== "HOAT_DONG"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền quản lý danh mục" });
    }

    const { tenLoai, moTa, nhomBatDongSan } = req.body ?? {};
    if (
      typeof tenLoai !== "string" ||
      !tenLoai.trim() ||
      tenLoai.trim().length > 100
    ) {
      return res
        .status(400)
        .json({ message: "Tên loại bất động sản phải có từ 1 đến 100 ký tự" });
    }
    if (
      moTa != null &&
      (typeof moTa !== "string" || Buffer.byteLength(moTa, "utf8") > 65535)
    ) {
      return res
        .status(400)
        .json({ message: "Mô tả không hợp lệ hoặc vượt quá 65535 byte" });
    }
    if (!["NHA", "DAT"].includes(nhomBatDongSan)) {
      return res
        .status(400)
        .json({ message: "Nhóm bất động sản phải là NHA hoặc DAT" });
    }
    const data = {
      tenLoai: tenLoai.trim(),
      moTa: moTa?.trim() || null,
      nhomBatDongSan,
    };

    const record = await prisma.loaiBatDongSan.create({ data });
    return res
      .status(201)
      .json({ message: "Thêm loại bất động sản thành công", category: record });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({
          message:
            "Tên loại bất động sản đã tồn tại, kể cả trong danh mục đã xóa",
        });
    }
    console.error(error);
    return res.status(500).json({ message: "Thêm loại bất động sản thất bại" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    if (
      req.user.maVaiTro !== 2 ||
      req.user.deletedAt ||
      req.user.trangThai !== "HOAT_DONG"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền quản lý danh mục" });
    }

    const maLoaiBatDongSan = Number(req.params.maLoaiBatDongSan);
    if (!Number.isSafeInteger(maLoaiBatDongSan) || maLoaiBatDongSan <= 0) {
      return res
        .status(400)
        .json({ message: "Mã loại bất động sản không hợp lệ" });
    }

    const { tenLoai, moTa, nhomBatDongSan } = req.body ?? {};
    if (
      typeof tenLoai !== "string" ||
      !tenLoai.trim() ||
      tenLoai.trim().length > 100
    ) {
      return res
        .status(400)
        .json({ message: "Tên loại bất động sản phải có từ 1 đến 100 ký tự" });
    }
    if (
      moTa != null &&
      (typeof moTa !== "string" || Buffer.byteLength(moTa, "utf8") > 65535)
    ) {
      return res
        .status(400)
        .json({ message: "Mô tả không hợp lệ hoặc vượt quá 65535 byte" });
    }
    if (!["NHA", "DAT"].includes(nhomBatDongSan)) {
      return res
        .status(400)
        .json({ message: "Nhóm bất động sản phải là NHA hoặc DAT" });
    }
    const data = {
      tenLoai: tenLoai.trim(),
      moTa: moTa?.trim() || null,
      nhomBatDongSan,
    };

    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.loaiBatDongSan.updateMany({
        where: { maLoaiBatDongSan, deletedAt: null },
        data,
      });
      if (updated.count === 0) return null;
      return tx.loaiBatDongSan.findUnique({ where: { maLoaiBatDongSan } });
    });
    if (!record) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy loại bất động sản hoặc đã bị xóa" });
    }
    return res
      .status(200)
      .json({
        message: "Cập nhật loại bất động sản thành công",
        category: record,
      });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({
          message:
            "Tên loại bất động sản đã tồn tại, kể cả trong danh mục đã xóa",
        });
    }
    console.error(error);
    return res
      .status(500)
      .json({ message: "Cập nhật loại bất động sản thất bại" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    if (
      req.user.maVaiTro !== 2 ||
      req.user.deletedAt ||
      req.user.trangThai !== "HOAT_DONG"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền quản lý danh mục" });
    }

    const maLoaiBatDongSan = Number(req.params.maLoaiBatDongSan);
    if (!Number.isSafeInteger(maLoaiBatDongSan) || maLoaiBatDongSan <= 0) {
      return res
        .status(400)
        .json({ message: "Mã loại bất động sản không hợp lệ" });
    }

    const result = await prisma.loaiBatDongSan.updateMany({
      where: { maLoaiBatDongSan, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy loại bất động sản hoặc đã bị xóa" });
    }
    return res
      .status(200)
      .json({ message: "Xóa loại bất động sản thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Xóa loại bất động sản thất bại" });
  }
};
