import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export default function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  hover = false,
}: CardProps) {
  const variants = {
    default:
      "bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
    glass: "glass rounded-2xl",
    elevated:
      "bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-slate-50",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-8",
    lg: "p-10",
  };

  return (
    <div
      className={cn(
        variants[variant],
        paddings[padding],
        hover && "card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
