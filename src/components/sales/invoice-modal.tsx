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
    customerAddress?: string;
    items: Array<{
      name: string;
      qty: number;
      weight: number;
      productWeight?: number;
      productWeightUnit?: "g" | "mg";
      jadatarWeight?: number;
      jadatarWeightUnit?: "g" | "mg";
      nangWeight?: number;
      nangWeightUnit?: "g" | "mg";
      meenoWeight?: number;
      meenoWeightUnit?: "g" | "mg";
      netWeight?: number;
      pricePerGram: number;
      makingCharge: number;
      hallmarkCharge?: number;
      jadatarCharge?: number;
      rhodiumCharge?: number;
      nangCharge?: number;
      meenoCharge?: number;
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
      customerAddress: sale.customerAddress || "",
      createdAt: sale.createdAt,
      soldBy: sale.soldBy?.name || "Store Staff",
      paymentStatus: sale.paymentStatus || "PAID",
      paymentMethod: sale.paymentMethod || "Cash",
      items: sale.items.map((i) => ({
        name: i.name,
        qty: i.qty,
        weight: i.weight,
        productWeight: i.productWeight ?? i.weight ?? 0,
        productWeightUnit: i.productWeightUnit || "g",
        jadatarWeight: i.jadatarWeight ?? 0,
        jadatarWeightUnit: i.jadatarWeightUnit || "g",
        nangWeight: i.nangWeight ?? 0,
        nangWeightUnit: i.nangWeightUnit || "g",
        meenoWeight: i.meenoWeight ?? 0,
        meenoWeightUnit: i.meenoWeightUnit || "g",
        netWeight: i.netWeight ?? i.weight ?? 0,
        pricePerGram: i.pricePerGram,
        makingCharge: i.makingCharge,
        hallmarkCharge: i.hallmarkCharge || 0,
        jadatarCharge: i.jadatarCharge || 0,
        rhodiumCharge: i.rhodiumCharge || 0,
        nangCharge: i.nangCharge || 0,
        meenoCharge: i.meenoCharge || 0,
        lineTotal: i.lineTotal,
      })),
      discount: sale.discount,
      totalAmount: sale.totalAmount,
    };

    await generateInvoicePDF(pdfData);
  };

  const pStatus = sale.paymentStatus || "PAID";
  const pMethod = sale.paymentMethod || "Cash";
  
  const getWeightBreakdown = (item: typeof sale.items[0]) => {
    const rawP = item.productWeight ?? item.weight ?? 0;
    const pUnit = item.productWeightUnit || "g";
    const pWt = pUnit === "mg" ? rawP / 1000 : rawP;

    const rawJ = item.jadatarWeight ?? 0;
    const jUnit = item.jadatarWeightUnit || "g";
    const jWt = jUnit === "mg" ? rawJ / 1000 : rawJ;

    const rawN = item.nangWeight ?? 0;
    const nUnit = item.nangWeightUnit || "g";
    const nWt = nUnit === "mg" ? rawN / 1000 : rawN;

    const rawM = item.meenoWeight ?? 0;
    const mUnit = item.meenoWeightUnit || "g";
    const mWt = mUnit === "mg" ? rawM / 1000 : rawM;

    const netWt = item.netWeight ?? item.weight ?? Math.max(0, pWt - jWt - nWt - mWt);
    const hasDeduction = jWt > 0 || nWt > 0 || mWt > 0;

    const formatWt = (rawVal: number, unit?: string) => {
      if (unit === "mg") {
        return `${rawVal} mg (${(rawVal / 1000).toFixed(3)}g)`;
      }
      return `${rawVal.toFixed(3)}g`;
    };

    const deductionsList = [
      rawJ > 0 ? `Jadatar: ${formatWt(rawJ, jUnit)}` : null,
      rawN > 0 ? `Stone: ${formatWt(rawN, nUnit)}` : null,
      rawM > 0 ? `Meeno: ${formatWt(rawM, mUnit)}` : null,
    ].filter(Boolean);

    return { pWt, jWt, nWt, mWt, netWt, hasDeduction, deductionsList };
  };

  let totalMetalPrice = 0;
  let totalMakingCharges = 0;
  let totalHallmarkCharges = 0;
  let totalJadatarCharges = 0;
  let totalRhodiumCharges = 0;
  let totalNangCharges = 0;
  let totalMeenoCharges = 0;
  let subtotal = 0;

  sale.items.forEach((item) => {
    const { netWt } = getWeightBreakdown(item);
    const metalCost = item.qty * netWt * item.pricePerGram;
    const makingCost = item.qty * netWt * item.makingCharge;

    totalMetalPrice += metalCost;
    totalMakingCharges += makingCost;
    totalHallmarkCharges += item.hallmarkCharge || 0;
    totalJadatarCharges += item.jadatarCharge || 0;
    totalRhodiumCharges += item.rhodiumCharge || 0;
    totalNangCharges += item.nangCharge || 0;
    totalMeenoCharges += item.meenoCharge || 0;
    subtotal += item.lineTotal;
  });

  const getExtraCharges = (item: typeof sale.items[0]) => {
    return [
      item.hallmarkCharge ? `HM: ${formatCurrency(item.hallmarkCharge)}` : null,
      item.jadatarCharge ? `Jadatar: ${formatCurrency(item.jadatarCharge)}` : null,
      item.rhodiumCharge ? `Rodium: ${formatCurrency(item.rhodiumCharge)}` : null,
      item.nangCharge ? `Nang: ${formatCurrency(item.nangCharge)}` : null,
      item.meenoCharge ? `Meeno: ${formatCurrency(item.meenoCharge)}` : null,
    ].filter(Boolean);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Zeal Jewellers Invoice"
      description="Official Tax Invoice & Calculation Breakdown"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Printable Area */}
        <div id="printable-invoice" className="space-y-4 p-2 sm:p-4 bg-white dark:bg-slate-900 rounded-lg">
          {/* Header section with logo & invoice status */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-200/80 dark:border-slate-800 pb-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-serif text-lg sm:text-xl font-bold shadow-md shrink-0">
                ZJ
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-serif tracking-tight">{shopName}</h2>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Certified Fine Gold & Diamond Jewellery</p>
                <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-mono font-medium">Station Road, Botad - 364710 • Contact: +91 98765 43210</p>
              </div>
            </div>
            <div className="text-left sm:text-right shrink-0">
              {pStatus === "PAID" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  PAID IN FULL
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
              {sale.customerAddress && (
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">Address: {sale.customerAddress}</p>
              )}
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
              const { pWt, netWt, hasDeduction, deductionsList } = getWeightBreakdown(item);
              return (
                <div key={idx} className="rounded-lg border border-amber-200/60 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">{item.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Qty: {item.qty} • Net Wt: {netWt.toFixed(3)}g {hasDeduction && `(Gross: ${pWt.toFixed(3)}g)`} • Rate: {formatCurrency(item.pricePerGram)}/g
                      </p>
                      {hasDeduction && (
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Less Deductions: {deductionsList.join(" | ")}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Making: {formatCurrency(item.makingCharge)}/g (Total: {formatCurrency(item.qty * netWt * item.makingCharge)})
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
                {sale.items.map((item, idx) => {
                  const { pWt, netWt, hasDeduction, deductionsList } = getWeightBreakdown(item);
                  const extras = getExtraCharges(item);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-xs font-mono text-slate-500 dark:text-slate-400">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        <div className="capitalize">{item.name}</div>
                        {hasDeduction && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal mt-0.5 whitespace-nowrap">
                            Less: {deductionsList.join(", ")}
                          </div>
                        )}
                        {extras.length > 0 && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-normal mt-0.5 whitespace-nowrap">
                            {extras.join(" | ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">{item.qty}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{netWt.toFixed(3)} g</div>
                        {hasDeduction && (
                          <div className="text-[10px] text-slate-400 font-normal whitespace-nowrap">
                            Gross: {pWt.toFixed(3)} g
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(item.pricePerGram)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <div>{formatCurrency(item.makingCharge)}/g</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal whitespace-nowrap">
                          Total: {formatCurrency((item.qty || 1) * netWt * (item.makingCharge || 0))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.lineTotal)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              {/* 1. Metal Price Only */}
              <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Gold / Metal Base Price:</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-slate-100">{formatCurrency(totalMetalPrice)}</span>
              </div>

              {/* 2. Making Charges */}
              {totalMakingCharges > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                  <span>(+) Making Charges:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(totalMakingCharges)}</span>
                </div>
              )}

              {/* Itemized Extra Charges */}
              {totalHallmarkCharges > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                  <span>(+) Hallmark Charge (HM):</span>
                  <span className="font-medium font-mono">{formatCurrency(totalHallmarkCharges)}</span>
                </div>
              )}

              {totalJadatarCharges > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                  <span>(+) Jadatar Charge:</span>
                  <span className="font-medium font-mono">{formatCurrency(totalJadatarCharges)}</span>
                </div>
              )}

              {totalRhodiumCharges > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                  <span>(+) Rhodium Charge:</span>
                  <span className="font-medium font-mono">{formatCurrency(totalRhodiumCharges)}</span>
                </div>
              )}

              {totalNangCharges > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                  <span>(+) Stone / Nang Charge:</span>
                  <span className="font-medium font-mono">{formatCurrency(totalNangCharges)}</span>
                </div>
              )}

              {totalMeenoCharges > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 text-[11px]">
                  <span>(+) Meeno Charge:</span>
                  <span className="font-medium font-mono">{formatCurrency(totalMeenoCharges)}</span>
                </div>
              )}

              {/* 4. Subtotal */}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                <span>Items Subtotal:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{formatCurrency(subtotal)}</span>
              </div>

              {/* 5. Discount */}
              {sale.discount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>(-) Discount:</span>
                  <span className="font-semibold font-mono">- {formatCurrency(sale.discount)}</span>
                </div>
              )}

              {/* 6. Grand Total */}
              <div className="flex justify-between border-t border-amber-200 dark:border-slate-700 pt-2 text-sm font-bold text-amber-800 dark:text-amber-400">
                <span>Grand Total:</span>
                <span className="text-base font-mono">{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Footer */}
          <div className="border-t border-amber-200/80 dark:border-slate-800 pt-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider text-[10px]">Terms & Conditions</p>
            <p>E. & O.E.</p>
            <ol className="list-decimal list-inside space-y-0.5 font-medium">
              <li>No guarantee or warranty on breakage of jewelry items.</li>
              <li>Goods once sold will not be returned or taken back.</li>
              <li>Subject to &apos;Botad&apos; Jurisdiction only.</li>
            </ol>
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
