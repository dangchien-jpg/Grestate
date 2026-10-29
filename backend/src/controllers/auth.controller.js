import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ms from "ms";
import crypto from "crypto";
import prisma from "../libs/prisma.js";

export const signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await prisma.nguoiDung.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email đã tồn tại",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.nguoiDung.create({
      data: {
        hoTen: `${firstName} ${lastName}`.trim(),
        email: normalizedEmail.toLowerCase(),
        matKhauHash: passwordHash,
        emailDaXacThuc: false,
        vaiTro: {
          connect: {
            maVaiTro: 1,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Đăng ký thành công, Kiểm tra email để xác thực!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Đăng ký thất bại" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email và mật khẩu không được để trống",
      });
    }

    const user = await prisma.nguoiDung.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const passwordCompare = await bcrypt.compare(password, user.matKhauHash);
    if (!passwordCompare) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // if (!user.emailDaXacThuc) {
    //   return res.status(403).json({ message: "Email chưa được xác thực" });
    // }

    const token = jwt.sign(
      { userId: user.maNguoiDung },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_TTL },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");
    await prisma.phienDangNhap.create({
      data: {
        maNguoiDung: user.maNguoiDung,
        refreshToken,
        expiredAt: new Date(Date.now() + ms(process.env.REFRESH_TOKEN_TTL)),
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ms(process.env.REFRESH_TOKEN_TTL),
    });

    return res
      .status(200)
      .json({ message: "Đăng nhập thành công", accessToken: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Đăng nhập thất bại" });
  }
};

export const signOut = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    console.log(token);

    if (!token) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    await prisma.phienDangNhap.delete({
      where: {
        refreshToken: token,
      },
    });
    res.clearCookie("refreshToken");

    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Đăng xuất thất bại" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const session = await prisma.phienDangNhap.findUnique({
      where: {
        refreshToken: token,
      },
    });
    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }

    if (session.expiredAt < new Date()) {
      return res.status(403).json({ message: "Token hết hạn" });
    }

    const accessToken = jwt.sign(
      { userId: session.maNguoiDung },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_TTL },
    );
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
