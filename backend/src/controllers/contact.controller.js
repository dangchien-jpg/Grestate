import prisma from "../libs/prisma.js";

const postSummary = { maTinDang: true, tieuDe: true, trangThai: true };
const newestFirst = [{ ngayGui: "desc" }, { maYeuCau: "desc" }];

export const createContactRequest = async (req, res) => {
  const maTinDang = Number(req.params.maTinDang);
  if (!Number.isInteger(maTinDang) || maTinDang < 1 || maTinDang > 2147483647) {
    return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
  }
  const { tenLienHe, soDienThoaiLienHe, loiNhan } = req.body ?? {};
  if (
    typeof tenLienHe !== "string" ||
    !tenLienHe.trim() ||
    tenLienHe.trim().length > 100
  ) {
    return res
      .status(400)
      .json({ message: "Tên liên hệ phải có từ 1 đến 100 ký tự" });
  }
  if (
    typeof soDienThoaiLienHe !== "string" ||
    !/^\+?\d{9,15}$/.test(soDienThoaiLienHe.trim()) ||
    soDienThoaiLienHe.trim().length > 15
  ) {
    return res
      .status(400)
      .json({ message: "Số điện thoại liên hệ không hợp lệ" });
  }
  if (
    loiNhan != null &&
    (typeof loiNhan !== "string" || loiNhan.trim().length > 500)
  ) {
    return res
      .status(400)
      .json({ message: "Lời nhắn phải là văn bản tối đa 500 ký tự" });
  }

  try {
    const maNguoiGui = req.user.maNguoiDung;
    const result = await prisma.$transaction(async (tx) => {
      const [post] = await tx.$queryRaw`
        SELECT maNguoiDung, tieuDe FROM TINDANG
        WHERE maTinDang = ${maTinDang} AND deletedAt IS NULL AND trangThai = 'DA_DUYET'
        FOR UPDATE
      `;
      if (!post) return { status: 404, message: "Tin đăng không còn hiển thị" };
      if (post.maNguoiDung === maNguoiGui) {
        return {
          status: 400,
          message: "Bạn không thể gửi yêu cầu cho tin của mình",
        };
      }

      const yeuCau = await tx.yeuCauLienHe.create({
        data: {
          maTinDang,
          maNguoiGui,
          tenLienHe: tenLienHe.trim(),
          soDienThoaiLienHe: soDienThoaiLienHe.trim(),
          loiNhan: loiNhan?.trim() || null,
        },
        omit: { danhDauDangCho: true },
      });
      await tx.thongBao.create({
        data: {
          maNguoiDung: post.maNguoiDung,
          maTinDang,
          tieuDe: "Có yêu cầu liên hệ mới",
          noiDung: `${yeuCau.tenLienHe} muốn bạn liên hệ về tin “${post.tieuDe}”.`,
        },
      });
      return { status: 201, message: "Đã gửi yêu cầu liên hệ", yeuCau };
    });
    const { status, ...body } = result;
    return res.status(status).json(body);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Bạn đã có yêu cầu đang chờ liên hệ cho tin này" });
    }
    console.error(error);
    return res.status(500).json({ message: "Không thể gửi yêu cầu liên hệ" });
  }
};

export const fetchSentContactRequests = async (req, res) => {
  try {
    const { maTinDang } = req.query;
    const id = Number(maTinDang);
    if (
      maTinDang !== undefined &&
      (typeof maTinDang !== "string" ||
        !Number.isInteger(id) ||
        id < 1 ||
        id > 2147483647)
    ) {
      return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
    }
    const requests = await prisma.yeuCauLienHe.findMany({
      where: {
        maNguoiGui: req.user.maNguoiDung,
        ...(maTinDang !== undefined && { maTinDang: id }),
      },
      include: { tinDang: { select: postSummary } },
      omit: { danhDauDangCho: true },
      orderBy: newestFirst,
    });
    return res.status(200).json({ requests, total: requests.length });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Không thể tải yêu cầu liên hệ đã gửi" });
  }
};

export const countPendingContacts = async (req, res) => {
  try {
    const total = await prisma.yeuCauLienHe.count({
      where: { trangThai: "CHO_LIEN_HE", tinDang: { maNguoiDung: req.user.maNguoiDung } },
    });
    return res.json({ total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể đếm yêu cầu chờ liên hệ" });
  }
};

export const fetchReceivedContactRequests = async (req, res) => {
  try {
    const { maTinDang, trangThai } = req.query;
    const id = Number(maTinDang);
    if (
      maTinDang !== undefined &&
      (typeof maTinDang !== "string" ||
        !Number.isInteger(id) ||
        id < 1 ||
        id > 2147483647)
    ) {
      return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
    }
    if (
      trangThai !== undefined &&
      !["CHO_LIEN_HE", "DA_LIEN_HE"].includes(trangThai)
    ) {
      return res
        .status(400)
        .json({ message: "Trạng thái yêu cầu không hợp lệ" });
    }
    const requests = await prisma.yeuCauLienHe.findMany({
      where: {
        tinDang: { maNguoiDung: req.user.maNguoiDung },
        ...(maTinDang !== undefined && { maTinDang: id }),
        ...(trangThai !== undefined && { trangThai }),
      },
      include: {
        tinDang: {
          select: {
            ...postSummary,
            giaNiemYet: true,
            hinhAnhTinDangs: {
              select: { hinhAnhUrl: true },
              orderBy: [{ laAnhDaiDien: "desc" }, { thuTuHienThi: "asc" }, { maHinhAnh: "asc" }],
              take: 1,
            },
          },
        },
      },
      omit: { danhDauDangCho: true },
      orderBy: newestFirst,
    });
    return res.status(200).json({ requests, total: requests.length });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Không thể tải yêu cầu liên hệ đã nhận" });
  }
};

export const markContactRequestContacted = async (req, res) => {
  const maYeuCau = Number(req.params.maYeuCau);
  if (!Number.isInteger(maYeuCau) || maYeuCau < 1 || maYeuCau > 2147483647) {
    return res.status(400).json({ message: "Mã yêu cầu không hợp lệ" });
  }
  try {
    const where = { maYeuCau, tinDang: { maNguoiDung: req.user.maNguoiDung } };
    const { count } = await prisma.yeuCauLienHe.updateMany({
      where: { ...where, trangThai: "CHO_LIEN_HE" },
      data: { trangThai: "DA_LIEN_HE", ngayLienHe: new Date() },
    });
    if (!count) {
      const existing = await prisma.yeuCauLienHe.findFirst({
        where,
        select: { maYeuCau: true },
      });
      if (!existing)
        return res
          .status(404)
          .json({ message: "Không tìm thấy yêu cầu liên hệ" });
    }
    return res.status(200).json({ message: "Đã đánh dấu đã liên hệ" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Không thể cập nhật yêu cầu liên hệ" });
  }
};
