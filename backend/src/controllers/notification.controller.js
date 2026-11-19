import prisma from "../libs/prisma.js";

export const fetchAllNotifications = async (req, res) => {
  try {
    const notifications = await prisma.thongBao.findMany({
      where: { maNguoiDung: req.user.maNguoiDung },
      orderBy: [{ createdAt: "desc" }, { maThongBao: "desc" }],
    });

    return res.status(200).json({ notifications, total: notifications.length });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lấy danh sách thông báo thất bại" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Mã thông báo không hợp lệ" });
    }

    await prisma.thongBao.updateMany({
      where: {
        maThongBao: id,
        maNguoiDung: req.user.maNguoiDung,
        daDoc: false,
      },
      data: { daDoc: true, ngayDoc: new Date() },
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Đánh dấu thông báo đã đọc thất bại" });
  }
};
