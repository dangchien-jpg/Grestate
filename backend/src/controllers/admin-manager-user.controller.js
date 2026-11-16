import prisma from "../libs/prisma.js";

const userSelect = {
  maNguoiDung: true,
  maVaiTro: true,
  hoTen: true,
  email: true,
  soDienThoai: true,
  anhDaiDienUrl: true,
  duongDanZalo: true,
  emailDaXacThuc: true,
  trangThai: true,
  createdAt: true,
  updatedAt: true,
  vaiTro: { select: { maVaiTro: true, tenVaiTro: true } },
};

export const fetchActiveUsers = async (req, res) => {
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
        .json({ message: "Bạn không có quyền quản lý người dùng" });
    }

    const users = await prisma.nguoiDung.findMany({
      where: { trangThai: "HOAT_DONG", deletedAt: null },
      select: userSelect,
      orderBy: [{ createdAt: "desc" }, { maNguoiDung: "desc" }],
    });
    return res.status(200).json({ users, total: users.length });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lấy danh sách người dùng đang hoạt động thất bại" });
  }
};

export const fetchBlockedUsers = async (req, res) => {
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
        .json({ message: "Bạn không có quyền quản lý người dùng" });
    }

    const users = await prisma.nguoiDung.findMany({
      where: { trangThai: "BI_CHAN", deletedAt: null },
      select: userSelect,
      orderBy: [{ createdAt: "desc" }, { maNguoiDung: "desc" }],
    });
    return res.status(200).json({ users, total: users.length });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lấy danh sách người dùng bị chặn thất bại" });
  }
};

export const blockUser = async (req, res) => {
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
        .json({ message: "Bạn không có quyền quản lý người dùng" });
    }

    const maNguoiDung = Number(req.params.maNguoiDung);
    if (!Number.isSafeInteger(maNguoiDung) || maNguoiDung <= 0) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
    }
    if (maNguoiDung === req.user.maNguoiDung) {
      return res
        .status(400)
        .json({ message: "Bạn không thể tự chặn tài khoản của mình" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.nguoiDung.updateMany({
        where: { maNguoiDung, deletedAt: null, trangThai: "HOAT_DONG" },
        data: { trangThai: "BI_CHAN" },
      });
      if (updated.count === 0) {
        const existing = await tx.nguoiDung.findFirst({
          where: { maNguoiDung, deletedAt: null },
          select: { maNguoiDung: true },
        });
        return { status: existing ? 409 : 404 };
      }
      await tx.phienDangNhap.deleteMany({ where: { maNguoiDung } });
      const user = await tx.nguoiDung.findUnique({
        where: { maNguoiDung },
        select: userSelect,
      });
      return { status: 200, user };
    });

    if (result.status === 404) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (result.status === 409) {
      return res.status(409).json({
        message: "Chỉ có thể chặn tài khoản đang hoạt động",
      });
    }
    return res.status(200).json({
      message: "Chặn người dùng thành công",
      user: result.user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Chặn người dùng thất bại" });
  }
};

export const unblockUser = async (req, res) => {
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
        .json({ message: "Bạn không có quyền quản lý người dùng" });
    }

    const maNguoiDung = Number(req.params.maNguoiDung);
    if (!Number.isSafeInteger(maNguoiDung) || maNguoiDung <= 0) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.nguoiDung.updateMany({
        where: { maNguoiDung, deletedAt: null, trangThai: "BI_CHAN" },
        data: { trangThai: "HOAT_DONG" },
      });
      if (updated.count === 0) {
        const existing = await tx.nguoiDung.findFirst({
          where: { maNguoiDung, deletedAt: null },
          select: { maNguoiDung: true },
        });
        return { status: existing ? 409 : 404 };
      }
      const user = await tx.nguoiDung.findUnique({
        where: { maNguoiDung },
        select: userSelect,
      });
      return { status: 200, user };
    });

    if (result.status === 404) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (result.status === 409) {
      return res.status(409).json({
        message: "Chỉ có thể bỏ chặn tài khoản đang bị chặn",
      });
    }
    return res.status(200).json({
      message: "Bỏ chặn người dùng thành công",
      user: result.user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Bỏ chặn người dùng thất bại" });
  }
};
