import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string; // material symbol name
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            "block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white",
            "shadow-md ring-1 ring-inset bg-white/90 dark:bg-[#1c2127]",
            "placeholder:text-slate-400 dark:placeholder:text-[#9dabb9]",
            "focus:outline-0 focus:ring-2 focus:ring-inset text-sm font-normal leading-normal transition-all",
            leftIcon ? "pl-10" : "",
            error
              ? "ring-red-500 focus:ring-red-500"
              : "ring-primary-200 dark:ring-primary-900/60 focus:ring-primary-600",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
              ? `${inputId}-hint`
              : undefined
          }
          {...props}
        />
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-500">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
