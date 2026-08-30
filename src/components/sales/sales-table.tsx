"use client";

import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Receipt,
  Search,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceModal } from "@/components/sales/invoice-modal";

interface SalesTableProps {
  initialData: {
    sales: Array<any>;
    total: number;
    page: number;
    totalPages: number;
  };
  shopName?: string;
}

export function SalesTable({ initialData, shopName }: SalesTableProps) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Client filtering
  let filtered = initialData.sales.filter((s) => {
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = s.customerName.toLowerCase().includes(q);
      const matchPhone = s.customerPhone.includes(q);
      if (!matchName && !matchPhone) return false;
    }
    if (startDate) {
      if (new Date(s.createdAt) < new Date(startDate)) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(s.createdAt) > end) return false;
    }
    return true;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewInvoice = (sale: any) => {
    setSelectedSale(sale);
    setInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search & Date Range Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm backdrop-blur-md transition-colors duration-200">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">From:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-36 h-10 text-xs"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">To:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-36 h-10 text-xs"
            />
          </div>

          {(search || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
              className="text-xs text-amber-700 dark:text-amber-400"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Sales History Table */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-900/40 py-16 text-center">
          <Receipt className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">No Sales Invoices Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            No transaction records match your search criteria or date filters.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Billed By</TableHead>
              <TableHead className="text-right">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((sale) => (
              <TableRow key={sale._id}>
                <TableCell className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  #{sale._id.slice(-8).toUpperCase()}
                </TableCell>

                <TableCell className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {sale.customerName}
                </TableCell>

                <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {sale.customerPhone}
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{sale.itemsCount} pc(s)</Badge>
                </TableCell>

                <TableCell className="font-bold text-amber-700 dark:text-amber-400">
                  {formatCurrency(sale.totalAmount)}
                </TableCell>

                <TableCell>
                  {sale.paymentStatus === "PENDING" ? (
                    <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">PENDING</Badge>
                  ) : sale.paymentStatus === "PARTIAL" ? (
                    <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30">PARTIAL</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">PAID</Badge>
                  )}
                </TableCell>

                <TableCell className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                  {formatDateTime(sale.createdAt)}
                </TableCell>

                <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                  {sale.soldBy?.name || "Staff"}
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewInvoice(sale)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> View Receipt
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-amber-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing Page <strong className="text-slate-900 dark:text-slate-200">{currentPage}</strong> of{" "}
            <strong className="text-slate-900 dark:text-slate-200">{totalPages}</strong> ({filtered.length} total sales)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        sale={selectedSale}
        shopName={shopName}
      />
    </div>
  );
}
