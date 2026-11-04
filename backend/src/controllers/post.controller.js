import prisma from "../libs/prisma.js";

export const fetchPost = async (req, res) => {
  try {
    const records = await prisma.tinDang.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { maTinDang: "desc" }],
      include: {
        nguoiDang: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            soDienThoai: true,
            anhDaiDienUrl: true,
            duongDanZalo: true,
          },
        },
        loaiBatDongSan: {
          select: { maLoaiBatDongSan: true, tenLoai: true },
        },
        giayToPhapLy: {
          select: { maGiayTo: true, tenGiayTo: true },
        },
        phuongXa: {
          select: {
            maPhuongXa: true,
            tenPhuongXa: true,
            maTinhThanh: true,
            tinhThanh: {
              select: { maTinhThanh: true, tenTinhThanh: true },
            },
          },
        },
        hinhAnhTinDangs: {
          orderBy: [{ thuTuHienThi: "asc" }, { maHinhAnh: "asc" }],
          select: {
            maHinhAnh: true,
            hinhAnhUrl: true,
            thuTuHienThi: true,
            laAnhDaiDien: true,
          },
        },
        tinDangTienIchs: {
          orderBy: { maTienIch: "asc" },
          select: {
            tienIch: { select: { maTienIch: true, tenTienIch: true } },
          },
        },
      },
    });

    const posts = records.map(({ tinDangTienIchs, ...post }) => ({
      ...post,
      giaNiemYet: Number(post.giaNiemYet),
      dienTich: Number(post.dienTich),
      viDo: post.viDo === null ? null : Number(post.viDo),
      kinhDo: post.kinhDo === null ? null : Number(post.kinhDo),
      tienIchs: tinDangTienIchs.map(({ tienIch }) => tienIch),
      anhDaiDienUrl:
        post.hinhAnhTinDangs.find((image) => image.laAnhDaiDien)?.hinhAnhUrl ??
        post.hinhAnhTinDangs[0]?.hinhAnhUrl ??
        null,
    }));

    return res.status(200).json({ posts, total: posts.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy danh sách tin đăng thất bại" });
  }
};

export const fetchDetailPost = async (req, res) => {
  const id = Number(req.params.maTinDang);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Mã tin đăng không hợp lệ" });
  }

  try {
    const record = await prisma.tinDang.findFirst({
      where: { maTinDang: id, deletedAt: null },
      include: {
        nguoiDang: {
          select: {
            maNguoiDung: true,
            hoTen: true,
            soDienThoai: true,
            anhDaiDienUrl: true,
            duongDanZalo: true,
          },
        },
        loaiBatDongSan: {
          select: { maLoaiBatDongSan: true, tenLoai: true },
        },
        giayToPhapLy: {
          select: { maGiayTo: true, tenGiayTo: true },
        },
        phuongXa: {
          select: {
            maPhuongXa: true,
            tenPhuongXa: true,
            maTinhThanh: true,
            tinhThanh: {
              select: { maTinhThanh: true, tenTinhThanh: true },
            },
          },
        },
        hinhAnhTinDangs: {
          orderBy: [{ thuTuHienThi: "asc" }, { maHinhAnh: "asc" }],
          select: {
            maHinhAnh: true,
            hinhAnhUrl: true,
            thuTuHienThi: true,
            laAnhDaiDien: true,
          },
        },
        tinDangTienIchs: {
          orderBy: { maTienIch: "asc" },
          select: {
            tienIch: { select: { maTienIch: true, tenTienIch: true } },
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy tin đăng" });
    }

    const { tinDangTienIchs, ...post } = record;

    return res.status(200).json({
      post: {
        ...post,
        giaNiemYet: Number(post.giaNiemYet),
        dienTich: Number(post.dienTich),
        viDo: post.viDo === null ? null : Number(post.viDo),
        kinhDo: post.kinhDo === null ? null : Number(post.kinhDo),
        tienIchs: tinDangTienIchs.map(({ tienIch }) => tienIch),
        anhDaiDienUrl:
          post.hinhAnhTinDangs.find((image) => image.laAnhDaiDien)
            ?.hinhAnhUrl ??
          post.hinhAnhTinDangs[0]?.hinhAnhUrl ??
          null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy tin đăng thất bại" });
  }
};
