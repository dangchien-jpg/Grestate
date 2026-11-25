import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import {
  Building2,
  Clock3,
  Flag,
  LoaderCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dashboardService,
  dashboardError,
  type DashboardDateRange,
  type DashboardOverview,
  type DashboardTrend,
  type DashboardStatus,
  type DashboardLocation,
} from "@/services/dashboardService";

const DAY = 86400000;
const number = new Intl.NumberFormat("vi-VN");
const statusLabels: Record<string, string> = {
  CHO_KIEM_DUYET: "Chờ kiểm duyệt",
  DA_DUYET: "Đang hiển thị",
  TU_CHOI: "Từ chối",
  BI_GO: "Bị gỡ",
};
const colors = [
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#64748b",
  "#8b5cf6",
  "#0ea5e9",
];
function presetRange(days: number): DashboardDateRange {
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  return {
    startDate: new Date(Date.parse(today) - (days - 1) * DAY)
      .toISOString()
      .slice(0, 10),
    endDate: today,
  };
}
function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-sm border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm ">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="flex min-h-36 items-center justify-center text-center text-sm ">
      {children}
    </p>
  );
}

function TrendChart({ data }: { data: DashboardTrend[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total) return <Empty>Chưa có tin mới trong khoảng thời gian này.</Empty>;
  const max = Math.max(1, ...data.map((item) => item.count));
  const step = 640 / Math.max(data.length, 1);
  return (
    <>
      <p className="mb-3 text-sm ">
        Tổng cộng{" "}
        <strong className="text-slate-900">{number.format(total)}</strong> tin
        mới
      </p>
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 720 250"
          role="img"
          aria-label="Số tin đăng mới theo ngày"
          className="w-full min-w-100"
        >
          {[0, 1, 2, 3, 4].map((tick) => {
            const value = Math.ceil(max / 4) * tick;
            const ceiling = Math.ceil(max / 4) * 4;
            const y = 210 - (value / ceiling) * 180;
            return (
              <g key={tick}>
                <line x1="48" x2="695" y1={y} y2={y} stroke="#e2e8f0" />
                <text
                  x="39"
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                >
                  {number.format(value)}
                </text>
              </g>
            );
          })}
          {data.map((item, index) => {
            const height = (item.count / (Math.ceil(max / 4) * 4)) * 180;
            const x = 50 + index * step;
            return (
              <g key={item.date}>
                <rect
                  x={x + step * 0.15}
                  y={210 - height}
                  width={step * 0.7}
                  height={height}
                  rx="2"
                  fill="#10b981"
                  tabIndex={0}
                >
                  <title>
                    {item.date.split("-").reverse().join("/")}: {item.count} tin
                  </title>
                </rect>
                {(index % Math.max(1, Math.ceil(data.length / 7)) === 0 ||
                  index === data.length - 1) && (
                  <text
                    x={x + step / 2}
                    y="232"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#64748b"
                  >
                    {item.date.slice(8)}/{item.date.slice(5, 7)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <details className="mt-2 text-sm ">
        <summary className="cursor-pointer">Xem số liệu theo ngày</summary>
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Ngày</th>
                <th>Số tin mới</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.date}>
                  <td className="py-1">
                    {item.date.split("-").reverse().join("/")}
                  </td>
                  <td>{number.format(item.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

function StatusChart({
  data,
  total,
}: {
  data: DashboardStatus[];
  total: number;
}) {
  if (!total) return <Empty>Chưa có tin đăng.</Empty>;
  const segments = data.reduce<{ offset: number; stops: string[] }>(
    (result, item, index) => {
      const end = result.offset + (item.count / total) * 100;
      return {
        offset: end,
        stops: [
          ...result.stops,
          colors[index % colors.length] +
            " " +
            result.offset +
            "% " +
            end +
            "%",
        ],
      };
    },
    { offset: 0, stops: [] },
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div
        className="flex size-44 shrink-0 items-center justify-center rounded-full"
        style={{
          background: "conic-gradient(" + segments.stops.join(",") + ")",
        }}
        role="img"
        aria-label={"Phân bố trạng thái của " + total + " tin đăng"}
      >
        <div className="flex size-32 flex-col items-center justify-center rounded-full bg-white">
          <strong className="text-3xl">{number.format(total)}</strong>
          <span className="text-xs ">Tổng tin đăng</span>
        </div>
      </div>
      <ul className="min-w-40 flex-1 space-y-3 text-sm">
        {data.map((item, index) => (
          <li key={item.status} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="flex-1 ">
              {statusLabels[item.status] ?? item.status}
            </span>
            <strong>{number.format(item.count)}</strong>
            <span className="w-12 text-right text-xs ">
              {((item.count / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type DashboardData = {
  overview: DashboardOverview;
  trend: DashboardTrend[];
  statuses: DashboardStatus[];
  total: number;
  locations: DashboardLocation[];
};

function DashboardContent({
  range,
  onRefresh,
}: {
  range: DashboardDateRange;
  onRefresh: () => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    Promise.all([
      dashboardService.overview(range, signal),
      dashboardService.postTrend(range, signal),
      dashboardService.postStatuses(signal),
      dashboardService.topLocations(signal),
    ])
      .then(([overview, trend, statuses, locations]) => {
        if (!signal.aborted)
          setData({
            overview: overview.overview,
            trend: trend.data,
            statuses: statuses.data,
            total: statuses.total,
            locations: locations.data,
          });
      })
      .catch((failure: unknown) => {
        if (!signal.aborted) setError(dashboardError(failure));
      });
    return () => controller.abort();
  }, [range]);
  if (error)
    return (
      <div
        role="alert"
        className="rounded-sm border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        <p>{error}</p>
        <Button variant="outline" className="mt-3" onClick={onRefresh}>
          Thử lại
        </Button>
      </div>
    );
  if (!data)
    return (
      <div
        role="status"
        className="flex min-h-80 items-center justify-center gap-2 "
      >
        <LoaderCircle className="size-5 animate-spin" />
        Đang tải dashboard...
      </div>
    );
  const cards = [
    {
      label: "Tin đang hiển thị",
      value: data.overview.publishedPosts,
      note: "Đang công khai trên hệ thống",
      icon: Building2,
      color: "bg-emerald-50 text-emerald-600",
      link: null,
    },
    {
      label: "Tin chờ kiểm duyệt",
      value: data.overview.pendingPosts,
      note:
        number.format(data.overview.overduePendingPosts) +
        " tin chờ quá 24 giờ",
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
      link: "/admin/censor",
    },
    {
      label: "Báo cáo chưa xử lý",
      value: data.overview.pendingReports,
      note: "Bao gồm báo cáo đang xử lý",
      icon: Flag,
      color: "bg-red-50 text-red-600",
      link: "/admin/reports",
    },
    {
      label: "Người dùng mới",
      value: data.overview.newUsers,
      note: "Trong khoảng thời gian đã chọn",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      link: null,
    },
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, color, link }) => {
          const content = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium ">{label}</span>
                <span className={"rounded-lg p-2 " + color}>
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                {number.format(value)}
              </p>
              <p className="mt-2 text-xs ">{note}</p>
            </>
          );
          const classes =
            "rounded-sm border border-slate-200 bg-white p-5 shadow-sm";
          return link ? (
            <Link
              key={label}
              to={link}
              className={
                classes +
                " transition hover:border-emerald-400 focus-visible:outline-emerald-600"
              }
            >
              {content}
            </Link>
          ) : (
            <div key={label} className={classes}>
              {content}
            </div>
          );
        })}
      </div>
      <div className="grid gap-5 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <Panel title="Tin mới theo thời gian" description="">
            <TrendChart data={data.trend} />
          </Panel>
        </div>
        <div className="min-w-0 xl:col-span-2">
          <Panel
            title="Trạng thái tin đăng"
            description="Tất cả tin chưa bị xóa tại thời điểm hiện tại."
          >
            <StatusChart data={data.statuses} total={data.total} />
          </Panel>
        </div>
      </div>
      <Panel
        title="Top 5 tỉnh/thành có nhiều tin"
        description="Chỉ tính tin đang hiển thị tại thời điểm hiện tại."
      >
        {!data.locations.length ? (
          <Empty>Chưa có tin đang hiển thị theo khu vực.</Empty>
        ) : (
          <ol className="space-y-4">
            {data.locations.map((item, index) => (
              <li key={item.maTinhThanh} className="flex items-center gap-3">
                <span className="w-5 text-sm text-slate-400">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex justify-between gap-3 text-sm">
                    <span>{item.tenTinhThanh}</span>
                    <strong>{number.format(item.count)} tin</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width:
                          (item.count /
                            Math.max(
                              1,
                              ...data.locations.map(
                                (location) => location.count,
                              ),
                            )) *
                            100 +
                          "%",
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState(() => presetRange(30));
  const [draft, setDraft] = useState(range);
  const [filterError, setFilterError] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);
  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const days =
      (Date.parse(draft.endDate) - Date.parse(draft.startDate)) / DAY + 1;
    if (!Number.isFinite(days) || days < 1 || days > 90) {
      setFilterError("Vui lòng chọn khoảng ngày hợp lệ, tối đa 90 ngày.");
      return;
    }
    setFilterError("");
    setRange({ ...draft });
    refresh();
  }
  function selectPreset(days: number) {
    const next = presetRange(days);
    setDraft(next);
    setRange(next);
    setFilterError("");
    refresh();
  }
  return (
    <div className="space-y-5 bg-slate-50/60 p-4 sm:p-6">
      <div className="rounded-sm border border-slate-200 bg-white p-4">
        <form onSubmit={applyRange} className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2 self-end">
            {[7, 30].map((days) => (
              <Button
                type="button"
                key={days}
                variant="outline"
                onClick={() => selectPreset(days)}
                className="border border-[#ccc] bg-white"
              >
                {days} ngày
              </Button>
            ))}
          </div>
          <label className="grid gap-1 text-xs font-medium ">
            Từ ngày
            <input
              required
              type="date"
              value={draft.startDate}
              onChange={(event) =>
                setDraft({ ...draft, startDate: event.target.value })
              }
              className="h-8 rounded-sm border border-[#ccc] bg-white px-2 text-sm"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium ">
            Đến ngày
            <input
              required
              type="date"
              value={draft.endDate}
              onChange={(event) =>
                setDraft({ ...draft, endDate: event.target.value })
              }
              className="h-8 rounded-sm border border-[#ccc] bg-white px-2 text-sm"
            />
          </label>
          <Button type="submit" className="px-4">
            Áp dụng
          </Button>
          <div className="flex flex-wrap items-end justify-end gap-4">
            <Button
              variant="outline"
              className="rounded-sm bg-white"
              onClick={refresh}
            >
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
          </div>
        </form>
        {filterError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {filterError}
          </p>
        )}
        <p className="mt-3 text-xs ">
          Đang xem: {range.startDate.split("-").reverse().join("/")} –{" "}
          {range.endDate.split("-").reverse().join("/")}.
        </p>
      </div>
      <DashboardContent
        key={range.startDate + range.endDate + revision}
        range={range}
        onRefresh={refresh}
      />
    </div>
  );
}
