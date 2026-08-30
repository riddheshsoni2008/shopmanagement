"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { generateInvoicePDF, InvoicePDFData } from "@/lib/pdf-generator";
import { Printer, Download, CheckCircle } from "lucide-react";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: {
    _id: string;
    customerName: string;
    customerPhone: string;
    items: Array<{
      productId?: string;
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

export function InvoiceModal({ isOpen, onClose, sale, shopName = "Zeal Jewellers" }: InvoiceModalProps) {
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

  const handleDownloadPDF = async () => {
    await generateInvoicePDF(pdfData);
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
        {/* Printable Receipt Container — Luxurious Golden & White Theme */}
        <div id="printable-invoice" className="space-y-6 rounded-2xl border border-amber-200/90 bg-white p-6 text-slate-900 shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-amber-100 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Zeal Jewellers Logo"
                className="h-12 w-auto object-contain"
              />
              <div>
                <h2 className="text-xl font-serif font-bold text-amber-700">
                  {shopName}
                </h2>
                <p className="text-xs text-amber-900/60 font-medium mt-0.5">Premium Fine Jewelry & Tax Invoice</p>
              </div>
            </div>
            <div className="text-right">
              {pStatus === "PAID" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle className="h-3.5 w-3.5" /> PAID RECEIPT
                </span>
              )}
              {pStatus === "PENDING" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                  PENDING PAYMENT
                </span>
              )}
              {pStatus === "PARTIAL" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 border border-orange-200">
                  PARTIAL PAYMENT
                </span>
              )}
              <p className="text-xs font-mono font-bold text-amber-900 mt-2">
                INV #{sale._id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-slate-500" suppressHydrationWarning>{formatDateTime(sale.createdAt)}</p>
            </div>
          </div>

          {/* Customer & Bill Details */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-amber-50/60 p-4 border border-amber-200/80 text-xs">
            <div>
              <span className="font-bold text-amber-800/80 uppercase tracking-wider block mb-1">
                Billed To Customer
              </span>
              <p className="text-sm font-bold text-slate-900">{sale.customerName}</p>
              <p className="text-slate-600 mt-0.5">Phone: {sale.customerPhone}</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-amber-800/80 uppercase tracking-wider block mb-1">
                Issued By Staff
              </span>
              <p className="text-sm font-bold text-slate-900">{sale.soldBy?.name || "Store Cashier"}</p>
              <p className="text-slate-600 mt-0.5">Mode: {pMethod} • Status: {pStatus}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-amber-200/80 overflow-hidden">
            <Table>
              <TableHeader className="bg-amber-100/70">
                <TableRow className="border-b border-amber-200/80">
                  <TableHead className="font-bold text-amber-950">#</TableHead>
                  <TableHead className="font-bold text-amber-950">Item Name</TableHead>
                  <TableHead className="text-center font-bold text-amber-950">Qty</TableHead>
                  <TableHead className="text-right font-bold text-amber-950">Weight</TableHead>
                  <TableHead className="text-right font-bold text-amber-950">Rate / g</TableHead>
                  <TableHead className="text-right font-bold text-amber-950">Making / g</TableHead>
                  <TableHead className="text-right font-bold text-amber-950">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-amber-100 hover:bg-amber-50/40">
                    <TableCell className="text-xs font-mono text-slate-500">{idx + 1}</TableCell>
                    <TableCell className="font-bold text-slate-900">
                      <div className="capitalize">{item.name}</div>
                      {((item.hallmarkCharge || 0) > 0 || (item.jadatarCharge || 0) > 0 || (item.rhodiumCharge || 0) > 0 || (item.nangCharge || 0) > 0) && (
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5 whitespace-nowrap">
                          {[
                            item.hallmarkCharge ? `HM: ${formatCurrency(item.hallmarkCharge)}` : null,
                            item.jadatarCharge ? `Jadatar: ${formatCurrency(item.jadatarCharge)}` : null,
                            item.rhodiumCharge ? `Rodium: ${formatCurrency(item.rhodiumCharge)}` : null,
                            item.nangCharge ? `Nang: ${formatCurrency(item.nangCharge)}` : null,
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-slate-800">{item.qty}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-800">{item.weight} g</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-800">{formatCurrency(item.pricePerGram)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-800">
                      <div>{formatCurrency(item.makingCharge)}/g</div>
                      <div className="text-[10px] text-slate-500 font-normal whitespace-nowrap">
                        Total: {formatCurrency((item.qty || 1) * (item.weight || 0) * (item.makingCharge || 0))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-800">{formatCurrency(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              {sale.items.reduce((sum, item) => sum + (item.qty * item.weight * item.makingCharge), 0) > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Making Charges (included):</span>
                  <span>{formatCurrency(sale.items.reduce((sum, item) => sum + (item.qty * item.weight * item.makingCharge), 0))}</span>
                </div>
              )}
              {sale.items.reduce((sum, item) => sum + (item.hallmarkCharge || 0) + (item.jadatarCharge || 0) + (item.rhodiumCharge || 0) + (item.nangCharge || 0), 0) > 0 && (
                <div className="flex justify-between text-amber-800 text-[11px]">
                  <span>Extra Charges (HM/Jad/Rod/Nang):</span>
                  <span className="font-medium">{formatCurrency(sale.items.reduce((sum, item) => sum + (item.hallmarkCharge || 0) + (item.jadatarCharge || 0) + (item.rhodiumCharge || 0) + (item.nangCharge || 0), 0))}</span>
                </div>
              )}
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount Applied:</span>
                  <span className="font-semibold">- {formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t-2 border-amber-300 bg-amber-50/90 p-2.5 rounded-xl text-amber-950 font-bold mt-2">
                <span>Grand Total Paid:</span>
                <span className="text-base text-amber-800">{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 no-print">
          <Button variant="outline" onClick={handlePrint} className="border-amber-200 hover:bg-amber-50">
            <Printer className="mr-2 h-4 w-4 text-amber-700" /> Print Invoice
          </Button>
          <Button onClick={handleDownloadPDF} className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
