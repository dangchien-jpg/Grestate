import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ms from "ms";
import crypto from "crypto";
import prisma from "../libs/prisma.js";
import { verifyEmailOTP } from "../utils/verifyEmailOTP.js";

const otpLifetime = 10 * 60 * 1000;
const resendDelay = 30 * 1000;

async function issueVerificationOTP(user) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const now = Date.now();
  const { count } = await prisma.nguoiDung.updateMany({
    where: {
      maNguoiDung: user.maNguoiDung,
      emailDaXacThuc: false,
      OR: [
        { hanXacThucEmail: null },
        { hanXacThucEmail: { lte: new Date(now + otpLifetime - resendDelay) } },
      ],
    },
    data: { maXacThucEmail: hashedOTP, hanXacThucEmail: new Date(now + otpLifetime) },
  });
  if (!count) return false;
  try {
    await verifyEmailOTP(user.email, otp);
    return true;
  } catch (error) {
    await prisma.nguoiDung.updateMany({
      where: { maNguoiDung: user.maNguoiDung, maXacThucEmail: hashedOTP },
      data: { maXacThucEmail: null, hanXacThucEmail: null },
    });
    throw error;
  }
}

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
    const user = await prisma.nguoiDung.create({
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

    try {
      await issueVerificationOTP(user);
    } catch (error) {
      console.error("Signup OTP delivery failed:", error.message);
      return res.status(503).json({
        code: "OTP_DELIVERY_FAILED",
        message: "Đã tạo tài khoản nhưng chưa gửi được OTP. Vui lòng gửi lại mã.",
      });
    }
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

    if (user.trangThai === "BI_CHAN") {
      return res.status(403).json({
        code: "ACCOUNT_BLOCKED",
        message:
          "Tài khoản của bạn đã bị chặn. Vui lòng liên hệ quản trị viên để được hỗ trợ",
      });
    }

    if (user.deletedAt || user.trangThai !== "HOAT_DONG") {
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị chặn hoặc ngừng hoạt động" });
    }

    if (!user.emailDaXacThuc) {
      return res.status(403).json({ code: "EMAIL_UNVERIFIED", message: "Email chưa được xác thực" });
    }

    const token = jwt.sign(
      { userId: user.maNguoiDung, role: user.maVaiTro },
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
      include: {
        nguoiDung: {
          select: {
            maVaiTro: true,
            emailDaXacThuc: true,
            trangThai: true,
            deletedAt: true,
          },
        },
      },
    });
    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ" });
    }

    if (
      !session.nguoiDung.emailDaXacThuc ||
      session.nguoiDung.deletedAt ||
      session.nguoiDung.trangThai !== "HOAT_DONG"
    ) {
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị chặn hoặc ngừng hoạt động" });
    }

    if (session.expiredAt < new Date()) {
      return res.status(403).json({ message: "Token hết hạn" });
    }

    const accessToken = jwt.sign(
      { userId: session.maNguoiDung, role: session.nguoiDung.maVaiTro },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_TTL },
    );
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.nguoiDung.findUnique({
      where: {
        email: typeof email === "string" ? email.trim().toLowerCase() : "",
      },
    });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    const sent = await issueVerificationOTP(user);
    if (!sent) {
      return res.status(429).json({ message: "Chưa thể gửi mã mới. Vui lòng chờ 30 giây hoặc kiểm tra trạng thái xác thực." });
    }
    return res.status(200).json({
      message: "Gửi OTP xác thực thành công",
    });
  } catch (error) {
    console.error("sendVerificationOTP error:", error);

    return res.status(500).json({
      message: "Gửi email xác thực thất bại",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (typeof email !== "string" || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Vui lòng nhập email và mã OTP 6 chữ số" });
    }

    const user = await prisma.nguoiDung.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    const { maXacThucEmail, hanXacThucEmail } = user;

    if (
      !maXacThucEmail ||
      !hanXacThucEmail ||
      hanXacThucEmail.getTime() <= Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không còn hiệu lực" });
    }

    const otpMatches = await bcrypt.compare(otp, maXacThucEmail);
    if (!otpMatches) {
      return res.status(400).json({ message: "Mã xác thực không chính xác" });
    }

    const { count } = await prisma.nguoiDung.updateMany({
      where: {
        maNguoiDung: user.maNguoiDung,
        emailDaXacThuc: false,
        maXacThucEmail,
        hanXacThucEmail: { gt: new Date() },
      },
      data: {
        emailDaXacThuc: true,
        maXacThucEmail: null,
        hanXacThucEmail: null,
      },
    });

    if (count !== 1) {
      return res
        .status(400)
        .json({ message: "Mã xác thực không còn hiệu lực" });
    }

    return res.status(200).json({ message: "Xác thực email thành công" });
  } catch (error) {
    console.error("verify email error: ", error);
    return res.status(500).json({ message: "Xác thực email thất bại" });
  }
};
