import prisma from "../libs/prisma.js";

export const reportPost = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Vui lòng đăng nhập để báo cáo tin đăng" });
    }

    const maTinDang = Number(req.params.maTinDang);
    const maNguoiDung = req.user.maNguoiDung;
    const noiDung = req.body?.noiDung;

    if (!Number.isSafeInteger(maTinDang) || maTinDang <= 0) {
      return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
    }
    if (
      typeof noiDung !== "string" ||
      !noiDung.trim() ||
      noiDung.trim().length > 500
    ) {
      return res.status(400).json({
        message: "Nội dung báo cáo phải có từ 1 đến 500 ký tự",
      });
    }

    const post = await prisma.tinDang.findFirst({
      where: { maTinDang, trangThai: "DA_DUYET", deletedAt: null },
      select: { maTinDang: true, maNguoiDung: true },
    });
    if (!post) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tin đăng đang hiển thị" });
    }
    if (post.maNguoiDung === maNguoiDung) {
      return res
        .status(400)
        .json({ message: "Bạn không thể báo cáo tin đăng của mình" });
    }

    const pendingReport = await prisma.phanAnhTinDang.findFirst({
      where: {
        maTinDang,
        maNguoiDung,
        trangThai: { in: ["CHO_XU_LY", "DANG_XU_LY"] },
      },
      select: { maBaoCao: true },
    });
    if (pendingReport) {
      return res.status(409).json({
        message: "Bạn đã báo cáo tin đăng này. Vui lòng chờ xử lý",
      });
    }

    const report = await prisma.phanAnhTinDang.create({
      data: { maTinDang, maNguoiDung, noiDung: noiDung.trim() },
      select: {
        maBaoCao: true,
        maTinDang: true,
        noiDung: true,
        trangThai: true,
        ngayBaoCao: true,
      },
    });
    return res
      .status(201)
      .json({ message: "Báo cáo tin đăng thành công", report });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Báo cáo tin đăng thất bại" });
  }
};

export const confirmReportViolation = async (req, res) => {
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
        .json({ message: "Bạn không có quyền xử lý báo cáo" });
    }

    const maBaoCao = Number(req.params.maBaoCao);
    if (!Number.isSafeInteger(maBaoCao) || maBaoCao <= 0) {
      return res.status(400).json({ message: "Mã báo cáo không hợp lệ" });
    }
    const ghiChu = req.body?.ghiChu;
    if (
      typeof ghiChu !== "string" ||
      !ghiChu.trim() ||
      ghiChu.trim().length > 500
    ) {
      return res
        .status(400)
        .json({ message: "Lý do xử lý phải có từ 1 đến 500 ký tự" });
    }

    const report = await prisma.$transaction(async (tx) => {
      const existing = await tx.phanAnhTinDang.findUnique({
        where: { maBaoCao },
      });
      if (!existing) {
        throw Object.assign(new Error("Không tìm thấy báo cáo"), {
          status: 404,
        });
      }
      const updated = await tx.phanAnhTinDang.updateMany({
        where: { maBaoCao, trangThai: { in: ["CHO_XU_LY", "DANG_XU_LY"] } },
        data: {
          trangThai: "CO_VI_PHAM",
          hanhDongXuLy: "GO_TIN",
          ngayXuLy: new Date(),
          ghiChu: ghiChu.trim(),
        },
      });
      if (updated.count === 0) {
        throw Object.assign(new Error("Báo cáo đã được xử lý"), {
          status: 409,
        });
      }
      const post = await tx.tinDang.findFirst({
        where: { maTinDang: existing.maTinDang, deletedAt: null },
        select: { maTinDang: true, maNguoiDung: true, tieuDe: true },
      });
      if (!post) {
        throw Object.assign(new Error("Không tìm thấy tin đăng"), {
          status: 404,
        });
      }
      const removed = await tx.tinDang.updateMany({
        where: {
          maTinDang: post.maTinDang,
          deletedAt: null,
          trangThai: "DA_DUYET",
        },
        data: { trangThai: "BI_GO" },
      });
      if (removed.count === 0) {
        const currentPost = await tx.tinDang.findUnique({ where: { maTinDang: post.maTinDang }, select: { trangThai: true } });
        if (currentPost?.trangThai === "BI_GO") {
          return tx.phanAnhTinDang.findUnique({ where: { maBaoCao } });
        }
        throw Object.assign(
          new Error("Tin đăng không còn ở trạng thái đã duyệt"),
          { status: 409 },
        );
      }
      await tx.lichSuKiemDuyet.create({
        data: {
          maTinDang: post.maTinDang,
          maNguoiDung: req.user.maNguoiDung,
          ketQua: "BI_GO",
          ghiChu: `Xử lý báo cáo #${maBaoCao}: ${ghiChu.trim()}`,
        },
      });
      await tx.thongBao.create({
        data: {
          maNguoiDung: post.maNguoiDung,
          maTinDang: post.maTinDang,
          tieuDe: "Tin đăng của bạn đã bị gỡ do vi phạm",
          noiDung: `Tin đăng "${post.tieuDe}" đã bị gỡ. Lý do: ${ghiChu.trim()}`,
        },
      });
      return tx.phanAnhTinDang.findUnique({ where: { maBaoCao } });
    });

    return res
      .status(200)
      .json({ message: "Đã xác nhận vi phạm và gỡ tin đăng", report });
  } catch (error) {
    if (error.status === 404 || error.status === 409) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Xử lý báo cáo thất bại" });
  }
};

