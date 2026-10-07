"use client";

import { cn } from "@/shared/utils/cn";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  hint,
  icon,
  disabled = false,
  required = false,
  className,
  inputClassName,
  ...props
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-xs uppercase tracking-wider text-[#A1A1A6]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#68686E]">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "w-full py-2 px-3 text-xs text-[#F5F5F7] bg-[#141416] rounded-none",
            "border border-[#222226] placeholder-[#68686E] font-mono",
            "focus:outline-none focus:border-[#C5A880]",
            "transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
            "text-[16px] sm:text-xs",
            icon && "pl-9",
            error && "border-red-500 focus:border-red-500",
            inputClassName
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-[#68686E]">{hint}</p>
      )}
    </div>
  );
}
