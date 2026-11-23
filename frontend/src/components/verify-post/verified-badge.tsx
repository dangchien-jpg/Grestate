import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ verified }: { verified?: boolean }) {
  if (!verified) return null;
  return (
    <span className="mr-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-sm bg-emerald-100 px-1.5 py-0.5 align-middle text-xs italic font-bold leading-4 text-emerald-800">
      <BadgeCheck aria-hidden="true" className="size-3.5" />
      Đã xác thực
    </span>
  );
}
