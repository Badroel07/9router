"use client";

import { cn } from "@/shared/utils/cn";

export default function Card({
  children,
  title,
  subtitle,
  icon,
  action,
  padding = "md",
  hover = false,
  elev = false,
  className,
  ...props
}) {
  const paddings = {
    none: "",
    xs: "p-3",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-[#0F0F10] border border-[#222226] rounded-none text-[#F5F5F7]",
        hover && "hover:border-[#C5A880]/50 transition-colors cursor-pointer",
        paddings[padding],
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#222226]">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="material-symbols-outlined text-[18px] text-[#C5A880]">{icon}</span>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-semibold tracking-wide uppercase">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#A1A1A6] mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

Card.Section = function CardSection({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "p-3.5 rounded-none",
        "bg-[#141416] border border-[#222226]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
