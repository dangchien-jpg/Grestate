import jwt from "jsonwebtoken";
import prisma from "../libs/prisma.js";
export const signUpValidate = (req, res, next) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Email không hợp lệ" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Độ dài mật khẩu tối thiểu 6 ký tự" });
  }
  next();
};

export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let decodedUser;
    try {
      decodedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" });
    }
    const user = await prisma.nguoiDung.findUnique({
      where: { maNguoiDung: decodedUser.userId },
      omit: { matKhauHash: true },
    });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    if (user.deletedAt || user.trangThai !== "HOAT_DONG") {
      return res.status(403).json({ message: "Tài khoản đã bị chặn hoặc ngừng hoạt động" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

