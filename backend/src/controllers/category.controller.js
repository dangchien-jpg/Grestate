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
