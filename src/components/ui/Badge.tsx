import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "gold" | "success" | "danger" | "gray" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "primary",
  size = "md",
  className,
}: BadgeProps) {
  const variants = {
    primary: "bg-blue-100 text-[#0070BA] border border-blue-200",
    gold: "bg-amber-100 text-amber-700 border border-amber-200",
    success: "bg-green-100 text-[#00A651] border border-green-200",
    danger: "bg-red-100 text-[#D93025] border border-red-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    outline: "border-2 border-[#0070BA] text-[#0070BA] bg-transparent",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
