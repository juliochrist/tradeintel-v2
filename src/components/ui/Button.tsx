import type { ButtonHTMLAttributes } from "react";
import { clsx } from "../../lib/format";

type ButtonVariant = "primary" | "ghost" | "danger" | "ai";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-blue-500",
  ghost: "border border-border bg-card/50 text-text hover:border-primary/60 hover:bg-primary/10",
  danger: "bg-danger text-white hover:bg-red-400",
  ai: "bg-gradient-to-r from-primary to-accent text-white shadow-[0_12px_35px_rgba(59,130,246,0.25)] hover:shadow-[0_16px_45px_rgba(139,92,246,0.28)]",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
