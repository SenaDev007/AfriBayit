"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
      primary:
        "bg-[#0070BA] text-white hover:bg-[#005fa3] focus:ring-[#0070BA] shadow-lg hover:shadow-xl",
      secondary:
        "bg-[#003087] text-white hover:bg-[#002570] focus:ring-[#003087] shadow-md hover:shadow-lg",
      outline:
        "border-2 border-[#0070BA] text-[#0070BA] hover:bg-[#0070BA] hover:text-white focus:ring-[#0070BA]",
      ghost:
        "text-[#0070BA] hover:bg-blue-50 focus:ring-[#0070BA]",
      gold:
        "bg-gradient-to-r from-[#FFB900] to-[#FF8C00] text-white hover:from-[#e6a800] hover:to-[#e07800] focus:ring-[#FFB900] shadow-lg hover:shadow-xl",
      danger:
        "bg-[#D93025] text-white hover:bg-[#c12a20] focus:ring-[#D93025]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
      xl: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          icon && <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {!loading && iconRight && (
          <span className="flex-shrink-0">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
