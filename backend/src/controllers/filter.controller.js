import prisma from "../libs/prisma.js";

const priceRanges = {
  negotiable: { equals: 0 },
  "under-1": { gt: 0, lt: 1_000_000_000 },
  "1-3": { gte: 1_000_000_000, lt: 3_000_000_000 },
  "3-5": { gte: 3_000_000_000, lt: 5_000_000_000 },
  "5-10": { gte: 5_000_000_000, lt: 10_000_000_000 },
  "over-10": { gte: 10_000_000_000 },
};
const areaRanges = {
  "under-50": { gt: 0, lt: 50 },
  "50-100": { gte: 50, lt: 100 },
  "100-200": { gte: 100, lt: 200 },
  "200-500": { gte: 200, lt: 500 },
  "over-500": { gte: 500 },
};

const fetchFilteredPosts = async (req, res, condition) => {
  const { page = "1", limit = "12" } = req.query;
  const pageNumber = Number(page);
  const pageSize = Number(limit);
  if (
    typeof page !== "string" ||
    typeof limit !== "string" ||
    !Number.isSafeInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50 ||
    !Number.isSafeInteger((pageNumber - 1) * pageSize)
  ) {
    return res.status(400).json({ message: "Phân trang không hợp lệ" });
  }
  const where = { deletedAt: null, trangThai: "DA_DUYET", ...condition };
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
};

export const filterPrice = async (req, res) => {
  try {
    const { range, minPrice, maxPrice } = req.query;
    if (range !== undefined) {
      if (minPrice !== undefined || maxPrice !== undefined || typeof range !== "string" || !Object.hasOwn(priceRanges, range)) {
        return res.status(400).json({ message: "Khoảng giá không hợp lệ" });
      }
      return await fetchFilteredPosts(req, res, { giaNiemYet: priceRanges[range] });
    }
    if (minPrice === undefined && maxPrice === undefined) {
      return res.status(400).json({ message: "Vui lòng nhập giá thấp nhất hoặc cao nhất" });
    }
    for (const price of [minPrice, maxPrice]) {
      if (price !== undefined && (typeof price !== "string" || !/^\d+$/.test(price) || !Number.isSafeInteger(Number(price)) || Number(price) > 1_000_000_000_000_000)) {
        return res.status(400).json({ message: "Giá phải là số nguyên VNĐ không âm và không vượt quá 1 triệu tỷ" });
      }
    }
    if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({ message: "Giá thấp nhất không được lớn hơn giá cao nhất" });
    }
    return await fetchFilteredPosts(req, res, {
      giaNiemYet: {
        ...(minPrice !== undefined && { gte: Number(minPrice) }),
        ...(maxPrice !== undefined && { lte: Number(maxPrice) }),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lọc tin đăng theo giá thất bại" });
  }
};

export const filterArea = async (req, res) => {
  try {
    const { range } = req.query;
    if (typeof range !== "string" || !Object.hasOwn(areaRanges, range)) {
      return res.status(400).json({ message: "Khoảng diện tích không hợp lệ" });
    }
    return await fetchFilteredPosts(req, res, { dienTich: areaRanges[range] });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lọc tin đăng theo diện tích thất bại" });
  }
};

export const filterPostByCategory = async (req, res) => {
  try {
    const { maLoaiBatDongSan } = req.query;
    if (
      typeof maLoaiBatDongSan !== "string" ||
      !Number.isSafeInteger(Number(maLoaiBatDongSan)) ||
      Number(maLoaiBatDongSan) <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Mã loại bất động sản không hợp lệ" });
    }
    return await fetchFilteredPosts(req, res, {
      maLoaiBatDongSan: Number(maLoaiBatDongSan),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lọc tin đăng theo loại bất động sản thất bại" });
  }
};

export const filterPostByLocation = async (req, res) => {
  try {
    const { maTinhThanh, maPhuongXa } = req.query;
    if (maTinhThanh === undefined && maPhuongXa === undefined) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn tỉnh/thành hoặc phường/xã" });
    }
    if (
      maTinhThanh !== undefined &&
      (typeof maTinhThanh !== "string" ||
        !maTinhThanh.trim() ||
        maTinhThanh.trim().length > 20)
    ) {
      return res.status(400).json({ message: "Mã tỉnh/thành không hợp lệ" });
    }
    if (
      maPhuongXa !== undefined &&
      (typeof maPhuongXa !== "string" ||
        !Number.isSafeInteger(Number(maPhuongXa)) ||
        Number(maPhuongXa) <= 0)
    ) {
      return res.status(400).json({ message: "Mã phường/xã không hợp lệ" });
    }
    return await fetchFilteredPosts(req, res, {
      ...(maPhuongXa !== undefined && { maPhuongXa: Number(maPhuongXa) }),
      ...(maTinhThanh !== undefined && {
        phuongXa: { maTinhThanh: maTinhThanh.trim() },
      }),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lọc tin đăng theo khu vực thất bại" });
  }
};
