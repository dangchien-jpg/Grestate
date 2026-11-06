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
