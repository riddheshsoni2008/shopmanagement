import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-amber-300 dark:border-amber-500/30 bg-amber-100/70 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20",
        gold:
          "border border-amber-400 dark:border-amber-500/40 bg-amber-400/20 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold",
        silver:
          "border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
        platinum:
          "border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300",
        lowStock:
          "border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 animate-pulse",
        inStock:
          "border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
        outline: "text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
