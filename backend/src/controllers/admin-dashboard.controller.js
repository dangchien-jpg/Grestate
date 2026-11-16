import prisma from "../libs/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const getDashboardDateRange = (query) => {
  const today = new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
  const parseDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return null;
    }
    const date = new Date(value + "T00:00:00.000Z");
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      return null;
    }
    return date;
  };
  const end = parseDate(query.endDate === undefined ? today : query.endDate);
  if (!end) return null;
  const start =
    query.startDate === undefined
      ? new Date(end.getTime() - 29 * DAY_MS)
      : parseDate(query.startDate);
  if (!start) return null;
  const days = (end.getTime() - start.getTime()) / DAY_MS + 1;
  if (days < 1 || days > 90) return null;
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    start: new Date(start.getTime() - VN_OFFSET_MS),
    endExclusive: new Date(end.getTime() + DAY_MS - VN_OFFSET_MS),
    days,
  };
};

export const fetchDashboardOverview = async (req, res) => {
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
        .json({ message: "Bạn không có quyền xem dashboard" });
    }
    const range = getDashboardDateRange(req.query);
    if (!range) {
      return res.status(400).json({
        message:
          "Khoảng ngày không hợp lệ. Dùng YYYY-MM-DD, ngày bắt đầu không sau ngày kết thúc và tối đa 90 ngày",
      });
    }
    const now = new Date();
    const [
      publishedPosts,
      pendingPosts,
      overduePendingPosts,
      pendingReports,
      newUsers,
    ] = await prisma.$transaction([
      prisma.tinDang.count({
        where: { deletedAt: null, trangThai: "DA_DUYET" },
      }),
      prisma.tinDang.count({
        where: { deletedAt: null, trangThai: "CHO_KIEM_DUYET" },
      }),
      prisma.tinDang.count({
        where: {
          deletedAt: null,
          trangThai: "CHO_KIEM_DUYET",
          createdAt: { lt: new Date(now.getTime() - DAY_MS) },
        },
      }),
      prisma.phanAnhTinDang.count({
        where: { trangThai: { in: ["CHO_XU_LY", "DANG_XU_LY"] } },
      }),
      prisma.nguoiDung.count({
        where: {
          deletedAt: null,
          createdAt: { gte: range.start, lt: range.endExclusive },
        },
      }),
    ]);
    return res.status(200).json({
      overview: {
        publishedPosts,
        pendingPosts,
        overduePendingPosts,
        pendingReports,
        newUsers,
      },
      startDate: range.startDate,
      endDate: range.endDate,
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy thống kê tổng quan thất bại" });
  }
};

export const fetchDashboardPostTrend = async (req, res) => {
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
        .json({ message: "Bạn không có quyền xem dashboard" });
    }
    const range = getDashboardDateRange(req.query);
    if (!range) {
      return res.status(400).json({
        message:
          "Khoảng ngày không hợp lệ. Dùng YYYY-MM-DD, ngày bắt đầu không sau ngày kết thúc và tối đa 90 ngày",
      });
    }
    const counts = await prisma.$transaction(
      Array.from({ length: range.days }, (_, index) =>
        prisma.tinDang.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: new Date(range.start.getTime() + index * DAY_MS),
              lt: new Date(range.start.getTime() + (index + 1) * DAY_MS),
            },
          },
        }),
      ),
    );
    const data = counts.map((count, index) => ({
      date: new Date(range.start.getTime() + VN_OFFSET_MS + index * DAY_MS)
        .toISOString()
        .slice(0, 10),
      count,
    }));
    return res.status(200).json({
      data,
      startDate: range.startDate,
      endDate: range.endDate,
      timeZone: "Asia/Ho_Chi_Minh",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lấy biểu đồ tin đăng thất bại" });
  }
};

export const fetchDashboardPostStatuses = async (req, res) => {
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
        .json({ message: "Bạn không có quyền xem dashboard" });
    }
    const groups = await prisma.tinDang.groupBy({
      by: ["trangThai"],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { trangThai: "asc" },
    });
    const counts = new Map(
      groups.map((group) => [group.trangThai, group._count._all]),
    );
    const statuses = new Set([
      "CHO_KIEM_DUYET",
      "DA_DUYET",
      "TU_CHOI",
      "BI_GO",
      ...counts.keys(),
    ]);
    const data = [...statuses].map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
    return res.status(200).json({
      data,
      total: data.reduce((sum, item) => sum + item.count, 0),
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lấy thống kê trạng thái tin đăng thất bại" });
  }
};

export const fetchDashboardTopLocations = async (req, res) => {
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
        .json({ message: "Bạn không có quyền xem dashboard" });
    }
    const groups = await prisma.tinDang.groupBy({
      by: ["maPhuongXa"],
      where: { deletedAt: null, trangThai: "DA_DUYET" },
      _count: { _all: true },
    });
    if (groups.length === 0) {
      return res.status(200).json({ data: [] });
    }
    const wards = await prisma.phuongXa.findMany({
      where: { maPhuongXa: { in: groups.map((group) => group.maPhuongXa) } },
      select: {
        maPhuongXa: true,
        tinhThanh: { select: { maTinhThanh: true, tenTinhThanh: true } },
      },
    });
    const wardMap = new Map(
      wards.map((ward) => [ward.maPhuongXa, ward.tinhThanh]),
    );
    const totals = new Map();
    for (const group of groups) {
      const province = wardMap.get(group.maPhuongXa);
      if (!province) continue;
      const item = totals.get(province.maTinhThanh) ?? {
        ...province,
        count: 0,
      };
      item.count += group._count._all;
      totals.set(province.maTinhThanh, item);
    }
    const data = [...totals.values()]
      .sort(
        (a, b) =>
          b.count - a.count || a.maTinhThanh.localeCompare(b.maTinhThanh),
      )
      .slice(0, 5);
    return res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Lấy thống kê tỉnh thành thất bại" });
  }
};
