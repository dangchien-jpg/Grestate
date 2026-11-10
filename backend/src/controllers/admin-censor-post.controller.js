import prisma from "../libs/prisma.js";

export const acceptPost = async (req, res) => {
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
        .json({ message: "Bạn không có quyền kiểm duyệt tin" });
    }

    const id = Number(req.params.maTinDang);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.tinDang.updateMany({
        where: { maTinDang: id, deletedAt: null, trangThai: "CHO_KIEM_DUYET" },
        data: { trangThai: "DA_DUYET", ngayDang: new Date() },
      });
      if (updated.count === 0) {
        const existing = await tx.tinDang.findFirst({
          where: { maTinDang: id, deletedAt: null },
          select: { maTinDang: true },
        });
        return { status: existing ? 409 : 404 };
      }

      const history = await tx.lichSuKiemDuyet.create({
        data: {
          maTinDang: id,
          maNguoiDung: req.user.maNguoiDung,
          ketQua: "DA_DUYET",
          lyDoTuChoi: null,
        },
      });
      const post = await tx.tinDang.findUnique({
        where: { maTinDang: id },
        select: { maTinDang: true, trangThai: true, ngayDang: true },
      });
      return { status: 200, post, history };
    });

    if (result.status === 404) {
      return res.status(404).json({ message: "Không tìm thấy tin đăng" });
    }
    if (result.status === 409) {
      return res
        .status(409)
        .json({ message: "Tin đăng không còn chờ kiểm duyệt" });
    }
    return res.status(200).json({
      message: "Đã duyệt tin đăng",
      post: result.post,
      history: result.history,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Kiểm duyệt tin đăng thất bại" });
  }
};

export const rejectPost = async (req, res) => {
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
        .json({ message: "Bạn không có quyền kiểm duyệt tin" });
    }

    const id = Number(req.params.maTinDang);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
    }

    const reason = req.body?.lyDoTuChoi;
    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập lý do từ chối" });
    }
    const lyDoTuChoi = reason.trim();
    if (lyDoTuChoi && Buffer.byteLength(lyDoTuChoi, "utf8") > 65535) {
      return res.status(400).json({ message: "Lý do từ chối quá dài" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.tinDang.updateMany({
        where: { maTinDang: id, deletedAt: null, trangThai: "CHO_KIEM_DUYET" },
        data: { trangThai: "TU_CHOI", ngayDang: null },
      });
      if (updated.count === 0) {
        const existing = await tx.tinDang.findFirst({
          where: { maTinDang: id, deletedAt: null },
          select: { maTinDang: true },
        });
        return { status: existing ? 409 : 404 };
      }

      const history = await tx.lichSuKiemDuyet.create({
        data: {
          maTinDang: id,
          maNguoiDung: req.user.maNguoiDung,
          ketQua: "TU_CHOI",
          lyDoTuChoi,
        },
      });
      const post = await tx.tinDang.findUnique({
        where: { maTinDang: id },
        select: { maTinDang: true, trangThai: true, ngayDang: true },
      });
      return { status: 200, post, history };
    });

    if (result.status === 404) {
      return res.status(404).json({ message: "Không tìm thấy tin đăng" });
    }
    if (result.status === 409) {
      return res
        .status(409)
        .json({ message: "Tin đăng không còn chờ kiểm duyệt" });
    }
    return res.status(200).json({
      message: "Đã từ chối tin đăng",
      post: result.post,
      history: result.history,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Kiểm duyệt tin đăng thất bại" });
  }
};

const censorInclude = {
  nguoiDang: {
    select: {
      maNguoiDung: true,
      hoTen: true,
      soDienThoai: true,
      anhDaiDienUrl: true,
      duongDanZalo: true,
    },
  },
  loaiBatDongSan: { select: { maLoaiBatDongSan: true, tenLoai: true } },
  giayToPhapLy: { select: { maGiayTo: true, tenGiayTo: true } },
  phuongXa: { include: { tinhThanh: true } },
  hinhAnhTinDangs: {
    orderBy: [{ thuTuHienThi: "asc" }, { maHinhAnh: "asc" }],
    select: {
      maHinhAnh: true,
      hinhAnhUrl: true,
      thuTuHienThi: true,
      laAnhDaiDien: true,
    },
  },
};

function censorPostResponse(post) {
  const result = { ...post };
  for (const field of [
    "giaNiemYet",
    "dienTich",
    "matTien",
    "matDuong",
    "viDo",
    "kinhDo",
  ]) {
    result[field] = post[field] == null ? null : Number(post[field]);
  }
  result.anhDaiDienUrl =
    post.hinhAnhTinDangs.find((image) => image.laAnhDaiDien)?.hinhAnhUrl ??
    post.hinhAnhTinDangs[0]?.hinhAnhUrl ??
    null;
  return result;
}

export const fetchCensorPosts = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    if (
      req.user.maVaiTro !== 2 ||
      req.user.deletedAt ||
      req.user.trangThai !== "HOAT_DONG"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền kiểm duyệt tin" });
    }
    const { status = "CHO_KIEM_DUYET", page = "1", limit = "9" } = req.query;
    const pageNumber = Number(page),
      pageSize = Number(limit);
    if (
      typeof status !== "string" ||
      !["ALL", "CHO_KIEM_DUYET", "DA_DUYET", "TU_CHOI"].includes(status) ||
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50 ||
      !Number.isSafeInteger((pageNumber - 1) * pageSize)
    ) {
      return res
        .status(400)
        .json({ message: "Bộ lọc hoặc phân trang không hợp lệ" });
    }
    const where = {
      deletedAt: null,
      ...(status !== "ALL" && { trangThai: status }),
    };
    const [total, records] = await prisma.$transaction([
      prisma.tinDang.count({ where }),
      prisma.tinDang.findMany({
        where,
        include: censorInclude,
        orderBy: [{ updatedAt: "desc" }, { maTinDang: "desc" }],
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return res.status(200).json({
      posts: records.map(censorPostResponse),
      total,
      page: pageNumber,
      limit: pageSize,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Không thể tải danh sách kiểm duyệt" });
  }
};

export const fetchCensorPostDetail = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    if (
      req.user.maVaiTro !== 2 ||
      req.user.deletedAt ||
      req.user.trangThai !== "HOAT_DONG"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền kiểm duyệt tin" });
    }
    const id = Number(req.params.maTinDang);
    if (!Number.isSafeInteger(id) || id <= 0)
      return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
    const post = await prisma.tinDang.findFirst({
      where: { maTinDang: id, deletedAt: null },
      include: {
        ...censorInclude,
        lichSuKiemDuyets: {
          orderBy: [{ ngayKiemDuyet: "desc" }, { maKiemDuyet: "desc" }],
          include: { nguoiDung: { select: { hoTen: true } } },
        },
      },
    });
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy tin đăng" });
    return res.status(200).json({ post: censorPostResponse(post) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Không thể tải chi tiết kiểm duyệt" });
  }
};
