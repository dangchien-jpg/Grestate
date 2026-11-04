import prisma from "../libs/prisma.js";
import { uploadAvatarFromBuffer } from "../middlewares/uploadAvatar.middleware.js";

export const fetchMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lấy thông tin người dùng thất bại" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, linkZalo, phoneNumber } = req.body;
    const id = req.user.maNguoiDung;

    const user = await prisma.nguoiDung.findUnique({
      where: {
        maNguoiDung: id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    await prisma.nguoiDung.update({
      where: {
        maNguoiDung: id,
      },
      data: {
        hoTen: fullName,
        email,
        duongDanZalo: linkZalo,
        soDienThoai: phoneNumber,
      },
    });

    return res.status(200).json({
      message: "Cập nhật thông tin thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Cập nhật thông tin thất bại" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const id = req.user.maNguoiDung;

    if (!file) {
      return res.status(400).json({ message: "File tải lên trống" });
    }

    const result = await uploadAvatarFromBuffer(file.buffer);

    const updatedAvatar = await prisma.nguoiDung.update({
      where: {
        maNguoiDung: id,
      },
      data: {
        anhDaiDienUrl: result.secure_url,
        anhDaiDienId: result.public_id,
      },
      omit: {
        anhDaiDienUrl: false,
      },
    });

    if (!updatedAvatar.anhDaiDienUrl) {
      return res.status(400).json({ message: "Ảnh đại diện trả về trống" });
    }
    return res.status(200).json({ avatarUrl: updatedAvatar.anhDaiDienUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Cập nhật ảnh đại diện thất bại" });
  }
};
