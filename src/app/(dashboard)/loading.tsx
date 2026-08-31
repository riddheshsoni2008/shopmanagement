export default function Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="border-b border-amber-200 dark:border-slate-800 pb-6 space-y-2">
        <div className="h-8 w-64 rounded-xl bg-amber-200/60 dark:bg-slate-800/60 animate-pulse" />
        <div className="h-4 w-96 rounded-lg bg-amber-100/60 dark:bg-slate-800/40 animate-pulse" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-amber-200 dark:border-slate-800 bg-amber-50/60 dark:bg-slate-900/60 p-6 space-y-3 animate-pulse"
          >
            <div className="h-4 w-28 rounded bg-amber-200/80 dark:bg-slate-800" />
            <div className="h-8 w-36 rounded bg-amber-500/20" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="h-96 rounded-2xl border border-amber-200 dark:border-slate-800 bg-amber-50/50 dark:bg-slate-900/50 p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-amber-200/80 dark:bg-slate-800" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-amber-100/50 dark:bg-slate-800/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
