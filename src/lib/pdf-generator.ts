import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface InvoicePDFData {
  invoiceId: string;
  shopName: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  soldBy: string;
  paymentStatus?: string;
  paymentMethod?: string;
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
}

function formatPDFCurrency(amount: number): string {
  return "Rs. " + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF();

  // Color Palette
  const goldColor = [217, 119, 6]; // #d97706
  const darkSlate = [15, 23, 42]; // #0f172a
  const lightBg = [250, 250, 249]; // #fafaf9

  // Header Banner
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.rect(0, 0, 210, 38, "F");

  // Shop Name & Title
  doc.setTextColor(245, 158, 11); // Amber/Gold
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.shopName.toUpperCase(), 14, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(226, 232, 240);
  doc.text("OFFICIAL TAX INVOICE / RECEIPT", 14, 28);

  // Invoice Number & Date (Right aligned header)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`INVOICE #${data.invoiceId.slice(-8).toUpperCase()}`, 196, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${formatDate(data.createdAt)}`, 196, 26, { align: "right" });

  // Customer Info Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 44, 182, 28, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 44, 182, 28, 3, 3, "D");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text("CUSTOMER DETAILS:", 18, 52);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${data.customerName}`, 18, 60);
  doc.text(`Phone: ${data.customerPhone}`, 18, 66);

  doc.setFont("helvetica", "bold");
  doc.text("SALES DETAILS:", 110, 52);
  doc.setFont("helvetica", "normal");
  doc.text(`Billed By: ${data.soldBy}`, 110, 60);
  doc.text(`Payment Status: ${(data.paymentStatus || "PAID").toUpperCase()}`, 110, 66);
  if (data.paymentMethod) {
    doc.text(`Payment Mode: ${data.paymentMethod}`, 150, 66);
  }

  // Line Items Table
  const tableRows = data.items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    `${item.qty} pc(s)`,
    `${item.weight.toFixed(2)} g`,
    formatPDFCurrency(item.pricePerGram),
    formatPDFCurrency(item.makingCharge),
    formatPDFCurrency(item.lineTotal),
  ]);

  autoTable(doc, {
    startY: 78,
    head: [["#", "Item Description", "Qty", "Weight", "Rate / g", "Making", "Line Total"]],
    body: tableRows,
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 26, halign: "right" },
      6: { cellWidth: 32, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // Totals Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  let subtotal = 0;
  data.items.forEach((item) => (subtotal += item.lineTotal));

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal:", 135, finalY);
  doc.text(formatPDFCurrency(subtotal), 196, finalY, { align: "right" });

  if (data.discount > 0) {
    doc.text("Special Discount:", 135, finalY + 6);
    doc.setTextColor(220, 38, 38);
    doc.text(`- ${formatPDFCurrency(data.discount)}`, 196, finalY + 6, { align: "right" });
  }

  const grandTotalY = data.discount > 0 ? finalY + 14 : finalY + 8;
  doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.roundedRect(120, grandTotalY - 4, 76, 12, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(245, 158, 11);
  doc.text("TOTAL AMOUNT:", 124, grandTotalY + 3);
  doc.text(formatPDFCurrency(data.totalAmount), 192, grandTotalY + 3, { align: "right" });

  // Footer / Terms
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text(`Thank you for choosing ${data.shopName}! All sales are subject to terms & purity verification.`, 105, 280, { align: "center" });

  // Save / Download PDF
  doc.save(`Invoice_${data.customerName.replace(/\s+/g, "_")}_${data.invoiceId.slice(-6)}.pdf`);
}
