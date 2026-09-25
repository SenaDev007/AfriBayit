import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // P3.6 — neutral gray skeleton (NOT bg-accent): accent = #009CDE caused a
      // bright-blue flash on every loading state before data arrived. Neutral
      // gray is the professional standard (LinkedIn/Discord/Airbnb) and reads
      // as "loading" without any color flash. .admin-dark overrides this to a
      // translucent white in globals.css.
      className={cn("bg-gray-200/80 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
