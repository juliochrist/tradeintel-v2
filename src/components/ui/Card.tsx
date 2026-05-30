import type { HTMLAttributes } from "react";
import { clsx } from "../../lib/format";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "glass rounded-xl p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:scale-[1.01]",
        className,
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  delta,
  tone = "success",
  children,
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "success" | "danger";
  children?: React.ReactNode;
}) {
  return (
    <Card className="min-h-[116px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-3 text-2xl font-bold text-text">{value}</p>
          <p className={tone === "success" ? "mt-2 text-xs text-success" : "mt-2 text-xs text-danger"}>{delta}</p>
        </div>
        {children}
      </div>
    </Card>
  );
}
