import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  showCount = false,
  count,
  className,
}: StarRatingProps) {
  const sizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;

          return (
            <svg
              key={i}
              className={cn(sizes[size])}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {partial ? (
                <defs>
                  <linearGradient id={`star-${i}`}>
                    <stop offset={`${(rating % 1) * 100}%`} stopColor="#FFB900" />
                    <stop offset={`${(rating % 1) * 100}%`} stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
              ) : null}
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                fill={
                  partial
                    ? `url(#star-${i})`
                    : filled
                    ? "#FFB900"
                    : "#D1D5DB"
                }
              />
            </svg>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-semibold text-gray-700", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {showCount && count !== undefined && (
        <span className={cn("text-gray-400", textSizes[size])}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
