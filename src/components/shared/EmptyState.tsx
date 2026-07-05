import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
        <Icon className="h-6 w-6 text-zinc-400" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        {description && <p className="text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
