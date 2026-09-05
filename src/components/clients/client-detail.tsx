"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIGS, ORDER_STATUSES } from "@/lib/category-config";
import type { ClientDetail } from "@/actions/clients";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar,
  ShoppingBag, Coins, Plus, ChevronRight, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_STYLES: Record<string, string> = {
  received: "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-500/40",
  in_progress: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
  completed: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  delivered: "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-500/40",
};

interface ClientDetailProps {
  client: ClientDetail;
  category: "studio" | "clothing";
}

export function ClientDetailView({ client, category }: ClientDetailProps) {
  const cfg = CATEGORY_CONFIGS[category];
  const base = `/dashboard/${category}`;
  const isStudio = category === "studio";

  const accentColor = isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400";
  const accentCard = isStudio
    ? "border-violet-300 dark:border-violet-500/30 bg-violet-50/70 dark:bg-violet-500/10"
    : "border-rose-300 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link href={`${base}/clients`}>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">
              {client.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Client since {formatDate(client.createdAt)}</span>
              <span>•</span>
              <span className="font-mono">{client.phone}</span>
            </p>
          </div>
        </div>

        <Link href={`${base}/orders/new`}>
          <Button size="sm" className="font-semibold text-xs sm:text-sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Book New Order
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className={accentCard}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Total Lifetime Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold font-mono ${accentColor}`}>
              {formatCurrency(client.totalRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across all completed & active jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Total Orders Booked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {client.totalOrders}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Order records on file</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Contact & Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {client.email && (
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{client.address}</span>
              </div>
            )}
            {client.notes && (
              <div className="flex items-center gap-1.5 truncate text-slate-500 italic">
                <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="truncate">{client.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order & Booking History</CardTitle>
          <CardDescription>All past and active orders for this client</CardDescription>
        </CardHeader>
        <CardContent>
          {client.orders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No orders logged for this client yet.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Agreed</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.orders.map((order) => {
                    const statusConfig = ORDER_STATUSES.find((s) => s.value === order.status);
                    const statusBadgeClass = STATUS_STYLES[order.status] || "bg-slate-100 text-slate-700";

                    return (
                      <TableRow key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="font-mono font-bold text-xs sm:text-sm">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          {order.orderType}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(order.orderDate)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusBadgeClass}`}>
                            {statusConfig?.label || order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm font-semibold">
                          {formatCurrency(order.agreedAmount)}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs sm:text-sm font-semibold ${
                          order.balanceDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {formatCurrency(order.balanceDue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`${base}/orders/${order._id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              View <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

