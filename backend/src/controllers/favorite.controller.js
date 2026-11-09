import prisma from "../libs/prisma.js";

export const fetchAllFavoritePosts = async (req, res) => {
  try {
    const records = await prisma.tinDangYeuThich.findMany({
      where: {
        maNguoiDung: req.user.maNguoiDung,
        tinDang: { deletedAt: null },
      },
      orderBy: [{ ngayLuu: "desc" }, { maTinDang: "desc" }],
      select: {
        ngayLuu: true,
        tinDang: {
          select: {
            maTinDang: true,
            tieuDe: true,
            giaNiemYet: true,
            dienTich: true,
            soPhongNgu: true,
            soPhongTam: true,
            diaChiChiTiet: true,
            ngayDang: true,
            createdAt: true,
            trangThai: true,
            phuongXa: {
              select: {
                maPhuongXa: true,
                tenPhuongXa: true,
                tinhThanh: {
                  select: { maTinhThanh: true, tenTinhThanh: true },
                },
              },
            },
            hinhAnhTinDangs: {
              orderBy: [
                { laAnhDaiDien: "desc" },
                { thuTuHienThi: "asc" },
                { maHinhAnh: "asc" },
              ],
              take: 1,
              select: { hinhAnhUrl: true },
            },
            _count: { select: { hinhAnhTinDangs: true } },
          },
        },
      },
    });

    const posts = records.map(({ ngayLuu, tinDang }) => {
      const { hinhAnhTinDangs, _count, ...post } = tinDang;
      return {
        ...post,
        giaNiemYet: Number(post.giaNiemYet),
        dienTich: Number(post.dienTich),
        anhDaiDienUrl: hinhAnhTinDangs[0]?.hinhAnhUrl ?? null,
        soHinhAnh: _count.hinhAnhTinDangs,
        ngayLuu,
        daYeuThich: true,
      };
    });

    return res.status(200).json({ posts, total: posts.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lấy danh sách tin đăng yêu thích thất bại",
    });
  }
};

export const addFavoritePost = async (req, res) => {
  try {
    const postId = Number(req.params.maTinDang);
    const userId = req.user.maNguoiDung;

    const post = await prisma.tinDang.findUnique({
      where: {
        maTinDang: postId,
      },
    });
    if (!post) {
      return res.status(400).json({ message: "Không tìm thấy tin đăng" });
    }

    await prisma.tinDangYeuThich.create({
      data: {
        maNguoiDung: userId,
        maTinDang: postId,
      },
    });

    return res.status(201).json({ message: "Lưu tin thành công" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi khi lưu tin" });
  }
};

export const removeFavoritePost = async (req, res) => {
  try {
    const postId = Number(req.params.maTinDang);
    const userId = req.user.maNguoiDung;

    if (!Number.isSafeInteger(postId) || postId <= 0) {
      return res.status(400).json({
        message: "Mã tin đăng không hợp lệ",
      });
    }

    const post = await prisma.tinDangYeuThich.findUnique({
      where: {
        maNguoiDung_maTinDang: {
          maNguoiDung: userId,
          maTinDang: postId,
        },
      },
    });

    if (!post) {
      return res.status(400).json({
        message: "Bạn chưa lưu tin này",
      });
    }

    await prisma.tinDangYeuThich.delete({
      where: {
        maNguoiDung_maTinDang: {
          maNguoiDung: userId,
          maTinDang: postId,
        },
      },
    });

    return res.status(200).json({ message: "Bỏ lưu thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi khi bỏ lưu tin" });
  }
};
