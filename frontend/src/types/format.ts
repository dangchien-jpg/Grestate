export const numberFormat = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
});
export function formatDate(value: string | null) {
  const posted = Date.parse(value ?? "");
  if (!Number.isFinite(posted)) return "Đang cập nhật";
  const dayInVietnam = (time: number) =>
    Math.floor((time + 7 * 3600000) / 86400000);
  const days = dayInVietnam(Date.now()) - dayInVietnam(posted);
  if (days < 0) return dateFormat.format(posted);
  return days === 0 ? "Đăng hôm nay" : `${days} ngày trước`;
}
