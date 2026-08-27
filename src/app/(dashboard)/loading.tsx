import { Loader2, Gem } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Gem className="h-8 w-8 animate-pulse" />
        </div>
        <Loader2 className="absolute -inset-2 h-20 w-20 animate-spin text-amber-400/40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold font-serif text-amber-400">
          Loading Shop Data...
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Fetching live inventory & analytics</p>
      </div>
    </div>
  );
}
