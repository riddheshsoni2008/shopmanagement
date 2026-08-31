import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber-500/30 dark:focus-visible:ring-amber-400/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-md hover:from-amber-600 hover:to-amber-700 hover:shadow-amber-500/20",
        destructive:
          "bg-rose-600 text-white shadow-sm hover:bg-rose-500 focus-visible:ring-rose-500",
        outline:
          "border border-amber-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 hover:border-amber-400 dark:hover:border-slate-600 shadow-xs",
        secondary:
          "bg-amber-100 dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-slate-700 hover:bg-amber-200/80 dark:hover:bg-slate-700",
        ghost:
          "text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-800 dark:hover:text-amber-400",
        link: "text-amber-600 dark:text-amber-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