export const confirmReportNoViolation = async (req, res) => {
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
        .json({ message: "Bạn không có quyền xử lý báo cáo" });
    }

    const maBaoCao = Number(req.params.maBaoCao);
    if (!Number.isSafeInteger(maBaoCao) || maBaoCao <= 0) {
      return res.status(400).json({ message: "Mã báo cáo không hợp lệ" });
    }
    const ghiChu = req.body?.ghiChu;
    if (
      typeof ghiChu !== "string" ||
      !ghiChu.trim() ||
      ghiChu.trim().length > 5000
    ) {
      return res
        .status(400)
        .json({ message: "Lý do xử lý phải có từ 1 đến 5000 ký tự" });
    }

    const report = await prisma.$transaction(async (tx) => {
      const existing = await tx.phanAnhTinDang.findUnique({
        where: { maBaoCao },
      });
      if (!existing) {
        throw Object.assign(new Error("Không tìm thấy báo cáo"), {
          status: 404,
        });
      }
      const updated = await tx.phanAnhTinDang.updateMany({
        where: { maBaoCao, trangThai: { in: ["CHO_XU_LY", "DANG_XU_LY"] } },
        data: {
          trangThai: "KHONG_VI_PHAM",
          hanhDongXuLy: "GIU_NGUYEN_TIN",
          ngayXuLy: new Date(),
          ghiChu: ghiChu.trim(),
        },
      });
      if (updated.count === 0) {
        throw Object.assign(new Error("Báo cáo đã được xử lý"), {
          status: 409,
        });
      }

      return tx.phanAnhTinDang.findUnique({ where: { maBaoCao } });
    });

    return res
      .status(200)
      .json({ message: "Đã xác nhận tin đăng không vi phạm", report });
  } catch (error) {
    if (error.status === 404 || error.status === 409) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Xử lý báo cáo thất bại" });
  }
};

export const fetchReports = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Vui lòng đăng nhập" });
    if (req.user.maVaiTro !== 2 || req.user.deletedAt || req.user.trangThai !== "HOAT_DONG")
      return res.status(403).json({ message: "Bạn không có quyền xem báo cáo" });
    const { status = "CHO_XU_LY", page = "1" } = req.query;
    const pageNumber = Number(page);
    if (typeof status !== "string" || !["ALL", "CHO_XU_LY", "DANG_XU_LY", "CO_VI_PHAM", "KHONG_VI_PHAM"].includes(status) || !Number.isSafeInteger(pageNumber) || pageNumber < 1 || !Number.isSafeInteger((pageNumber - 1) * 10))
      return res.status(400).json({ message: "Bộ lọc hoặc phân trang không hợp lệ" });
    const where = status === "ALL" ? {} : { trangThai: status };
    const [total, reports] = await prisma.$transaction([
      prisma.phanAnhTinDang.count({ where }),
      prisma.phanAnhTinDang.findMany({
        where, skip: (pageNumber - 1) * 10, take: 10,
        orderBy: [{ ngayBaoCao: "desc" }, { maBaoCao: "desc" }],
        include: {
          nguoiBaoCao: { select: { hoTen: true } },
          tinDang: { select: {
            maTinDang: true, tieuDe: true, trangThai: true,
            hinhAnhTinDangs: { take: 1, orderBy: [{ laAnhDaiDien: "desc" }, { thuTuHienThi: "asc" }], select: { hinhAnhUrl: true } },
          } },
        },
      }),
    ]);
    return res.status(200).json({ reports, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy danh sách báo cáo thất bại" });
  }
};

export const fetchReportDetail = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Vui lòng đăng nhập" });
    if (req.user.maVaiTro !== 2 || req.user.deletedAt || req.user.trangThai !== "HOAT_DONG")
      return res.status(403).json({ message: "Bạn không có quyền xem báo cáo" });
    const maBaoCao = Number(req.params.maBaoCao);
    if (!Number.isSafeInteger(maBaoCao) || maBaoCao <= 0)
      return res.status(400).json({ message: "Mã báo cáo không hợp lệ" });
    const report = await prisma.phanAnhTinDang.findUnique({
      where: { maBaoCao },
      include: {
        nguoiBaoCao: { select: { hoTen: true } },
        tinDang: { include: {
          nguoiDang: { select: { hoTen: true } },
          phuongXa: { include: { tinhThanh: true } },
          hinhAnhTinDangs: { orderBy: [{ laAnhDaiDien: "desc" }, { thuTuHienThi: "asc" }] },
        } },
      },
    });
    if (!report) return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    return res.status(200).json({ report });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy chi tiết báo cáo thất bại" });
  }
};
