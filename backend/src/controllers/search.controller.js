import prisma from "../libs/prisma.js";

export const searchPost = async (req, res) => {
  try {
    const { keyword = "", page = "1", limit = "12" } = req.query;
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    if (
      typeof keyword !== "string" ||
      keyword.trim().length > 200 ||
      typeof page !== "string" ||
      typeof limit !== "string" ||
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50 ||
      !Number.isSafeInteger((pageNumber - 1) * pageSize)
    ) {
      return res
        .status(400)
        .json({ message: "Từ khóa hoặc phân trang không hợp lệ" });
    }

    const { maLoaiBatDongSan, maPhuongXa } = req.query;
    for (const value of [maLoaiBatDongSan, maPhuongXa]) {
      if (value !== undefined && (typeof value !== "string" || !Number.isSafeInteger(Number(value)) || Number(value) <= 0)) {
        return res.status(400).json({ message: "Loại bất động sản hoặc khu vực không hợp lệ" });
      }
    }
    const search = keyword.trim();
    const where = {
      ...(maLoaiBatDongSan !== undefined && { maLoaiBatDongSan: Number(maLoaiBatDongSan) }),
      ...(maPhuongXa !== undefined && { maPhuongXa: Number(maPhuongXa) }),
      deletedAt: null,
      trangThai: "DA_DUYET",
      ...(search && {
        OR: [
          { tieuDe: { contains: search } },
          { moTa: { contains: search } },
          { diaChiChiTiet: { contains: search } },
          { loaiBatDongSan: { tenLoai: { contains: search } } },
          { phuongXa: { tenPhuongXa: { contains: search } } },
          { phuongXa: { tinhThanh: { tenTinhThanh: { contains: search } } } },
        ],
      }),
    };
    const [total, records] = await prisma.$transaction([
      prisma.tinDang.count({ where }),
      prisma.tinDang.findMany({
        where,
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: [{ ngayDang: "desc" }, { maTinDang: "desc" }],
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
        },
      }),
    ]);

    const posts = records.map((post) => ({
      ...post,
      giaNiemYet: Number(post.giaNiemYet),
      dienTich: Number(post.dienTich),
      matTien: post.matTien === null ? null : Number(post.matTien),
      matDuong: post.matDuong === null ? null : Number(post.matDuong),
      viDo: post.viDo === null ? null : Number(post.viDo),
      kinhDo: post.kinhDo === null ? null : Number(post.kinhDo),
      anhDaiDienUrl:
        post.hinhAnhTinDangs.find((image) => image.laAnhDaiDien)?.hinhAnhUrl ??
        post.hinhAnhTinDangs[0]?.hinhAnhUrl ??
        null,
    }));
    return res.status(200).json({
      posts,
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Tìm kiếm tin đăng thất bại" });
  }
};

export const suggestSearchPost = async (req, res) => {
  try {
    const { keyword = "", limit = "8" } = req.query;
    const pageSize = Number(limit);
    if (
      typeof keyword !== "string" ||
      keyword.trim().length > 200 ||
      typeof limit !== "string" ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 10
    ) {
      return res
        .status(400)
        .json({ message: "Từ khóa hoặc số lượng gợi ý không hợp lệ" });
    }
    const search = keyword.trim();
    if (!search) {
      return res.status(200).json({ suggestions: [] });
    }

    const groups = await prisma.tinDang.groupBy({
      by: ["maLoaiBatDongSan", "maPhuongXa"],
      where: {
        trangThai: "DA_DUYET",
        deletedAt: null,
        AND: search.split(/\s+/).map((word) => ({
          OR: [
            { loaiBatDongSan: { tenLoai: { contains: word } } },
            { phuongXa: { tenPhuongXa: { contains: word } } },
            { phuongXa: { tinhThanh: { tenTinhThanh: { contains: word } } } },
          ],
        })),
      },
      _count: { maTinDang: true },
      orderBy: [
        { _count: { maTinDang: "desc" } },
        { maLoaiBatDongSan: "asc" },
        { maPhuongXa: "asc" },
      ],
      take: pageSize,
    });
    if (!groups.length) {
      return res.status(200).json({ suggestions: [] });
    }
    const [categories, locations] = await Promise.all([
      prisma.loaiBatDongSan.findMany({
        where: {
          maLoaiBatDongSan: {
            in: [...new Set(groups.map((group) => group.maLoaiBatDongSan))],
          },
        },
        select: { maLoaiBatDongSan: true, tenLoai: true },
      }),
      prisma.phuongXa.findMany({
        where: {
          maPhuongXa: {
            in: [...new Set(groups.map((group) => group.maPhuongXa))],
          },
        },
        select: {
          maPhuongXa: true,
          tenPhuongXa: true,
          maTinhThanh: true,
          tinhThanh: { select: { tenTinhThanh: true } },
        },
      }),
    ]);
    const categoryMap = new Map(
      categories.map((category) => [category.maLoaiBatDongSan, category]),
    );
    const locationMap = new Map(
      locations.map((location) => [location.maPhuongXa, location]),
    );
    const suggestions = groups.flatMap((group) => {
      const category = categoryMap.get(group.maLoaiBatDongSan);
      const location = locationMap.get(group.maPhuongXa);
      if (!category || !location) return [];
      return [
        {
          label: `Mua bán ${category.tenLoai} tại ${location.tenPhuongXa}, ${location.tinhThanh.tenTinhThanh}`,
          maLoaiBatDongSan: category.maLoaiBatDongSan,
          maPhuongXa: location.maPhuongXa,
          maTinhThanh: location.maTinhThanh,
        },
      ];
    });
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy gợi ý tìm kiếm thất bại" });
  }
};
