import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-amber-300 bg-amber-100/70 text-amber-800 hover:bg-amber-100",
        gold:
          "border border-amber-400 bg-amber-400/20 text-amber-800 font-bold",
        silver:
          "border border-slate-300 bg-slate-100 text-slate-700",
        platinum:
          "border border-sky-300 bg-sky-50 text-sky-700",
        lowStock:
          "border border-rose-300 bg-rose-50 text-rose-700 animate-pulse",
        inStock:
          "border border-emerald-300 bg-emerald-50 text-emerald-700",
        outline: "text-slate-700 border border-slate-300 bg-white",
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
