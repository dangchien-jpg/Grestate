import { useState } from "react";
import { FileText, Images, Play, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VerificationDetail } from "@/services/verifyPostService";

type File = VerificationDetail["minhChungs"][number];
const groups = [
  ["HO_SO_PHAP_LY", "Hồ sơ pháp lý", FileText],
  ["BAT_DONG_SAN_THUC_TE", "Ảnh / video thực tế", Images],
] as const;
export default function EvidenceGallery({
  files,
  reload,
}: {
  files: File[];
  reload: () => void;
}) {
  const [group, setGroup] = useState<File["nhomMinhChung"]>(
    files[0]?.nhomMinhChung ?? "HO_SO_PHAP_LY",
  );
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState("");
  const list = files.filter((f) => f.nhomMinhChung === group);
  const file = list[index] ?? list[0];
  const caption =
    file?.moTa ||
    file?.giayTo?.tenGiayTo ||
    (file?.loaiTep === "VIDEO" ? "Video thực tế" : "Ảnh minh chứng");
  return (
    <section className="min-w-0 rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <h2 className="font-bold">Minh chứng đã gửi</h2>
        <span className="text-sm">{files.length} tệp</span>
      </div>
      <div
        className="flex flex-wrap gap-2 p-4"
        role="group"
        aria-label="Nhóm minh chứng"
      >
        {groups.map(([key, label, Icon]) => (
          <Button
            key={key}
            className="h-10"
            variant={group === key ? "default" : "outline"}
            aria-pressed={group === key}
            onClick={() => {
              setGroup(key);
              setIndex(0);
            }}
          >
            <Icon />
            {label} ({files.filter((f) => f.nhomMinhChung === key).length})
          </Button>
        ))}
      </div>
      {file ? (
        <div className="px-4 pb-4">
          <div
            className={
              file.loaiTep === "VIDEO"
                ? "relative aspect-video w-full max-w-md rounded-sm bg-black"
                : "flex min-h-24 w-fit max-w-full items-center justify-center rounded-sm border bg-slate-50 p-1"
            }
          >
            {broken === file.url ? (
              <div className="space-y-3 rounded-sm bg-slate-100 p-4 text-center text-sm">
                <p>Không tải được tệp minh chứng.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBroken("");
                    reload();
                  }}
                >
                  <RotateCw />
                  Tải lại minh chứng
                </Button>
              </div>
            ) : file.loaiTep === "VIDEO" ? (
              <video
                key={file.url}
                src={file.url}
                controls
                playsInline
                aria-label={caption}
                preload="metadata"
                onError={() => setBroken(file.url)}
                className="absolute inset-0 block h-full w-full rounded-sm object-contain"
              />
            ) : (
              <img
                src={file.url}
                alt={caption}
                onError={() => setBroken(file.url)}
                className="block h-auto w-auto max-h-48 max-w-full object-contain"
              />
            )}
          </div>
          <div className="my-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 text-sm font-semibold break-words">
              {caption}{" "}
              <span className="font-normal">
                · {index + 1}/{list.length}
              </span>
            </div>
          </div>
          {list.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {list.map((f, i) => (
                <button
                  type="button"
                  key={f.maMinhChung}
                  aria-label={"Xem tệp " + (i + 1)}
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                  className={`relative grid h-14 w-20 place-items-center overflow-hidden rounded-sm border-2 bg-slate-100 focus-visible:outline-primary ${i === index ? "border-primary" : "border-transparent"}`}
                >
                  {f.loaiTep === "VIDEO" ? (
                    <Play size={19} />
                  ) : (
                    <img
                      src={f.url}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-0 right-0 rounded-tl-sm bg-black/65 px-1 text-xs text-white">
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="px-4 pb-6 text-sm">Hồ sơ chưa có tệp trong nhóm này.</p>
      )}
    </section>
  );
}
