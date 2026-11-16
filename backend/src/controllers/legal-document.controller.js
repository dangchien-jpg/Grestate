import prisma from "../libs/prisma.js";

export const fetchLegalDocuments = async (req, res) => {
  try {
    const records = await prisma.giayToPhapLy.findMany({
      where: {
        deletedAt: null,
      },
    });

    return res.status(200).json({
      documents: records,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lấy giấy tờ pháp lý thất bại" });
  }
};

export const createLegalDocument = async (req, res) => {
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

    const { tenGiayTo, moTa } = req.body ?? {};
    if (
      typeof tenGiayTo !== "string" ||
      !tenGiayTo.trim() ||
      tenGiayTo.trim().length > 200
    ) {
      return res
        .status(400)
        .json({ message: "Tên giấy tờ pháp lý phải có từ 1 đến 200 ký tự" });
    }
    if (
      moTa != null &&
      (typeof moTa !== "string" || Buffer.byteLength(moTa, "utf8") > 65535)
    ) {
      return res
        .status(400)
        .json({ message: "Mô tả không hợp lệ hoặc vượt quá 65535 byte" });
    }
    const data = {
      tenGiayTo: tenGiayTo.trim(),
      moTa: moTa?.trim() || null,
    };

    const record = await prisma.giayToPhapLy.create({ data });
    return res
      .status(201)
      .json({ message: "Thêm giấy tờ pháp lý thành công", document: record });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({
          message:
            "Tên giấy tờ pháp lý đã tồn tại, kể cả trong danh mục đã xóa",
        });
    }
    console.error(error);
    return res.status(500).json({ message: "Thêm giấy tờ pháp lý thất bại" });
  }
};

export const updateLegalDocument = async (req, res) => {
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

    const maGiayTo = Number(req.params.maGiayTo);
    if (!Number.isSafeInteger(maGiayTo) || maGiayTo <= 0) {
      return res
        .status(400)
        .json({ message: "Mã giấy tờ pháp lý không hợp lệ" });
    }

    const { tenGiayTo, moTa } = req.body ?? {};
    if (
      typeof tenGiayTo !== "string" ||
      !tenGiayTo.trim() ||
      tenGiayTo.trim().length > 200
    ) {
      return res
        .status(400)
        .json({ message: "Tên giấy tờ pháp lý phải có từ 1 đến 200 ký tự" });
    }
    if (
      moTa != null &&
      (typeof moTa !== "string" || Buffer.byteLength(moTa, "utf8") > 65535)
    ) {
      return res
        .status(400)
        .json({ message: "Mô tả không hợp lệ hoặc vượt quá 65535 byte" });
    }
    const data = {
      tenGiayTo: tenGiayTo.trim(),
      moTa: moTa?.trim() || null,
    };

    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.giayToPhapLy.updateMany({
        where: { maGiayTo, deletedAt: null },
        data,
      });
      if (updated.count === 0) return null;
      return tx.giayToPhapLy.findUnique({ where: { maGiayTo } });
    });
    if (!record) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy giấy tờ pháp lý hoặc đã bị xóa" });
    }
    return res
      .status(200)
      .json({
        message: "Cập nhật giấy tờ pháp lý thành công",
        document: record,
      });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({
          message:
            "Tên giấy tờ pháp lý đã tồn tại, kể cả trong danh mục đã xóa",
        });
    }
    console.error(error);
    return res
      .status(500)
      .json({ message: "Cập nhật giấy tờ pháp lý thất bại" });
  }
};

export const deleteLegalDocument = async (req, res) => {
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

    const maGiayTo = Number(req.params.maGiayTo);
    if (!Number.isSafeInteger(maGiayTo) || maGiayTo <= 0) {
      return res
        .status(400)
        .json({ message: "Mã giấy tờ pháp lý không hợp lệ" });
    }

    const result = await prisma.giayToPhapLy.updateMany({
      where: { maGiayTo, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy giấy tờ pháp lý hoặc đã bị xóa" });
    }
    return res.status(200).json({ message: "Xóa giấy tờ pháp lý thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Xóa giấy tờ pháp lý thất bại" });
  }
};
