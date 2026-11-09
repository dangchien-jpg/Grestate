import type { ValuationResult } from "@/types/valuation";
const number = (value?: number) =>
  value === undefined
    ? "--"
    : value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
const money = (billions: number) =>
  billions < 1
    ? `${number(billions * 1000)} Triệu VNĐ`
    : `${number(billions)} Tỷ VNĐ`;

export default function PredictResult({
  result,
  pending,
}: {
  result: ValuationResult | null;
  pending: boolean;
}) {
  const millions = result !== null && result.total_price_billion < 1;
  return (
    <section
      aria-live="polite"
      aria-busy={pending}
      className="rounded-2xl bg-gradient-to-br from-primary to-slate-900 p-6 text-white shadow-lg"
    >
      <h2 className="text-sm text-indigo-200">
        Kết quả dự đoán giá bất động sản
      </h2>
      <p className="my-3">
        <strong className="text-4xl text-emerald-400">
          {result
            ? number(result.total_price_billion * (millions ? 1000 : 1))
            : "--"}
        </strong>{" "}
        {millions ? "Triệu" : "Tỷ"} VNĐ
      </p>
      <p>
        Đơn giá ước tính:{" "}
        <strong>{number(result?.unit_price_million_m2)}</strong> Triệu / m²
      </p>
      <div className="mt-4 space-y-2 border-t border-indigo-700 pt-4 text-sm text-indigo-100">
        <p>
          Khoảng giá tham khảo:{" "}
          {result
            ? `${money(result.min_price_billion)} – ${money(result.max_price_billion)}`
            : "--"}
        </p>
        {pending ? (
          <p>Đang tính giá...</p>
        ) : (
          !result && (
            <p className="text-xs">
              Nhập thông tin và bấm định giá để xem kết quả. Khi thông tin thay
              đổi, cần định giá lại.
            </p>
          )
        )}
      </div>
    </section>
  );
}
