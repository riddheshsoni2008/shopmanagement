"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getClients, ClientSummary } from "@/actions/clients";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIGS } from "@/lib/category-config";
import type { BusinessCategory } from "@/lib/category-config";
import {
  Users, Search, Plus, Phone, Mail, MapPin,
  Calendar, ShoppingBag, ArrowRight, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ClientsListProps {
  category: "studio" | "clothing";
  initialClients: ClientSummary[];
  initialTotal: number;
}

export function ClientsList({ category, initialClients, initialTotal }: ClientsListProps) {
  const cfg = CATEGORY_CONFIGS[category];
  const base = `/dashboard/${category}`;
  const isStudio = category === "studio";

  const accentColor = isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400";
  const badgeColor = isStudio
    ? "bg-violet-100 dark:bg-violet-500/10 text-violet-800 dark:text-violet-300 border-violet-200"
    : "bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-200";

  const [clients, setClients] = useState<ClientSummary[]>(initialClients);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    setSearch(term);
    startTransition(async () => {
      const res = await getClients(category, { search: term });
      if (res.success && res.data) {
        setClients(res.data.clients);
        setTotal(res.data.total);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-serif ${accentColor}`}>
            {cfg.label} — Clients Directory
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Client contacts, booking history, and cumulative billing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`${base}/orders/new`}>
            <Button size="sm" className="font-semibold text-xs sm:text-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by client name, phone, or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 text-xs sm:text-sm"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <Card className="py-12 text-center border-dashed">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No clients found</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Clients are automatically recorded whenever you create a new order, or you can search with different terms.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client._id} href={`${base}/clients/${client._id}`}>
              <Card className="hover:shadow-md hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer h-full flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {client.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5 flex items-center gap-1.5 text-slate-500">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="font-mono">{client.phone}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] font-semibold ${badgeColor}`}>
                      {client.totalOrders} {client.totalOrders === 1 ? "order" : "orders"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-2.5">
                  {client.email && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Spend:</span>
                    <span className={`font-mono font-bold ${accentColor}`}>
                      {formatCurrency(client.totalRevenue)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

