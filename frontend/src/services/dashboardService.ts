import api from "@/lib/axios";
import { isAxiosError } from "axios";

export type DashboardDateRange = { startDate: string; endDate: string };
export type DashboardOverview = {
  publishedPosts: number;
  pendingPosts: number;
  overduePendingPosts: number;
  pendingReports: number;
  newUsers: number;
};
export type DashboardTrend = { date: string; count: number };
export type DashboardStatus = { status: string; count: number };
export type DashboardLocation = {
  maTinhThanh: string;
  tenTinhThanh: string;
  count: number;
};
type DateMetadata = DashboardDateRange & { timeZone: string };

export function dashboardError(error: unknown) {
  return isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Không thể tải dashboard. Vui lòng thử lại.";
}

export const dashboardService = {
  overview: async (params: DashboardDateRange, signal?: AbortSignal) =>
    (
      await api.get<DateMetadata & { overview: DashboardOverview }>(
        "/admin/dashboard/overview",
        { params, signal },
      )
    ).data,
  postTrend: async (params: DashboardDateRange, signal?: AbortSignal) =>
    (
      await api.get<DateMetadata & { data: DashboardTrend[] }>(
        "/admin/dashboard/post-trend",
        { params, signal },
      )
    ).data,
  postStatuses: async (signal?: AbortSignal) =>
    (
      await api.get<{ data: DashboardStatus[]; total: number }>(
        "/admin/dashboard/post-statuses",
        { signal },
      )
    ).data,
  topLocations: async (signal?: AbortSignal) =>
    (
      await api.get<{ data: DashboardLocation[] }>(
        "/admin/dashboard/top-locations",
        { signal },
      )
    ).data,

};

