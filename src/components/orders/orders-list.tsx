"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CATEGORY_CONFIGS, ORDER_STATUSES } from "@/lib/category-config";
import type { BusinessCategory } from "@/lib/category-config";
import type { OrderSummary } from "@/actions/orders";
import { updateOrderStatus, deleteOrder } from "@/actions/orders";
import { toast } from "sonner";
import {
  Plus, Search, ClipboardList, ChevronDown, Trash2,
  Eye, Filter, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_STYLES: Record<string, string> = {
  received: "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300",
  in_progress: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300",
  completed: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300",
  delivered: "bg-violet-100 dark:bg-violet-500/20 text-violet-800 dark:text-violet-300",
};

interface OrdersListProps {
  category: "studio" | "clothing";
  initialOrders: OrderSummary[];
  userRole: "admin" | "staff";
}

export function OrdersList({ category, initialOrders, userRole }: OrdersListProps) {
  const cfg = CATEGORY_CONFIGS[category];
  const base = `/dashboard/${category}`;
  const isStudio = category === "studio";
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const accentText = isStudio ? "text-violet-700 dark:text-violet-400" : "text-rose-700 dark:text-rose-400";
  const accentBtn = isStudio
    ? "bg-violet-600 hover:bg-violet-700 text-white"
    : "bg-rose-600 hover:bg-rose-700 text-white";

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.orderType.toLowerCase().includes(search.toLowerCase()) ||
      o.clientPhone.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(id, status as any);
      if (res.success) {
        setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: status as any } : o)));
        toast.success("Status updated");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = (id: string, orderNumber: string) => {
    if (!confirm(`Delete order ${orderNumber}? This will also delete all expenses linked to it.`)) return;
    startTransition(async () => {
      const res = await deleteOrder(id);
      if (res.success) {
        setOrders((prev) => prev.filter((o) => o._id !== id));
        toast.success("Order deleted");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold font-serif ${accentText}`}>
            {cfg.label} — Orders
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} order(s) found
          </p>
        </div>
        <Link href={`${base}/orders/new`}>
          <Button size="sm" className={`font-semibold text-xs sm:text-sm ${accentBtn}`}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Order
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search client, order number, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-500 dark:text-slate-400">
              {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
            </p>
            <Link href={`${base}/orders/new`} className="mt-4">
              <Button size="sm">Create First Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {order.clientName}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {order.clientPhone}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {order.orderType}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                        {order.dueDate ? formatDate(order.dueDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={isPending}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${STATUS_STYLES[order.status] || ""}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className={`text-right font-bold font-mono text-sm ${accentText}`}>
                        {formatCurrency(order.agreedAmount)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {order.balanceDue > 0 ? (
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            {formatCurrency(order.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Paid</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        <span className={order.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {formatCurrency(order.profit)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Link href={`${base}/orders/${order._id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {userRole === "admin" && (
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              onClick={() => handleDelete(order._id, order.orderNumber)}
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
