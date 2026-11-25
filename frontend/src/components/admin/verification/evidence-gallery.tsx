import { useState } from "react";
import { FileText, Images, RotateCw } from "lucide-react";
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
  const list = files.filter((file) => file.nhomMinhChung === group);
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
            onClick={() => setGroup(key)}
          >
            <Icon />
            {label} ({files.filter((f) => f.nhomMinhChung === key).length})
          </Button>
        ))}
      </div>
      {list.length > 0 ? (
        <div className="flex flex-wrap items-start gap-x-3 gap-y-4 px-4 pb-4">
          {list.map((file) => (
            <EvidenceItem
              key={file.maMinhChung + ":" + file.url}
              file={file}
              reload={reload}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 pb-6 text-sm">Hồ sơ chưa có tệp trong nhóm này.</p>
      )}
    </section>
  );
}

function EvidenceItem({ file, reload }: { file: File; reload: () => void }) {
  const [broken, setBroken] = useState(false);
  const caption =
    file.moTa ||
    file.giayTo?.tenGiayTo ||
    (file.loaiTep === "VIDEO" ? "Video thực tế" : "Ảnh thực tế");

  return (
    <figure className="min-w-0 max-w-full">
      {broken ? (
        <div className="space-y-3 rounded-sm bg-slate-100 p-4 text-center text-sm">
          <p>Không tải được tệp minh chứng.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setBroken(false);
              reload();
            }}
          >
            <RotateCw /> Tải lại minh chứng
          </Button>
        </div>
      ) : file.loaiTep === "VIDEO" ? (
        <video
          src={file.url}
          controls
          playsInline
          preload="metadata"
          aria-label={caption}
          onError={() => setBroken(true)}
          className="block aspect-video w-64 max-w-full rounded-sm bg-black object-contain"
        />
      ) : (
        <img
          src={file.url}
          alt={caption}
          loading="lazy"
          onError={() => setBroken(true)}
          className="block h-auto max-h-52 w-auto max-w-full rounded-sm border bg-slate-50 object-contain"
        />
      )}
      <figcaption className="mt-2 break-words text-sm font-medium">
        {caption}
      </figcaption>
    </figure>
  );
}
