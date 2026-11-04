const numberFormat = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 1,
});

export function formatPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "Liên hệ";
  return value >= 1e9
    ? `${numberFormat.format(value / 1e9)} tỷ`
    : `${numberFormat.format(value / 1e6)} triệu`;
}
