import axios from "axios";
import api from "@/lib/axios";
import type {
  Coordinates,
  GeocodedLocation,
  ValuationFieldErrors,
  ValuationMetadata,
  ValuationRequest,
  ValuationResult,
} from "@/types/valuation";

// Reuse the authenticated backend client, including access-token refresh.
const options = (signal?: AbortSignal) => ({ signal, timeout: 30000 });
export const valuationService = {
  metadata: async (signal?: AbortSignal) =>
    (await api.get<ValuationMetadata>("/valuation/metadata", options(signal)))
      .data,
  predict: async (payload: ValuationRequest, signal?: AbortSignal) =>
    (
      await api.post<ValuationResult>(
        "/valuation/predict",
        payload,
        options(signal),
      )
    ).data,
  geocode: async (q: string, signal?: AbortSignal) =>
    (
      await api.get<{ location: GeocodedLocation | null }>(
        "/valuation/geocode",
        { ...options(signal), params: { q } },
      )
    ).data.location,
  reverseGeocode: async (point: Coordinates, signal?: AbortSignal) =>
    (
      await api.get<{ location: GeocodedLocation | null }>(
        "/valuation/reverse-geocode",
        { ...options(signal), params: point },
      )
    ).data.location,
};
export function valuationFieldErrors(error: unknown): ValuationFieldErrors {
  if (!axios.isAxiosError(error)) return {};
  const detail: unknown = error.response?.data?.detail;
  if (!Array.isArray(detail)) return {};
  return Object.fromEntries(
    detail
      .filter((item) => Array.isArray(item.loc) && typeof item.msg === "string")
      .map((item) => [item.loc.at(-1), item.msg]),
  );
}
export function valuationError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
      return "Vui lòng kiểm tra các trường được đánh dấu trong biểu mẫu.";
    if (error.response?.status === 403)
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    if (error.response?.status === 429)
      return "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.";
  }
  return "Không thể kết nối dịch vụ định giá. Vui lòng thử lại.";
}
