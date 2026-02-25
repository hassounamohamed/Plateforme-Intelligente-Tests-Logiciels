import React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: string; // material symbol name
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary/90 shadow-lg focus:ring-primary/50",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400/50",
  outline:
    "border border-primary text-primary bg-transparent hover:bg-primary/10 focus:ring-primary/40",
  ghost:
    "text-primary bg-transparent hover:bg-primary/10 focus:ring-primary/40",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow focus:ring-red-400/50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all",
        "focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-[1.1em]">
          progress_activity
        </span>
      ) : leftIcon ? (
        <span className="material-symbols-outlined text-[1.1em]">
          {leftIcon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
