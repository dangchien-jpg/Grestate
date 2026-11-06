import prisma from "../libs/prisma.js";

export const fetchProvinces = async (req, res) => {
  try {
    const records = await prisma.tinhThanh.findMany();
    return res.status(200).json({
      provinces: records,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy tỉnh thành thất bại" });
  }
};

export const fetchWardsByProvinces = async (req, res) => {
  try {
    const maTinhThanh = req.params.maTinhThanh;

    const records = await prisma.phuongXa.findMany({
      where: {
        maTinhThanh,
      },
      orderBy: { tenPhuongXa: "asc" },
      select: {
        maPhuongXa: true,
        maTinhThanh: true,
        tenPhuongXa: true,
      },
    });

    return res.status(200).json({
      wards: records,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy phường xã thất bại" });
  }
};
