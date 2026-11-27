import { RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  icon: LucideIcon;
  title: string;
  summary: string;
  statuses: Record<string, string>;
  status: string;
  loading: boolean;
  onStatus: (status: string) => void;
  onRefresh: () => void;
}

export default function QueueToolbar({ icon: Icon, title, summary, statuses, status, loading, onStatus, onRefresh }: Props) {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ccc] p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-sm bg-blue-50 text-primary"><Icon size={22} /></span>
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p role="status" className="text-sm">{summary}</p>
          </div>
        </div>
        <Button variant="outline" className="h-10 border-[#ccc] bg-white" disabled={loading} onClick={onRefresh}>
          <RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới
        </Button>
      </header>
      <nav aria-label={`Lọc trạng thái: ${title}`} className="flex flex-wrap gap-2 border-b border-[#ccc] px-4 py-3 sm:px-6">
        {Object.entries({ ALL: "Tất cả", ...statuses }).map(([key, label]) => (
          <Button key={key} aria-pressed={status === key} variant={status === key ? "default" : "outline"}
            className="rounded-sm border border-[#ccc]" onClick={() => onStatus(key)}>
            {label}
          </Button>
        ))}
      </nav>
    </>
  );
}
