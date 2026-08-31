import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-lg border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-amber-500/80 dark:focus:border-amber-400/80 focus:outline-none focus:ring-3 focus:ring-amber-500/15 dark:focus:ring-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-xs",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
