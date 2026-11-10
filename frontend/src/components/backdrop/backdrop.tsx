import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

export default function Backdrop({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn("fixed inset-0 z-50 bg-slate-950/50", className)}
    />
  );
}
