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
      hallmarkCharge?: number;
      jadatarCharge?: number;
      rhodiumCharge?: number;
      nangCharge?: number;
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

export function InvoiceModal({
  isOpen,
  onClose,
  sale,
  shopName = "Zeal Jewellers",
}: InvoiceModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const pdfData: InvoicePDFData = {
      invoiceId: sale._id,
      shopName,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      createdAt: sale.createdAt,
      soldBy: sale.soldBy?.name || "Store Staff",
      paymentStatus: sale.paymentStatus || "PAID",
      paymentMethod: sale.paymentMethod || "Cash",
      items: sale.items.map((i) => ({
        name: i.name,
        qty: i.qty,
        weight: i.weight,
        pricePerGram: i.pricePerGram,
        makingCharge: i.makingCharge,
        hallmarkCharge: i.hallmarkCharge || 0,
        jadatarCharge: i.jadatarCharge || 0,
        rhodiumCharge: i.rhodiumCharge || 0,
        nangCharge: i.nangCharge || 0,
        lineTotal: i.lineTotal,
      })),
      discount: sale.discount,
      totalAmount: sale.totalAmount,
    };

    await generateInvoicePDF(pdfData);
  };

  const pStatus = sale.paymentStatus || "PAID";
  const pMethod = sale.paymentMethod || "Cash";
  const subtotal = sale.items.reduce((sum, item) => sum + item.lineTotal, 0);

  const getExtraCharges = (item: typeof sale.items[0]) => {
    return [
      item.hallmarkCharge ? `HM: ${formatCurrency(item.hallmarkCharge)}` : null,
      item.jadatarCharge ? `Jadatar: ${formatCurrency(item.jadatarCharge)}` : null,
      item.rhodiumCharge ? `Rodium: ${formatCurrency(item.rhodiumCharge)}` : null,
      item.nangCharge ? `Nang: ${formatCurrency(item.nangCharge)}` : null,
    ].filter(Boolean);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Official Sales Invoice & Receipt"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Printable Area Container */}
        <div id="printable-invoice" className="space-y-4 sm:space-y-6 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-amber-200 dark:border-slate-800 transition-colors duration-200">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Zeal Jewellers Logo"
                className="h-8 sm:h-10 w-auto object-contain"
              />
              <div>
                <h2 className="font-serif font-bold text-base sm:text-lg text-amber-800 dark:text-amber-400">
                  {shopName}
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Premium Fine Jewelry & Tax Invoice</p>
              </div>
            </div>
            <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
              {pStatus === "PAID" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> PAID
                </span>
              )}
              {pStatus === "PENDING" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  PENDING
                </span>
              )}
              {pStatus === "PARTIAL" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-800">
                  PARTIAL
                </span>
              )}
              <p className="text-[10px] sm:text-xs font-mono font-bold text-slate-800 dark:text-slate-200 sm:mt-2">
                INV #{sale._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block" suppressHydrationWarning>{formatDateTime(sale.createdAt)}</p>
            </div>
          </div>

          {/* Customer & Bill Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 p-3 sm:p-4 border border-amber-200/80 dark:border-slate-700 text-xs">
            <div>
              <span className="font-semibold text-amber-900 dark:text-amber-400 uppercase tracking-wider block mb-1">
                Billed To Customer
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{sale.customerName}</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">Phone: {sale.customerPhone}</p>
            </div>
            <div className="sm:text-right">
              <span className="font-semibold text-amber-900 dark:text-amber-400 uppercase tracking-wider block mb-1">
                Issued By Staff
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{sale.soldBy?.name || "Store Cashier"}</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">Mode: {pMethod} • Status: {pStatus}</p>
            </div>
          </div>

          {/* Line Items — Mobile Card Layout */}
          <div className="space-y-2 sm:hidden">
            {sale.items.map((item, idx) => {
              const extras = getExtraCharges(item);
              return (
                <div key={idx} className="rounded-lg border border-amber-200/60 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">{item.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Qty: {item.qty} • Wt: {item.weight}g • Rate: {formatCurrency(item.pricePerGram)}/g
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Making: {formatCurrency(item.makingCharge)}/g (Total: {formatCurrency(item.qty * item.weight * item.makingCharge)})
                      </p>
                      {extras.length > 0 && (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                          {extras.join(" | ")}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Line Items — Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Rate / g</TableHead>
                  <TableHead className="text-right">Making / g</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs font-mono text-slate-500 dark:text-slate-400">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      <div className="capitalize">{item.name}</div>
                      {getExtraCharges(item).length > 0 && (
                        <div className="text-[10px] text-amber-700 dark:text-amber-400 font-normal mt-0.5 whitespace-nowrap">
                          {getExtraCharges(item).join(" | ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">{item.qty}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{item.weight} g</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(item.pricePerGram)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <div>{formatCurrency(item.makingCharge)}/g</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal whitespace-nowrap">
                        Total: {formatCurrency((item.qty || 1) * (item.weight || 0) * (item.makingCharge || 0))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
              </div>
              {sale.items.reduce((sum, item) => sum + (item.qty * item.weight * item.makingCharge), 0) > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Making Charges (included):</span>
                  <span>{formatCurrency(sale.items.reduce((sum, item) => sum + (item.qty * item.weight * item.makingCharge), 0))}</span>
                </div>
              )}
              {sale.items.reduce((sum, item) => sum + (item.hallmarkCharge || 0) + (item.jadatarCharge || 0) + (item.rhodiumCharge || 0) + (item.nangCharge || 0), 0) > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                  <span>Extra Charges:</span>
                  <span className="font-medium">{formatCurrency(sale.items.reduce((sum, item) => sum + (item.hallmarkCharge || 0) + (item.jadatarCharge || 0) + (item.rhodiumCharge || 0) + (item.nangCharge || 0), 0))}</span>
                </div>
              )}
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Discount:</span>
                  <span className="font-semibold">- {formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-amber-200 dark:border-slate-700 pt-2 text-sm font-bold text-amber-800 dark:text-amber-400">
                <span>Grand Total:</span>
                <span className="text-base">{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 no-print">
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
          <Button onClick={handleDownloadPDF} className="font-bold w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
