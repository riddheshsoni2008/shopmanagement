"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { generateInvoicePDF, InvoicePDFData } from "@/lib/pdf-generator";
import { Printer, Download, Gem, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: {
    _id: string;
    customerName: string;
    customerPhone: string;
    items: Array<{
      name: string;
      qty: number;
      weight: number;
      pricePerGram: number;
      makingCharge: number;
      lineTotal: number;
    }>;
    discount: number;
    totalAmount: number;
    paymentStatus?: string;
    paymentMethod?: string;
    soldBy?: { name: string };
    createdAt: string;
  } | null;
  shopName?: string;
}

export function InvoiceModal({ isOpen, onClose, sale, shopName = "Aura Luxury Jewelers" }: InvoiceModalProps) {
  if (!sale) return null;

  const pdfData: InvoicePDFData = {
    invoiceId: sale._id,
    shopName,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    createdAt: sale.createdAt,
    soldBy: sale.soldBy?.name || "Staff",
    paymentStatus: sale.paymentStatus || "PAID",
    paymentMethod: sale.paymentMethod || "Cash",
    items: sale.items,
    discount: sale.discount,
    totalAmount: sale.totalAmount,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateInvoicePDF(pdfData);
  };

  let subtotal = 0;
  sale.items.forEach((item) => (subtotal += item.lineTotal));

  const pStatus = sale.paymentStatus || "PAID";
  const pMethod = sale.paymentMethod || "Cash";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Official Sales Invoice & Receipt"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div id="printable-invoice" className="space-y-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-amber-400 flex items-center gap-2">
                <Gem className="h-6 w-6 text-amber-400" /> {shopName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Premium Fine Jewelry & Tax Invoice</p>
            </div>
            <div className="text-right">
              {pStatus === "PAID" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="h-3.5 w-3.5" /> PAID RECEIPT
                </span>
              )}
              {pStatus === "PENDING" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                  PENDING PAYMENT
                </span>
              )}
              {pStatus === "PARTIAL" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/30">
                  PARTIAL PAYMENT
                </span>
              )}
              <p className="text-xs font-mono font-bold text-slate-300 mt-2">
                INV #{sale._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-slate-400" suppressHydrationWarning>{formatDateTime(sale.createdAt)}</p>
            </div>
          </div>

          {/* Customer & Bill Details */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-900/80 p-4 border border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To Customer
              </span>
              <p className="text-sm font-bold text-slate-100">{sale.customerName}</p>
              <p className="text-slate-300 mt-0.5">Phone: {sale.customerPhone}</p>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Issued By Staff
              </span>
              <p className="text-sm font-bold text-slate-100">{sale.soldBy?.name || "Store Cashier"}</p>
              <p className="text-slate-300 mt-0.5">Mode: {pMethod} • Status: {pStatus}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Rate / g</TableHead>
                <TableHead className="text-right">Making</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-xs font-mono text-slate-500">{idx + 1}</TableCell>
                  <TableCell className="font-semibold text-slate-200">{item.name}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{item.qty}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{item.weight} g</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(item.pricePerGram)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(item.makingCharge)}</TableCell>
                  <TableCell className="text-right font-bold text-slate-100">{formatCurrency(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Discount Applied:</span>
                  <span className="font-semibold">- {formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-amber-400">
                <span>Grand Total Paid:</span>
                <span className="text-base">{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
          <Button onClick={handleDownloadPDF} className="font-bold">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
