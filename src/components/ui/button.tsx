import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        primary: "bg-[#003087] text-white shadow-sm hover:bg-[#00256e] hover:shadow-md active:bg-[#001d56]",
        gold: "bg-[#D4AF37] text-[#001F5B] shadow-[0_0_20px_rgba(212,175,55,0.3),0_0_60px_rgba(212,175,55,0.1)] hover:bg-[#E6C247] hover:shadow-[0_0_28px_rgba(212,175,55,0.45),0_0_72px_rgba(212,175,55,0.18)] active:bg-[#C49B27] font-semibold",
        outline: "border border-[#003087] bg-transparent text-[#003087] hover:bg-[#003087]/5 hover:border-[#003087]/80 active:bg-[#003087]/10 dark:text-white dark:border-white dark:hover:bg-white/10",
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 px-7 text-base has-[>svg]:px-5",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
)

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
