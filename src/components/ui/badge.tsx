import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
        gold:
          "border border-amber-400 bg-amber-400/20 text-amber-300 font-bold",
        silver:
          "border border-slate-400 bg-slate-400/20 text-slate-300",
        platinum:
          "border border-cyan-400 bg-cyan-400/20 text-cyan-300",
        lowStock:
          "border border-rose-500/40 bg-rose-500/20 text-rose-300 animate-pulse",
        inStock:
          "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300",
        outline: "text-slate-300 border border-slate-700",
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
