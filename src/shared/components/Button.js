"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  primary: "bg-[#E5C378] hover:bg-[#C5A880] text-[#080808] font-semibold border border-transparent disabled:opacity-50",
  secondary: "bg-[#141416] hover:bg-[#1C1C1F] text-[#F5F5F7] border border-[#2E2E33] hover:border-[#C5A880] disabled:opacity-50",
  outline: "bg-transparent border border-[#222226] text-[#F5F5F7] hover:bg-[#141416] hover:border-[#C5A880]",
  ghost: "bg-transparent text-[#A1A1A6] hover:bg-[#141416] hover:text-[#F5F5F7]",
  danger: "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50",
};

const sizes = {
  sm: "h-7 px-2.5 text-xs rounded-none",
  md: "h-8.5 px-3.5 text-xs rounded-none",
  lg: "h-10 px-4 text-sm rounded-none",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 cursor-pointer rounded-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
      )}
    </button>
  );
}
