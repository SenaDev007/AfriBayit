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
    default: "bg-white border border-gray-100 shadow-sm",
    glass: "glass",
    elevated: "bg-white shadow-xl border border-gray-50",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-2xl",
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
