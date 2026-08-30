import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface InvoicePDFData {
  invoiceId: string;
  shopName: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
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

function fmtINR(amount: number): string {
  return amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);
  let result = "Rupees " + convert(intPart);
  if (decPart > 0) {
    result += " and " + convert(decPart) + " Paise";
  }
  return result + " Only";
}

// Load the logo from /logo.png and convert to base64 for embedding in PDF
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch("/logo.png");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // ── Purple Theme Color Palette ──
  const purple = { dark: [45, 10, 72], mid: [88, 28, 135], light: [139, 92, 246], pale: [237, 233, 254] };
  const gold = [217, 170, 50];
  const white = [255, 255, 255];
  const textDark = [30, 15, 50];
  const textMid = [80, 60, 100];
  const textLight = [120, 100, 140];
  const lineColor = [180, 160, 200];

  // ── Load Logo ──
  const logoBase64 = await loadLogoBase64();

  // ══════════════════════════════════════════════════
  // HEADER BANNER — Purple gradient with logo
  // ══════════════════════════════════════════════════
  doc.setFillColor(purple.dark[0], purple.dark[1], purple.dark[2]);
  doc.rect(0, 0, pageWidth, 52, "F");

  // Subtle lighter strip at bottom of header
  doc.setFillColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.rect(0, 46, pageWidth, 6, "F");

  // Logo in header
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", margin, 3, 40, 40);
    } catch {
      // If logo fails, show text fallback
    }
  }

  // Shop Name — Large, centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(white[0], white[1], white[2]);
  doc.text(data.shopName.toUpperCase(), pageWidth / 2, 18, { align: "center" });

  // Address line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 180, 220);
  doc.text("LIMDA CHOWK, BOTAD, GUJARAT", pageWidth / 2, 26, { align: "center" });

  // GSTIN
  doc.setFontSize(8);
  doc.setTextColor(180, 160, 200);
  doc.text("GSTIN: 24BPLPR1615B1Z8", pageWidth / 2, 33, { align: "center" });

  // TAX INVOICE badge
  doc.setFillColor(gold[0], gold[1], gold[2]);
  doc.roundedRect(pageWidth / 2 - 25, 36, 50, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.dark[0], purple.dark[1], purple.dark[2]);
  doc.text("TAX INVOICE", pageWidth / 2, 41.5, { align: "center" });

  // ══════════════════════════════════════════════════
  // INVOICE DETAILS ROW
  // ══════════════════════════════════════════════════
  let y = 58;

  // Light purple info strip
  doc.setFillColor(purple.pale[0], purple.pale[1], purple.pale[2]);
  doc.roundedRect(margin, y - 2, contentWidth, 18, 2, 2, "F");
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.roundedRect(margin, y - 2, contentWidth, 18, 2, 2, "D");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);

  doc.text("Invoice No:", margin + 4, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`ZJ/${data.invoiceId.slice(-6).toUpperCase()}`, margin + 28, y + 4);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text("Date:", pageWidth / 2 - 10, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formatDate(data.createdAt), pageWidth / 2 + 4, y + 4);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text("Place of Supply:", pageWidth - margin - 60, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Gujarat (24)", pageWidth - margin - 24, y + 4);

  // Second row inside strip
  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text("Payment:", margin + 4, y + 11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const payStatus = (data.paymentStatus || "PAID").toUpperCase();
  const payMethod = data.paymentMethod || "Cash";
  doc.text(`${payStatus} (${payMethod})`, margin + 26, y + 11);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text("Billed By:", pageWidth / 2 - 10, y + 11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.soldBy, pageWidth / 2 + 10, y + 11);

  // ══════════════════════════════════════════════════
  // PARTY / CUSTOMER DETAILS
  // ══════════════════════════════════════════════════
  y = 82;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text("PARTY DETAILS:", margin, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.customerName.toUpperCase(), margin, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textMid[0], textMid[1], textMid[2]);
  doc.text(`Phone: ${data.customerPhone}`, margin, y);

  if (data.customerAddress) {
    y += 4.5;
    doc.text(data.customerAddress, margin, y);
  }

  // Separator line
  y += 6;
  doc.setDrawColor(purple.light[0], purple.light[1], purple.light[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // ══════════════════════════════════════════════════
  // ITEMS TABLE
  // ══════════════════════════════════════════════════
  y += 3;

  const tableRows = data.items.map((item, index) => [
    (index + 1).toString(),
    item.name,
    "7113",
    item.weight.toFixed(2),
    `${item.qty}`,
    "GMS",
    fmtINR(item.pricePerGram),
    fmtINR(item.makingCharge),
    fmtINR(item.lineTotal),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["S.N", "Description of Goods", "HSN", "Weight (g)", "Qty", "Unit", "Rate/g (₹)", "Making (₹)", "Amount (₹)"]],
    body: tableRows,
    headStyles: {
      fillColor: [purple.mid[0], purple.mid[1], purple.mid[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [textDark[0], textDark[1], textDark[2]],
      cellPadding: 2.5,
      lineColor: [220, 210, 230],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 245, 255],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 42 },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 18, halign: "right" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 24, halign: "right" },
      7: { cellWidth: 22, halign: "right" },
      8: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin, right: margin },
    tableLineColor: [purple.light[0], purple.light[1], purple.light[2]],
    tableLineWidth: 0.2,
    styles: {
      overflow: "linebreak",
    },
  });

  // ══════════════════════════════════════════════════
  // TOTALS / SUMMARY SECTION
  // ══════════════════════════════════════════════════
  let finalY = (doc as any).lastAutoTable.finalY + 4;

  let subtotal = 0;
  data.items.forEach((item) => (subtotal += item.lineTotal));

  const totalMaking = data.items.reduce((sum, item) => sum + item.makingCharge, 0);
  const taxableAmount = subtotal;
  const cgstRate = 1.5;
  const sgstRate = 1.5;
  const cgstAmount = (taxableAmount * cgstRate) / 100;
  const sgstAmount = (taxableAmount * sgstRate) / 100;

  const rightCol = pageWidth - margin;
  const labelX = rightCol - 80;

  // Summary box
  doc.setDrawColor(purple.light[0], purple.light[1], purple.light[2]);
  doc.setLineWidth(0.3);

  const summaryItems: { label: string; value: string; bold?: boolean; isDiscount?: boolean; color?: number[] }[] = [
    { label: "Subtotal:", value: `₹ ${fmtINR(subtotal)}` },
    { label: `Making Charges (included):`, value: `₹ ${fmtINR(totalMaking)}` },
  ];

  if (data.discount > 0) {
    summaryItems.push({ label: "Less: Discount:", value: `- ₹ ${fmtINR(data.discount)}`, isDiscount: true, color: [180, 30, 30] });
  }

  summaryItems.push(
    { label: `Add: CGST @ ${cgstRate}%:`, value: `₹ ${fmtINR(cgstAmount)}` },
    { label: `Add: SGST @ ${sgstRate}%:`, value: `₹ ${fmtINR(sgstAmount)}` },
  );

  // Draw summary lines
  summaryItems.forEach((item, idx) => {
    const rowY = finalY + idx * 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", item.bold ? "bold" : "normal");
    doc.setTextColor(...(item.color || [textMid[0], textMid[1], textMid[2]]) as [number, number, number]);
    doc.text(item.label, labelX, rowY);
    doc.text(item.value, rightCol, rowY, { align: "right" });
  });

  // Grand Total Bar
  const grandTotalY = finalY + summaryItems.length * 6 + 3;
  doc.setFillColor(purple.dark[0], purple.dark[1], purple.dark[2]);
  doc.roundedRect(labelX - 4, grandTotalY - 5, rightCol - labelX + 4 + margin, 12, 2, 2, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text("GRAND TOTAL:", labelX, grandTotalY + 2);
  doc.setFontSize(11);
  doc.text(`₹ ${fmtINR(data.totalAmount)}`, rightCol + margin, grandTotalY + 2, { align: "right" });

  // ══════════════════════════════════════════════════
  // AMOUNT IN WORDS
  // ══════════════════════════════════════════════════
  const wordsY = grandTotalY + 14;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text("Amount in Words:", margin, wordsY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const amtWords = numberToWords(data.totalAmount);
  doc.text(amtWords, margin, wordsY + 5, { maxWidth: contentWidth });

  // ══════════════════════════════════════════════════
  // TAX BREAKDOWN TABLE
  // ══════════════════════════════════════════════════
  const taxY = wordsY + 14;

  autoTable(doc, {
    startY: taxY,
    head: [["Tax Rate", "Taxable Amt (₹)", "CGST (₹)", "SGST (₹)", "Total Tax (₹)"]],
    body: [
      [
        "3%",
        fmtINR(taxableAmount),
        fmtINR(cgstAmount),
        fmtINR(sgstAmount),
        fmtINR(cgstAmount + sgstAmount),
      ],
    ],
    headStyles: {
      fillColor: [purple.pale[0], purple.pale[1], purple.pale[2]],
      textColor: [purple.mid[0], purple.mid[1], purple.mid[2]],
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [textDark[0], textDark[1], textDark[2]],
      halign: "right",
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 20 },
    },
    margin: { left: margin, right: pageWidth / 2 },
    tableWidth: contentWidth / 2 + 10,
    tableLineColor: [lineColor[0], lineColor[1], lineColor[2]],
    tableLineWidth: 0.15,
  });

  // ══════════════════════════════════════════════════
  // FOOTER — Terms, Signatures
  // ══════════════════════════════════════════════════
  const footerY = 258;

  // Separator line
  doc.setDrawColor(purple.light[0], purple.light[1], purple.light[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Terms
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text("Terms & Conditions:", margin, footerY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.text("1. Goods once sold will not be taken back.", margin, footerY + 10);
  doc.text("2. Interest @ 18% p.a. will be charged if payment is not made within stipulated time.", margin, footerY + 14);
  doc.text("3. Subject to 'Gujarat' Jurisdiction only.", margin, footerY + 18);
  doc.text("E. & O.E.", margin, footerY + 22);

  // Receiver's Signature (left-center)
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textMid[0], textMid[1], textMid[2]);
  doc.text("Receiver's Signature: ___________________", pageWidth / 2 - 30, footerY + 22);

  // Authorised Signatory (right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(purple.mid[0], purple.mid[1], purple.mid[2]);
  doc.text(`for ${data.shopName.toUpperCase()}`, pageWidth - margin, footerY + 10, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textMid[0], textMid[1], textMid[2]);
  doc.text("Authorised Signatory", pageWidth - margin, footerY + 22, { align: "right" });

  // ══════════════════════════════════════════════════
  // BOTTOM STRIP
  // ══════════════════════════════════════════════════
  doc.setFillColor(purple.dark[0], purple.dark[1], purple.dark[2]);
  doc.rect(0, 288, pageWidth, 9, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(200, 180, 220);
  doc.text(`Thank you for choosing ${data.shopName}! Your trust is our treasure.`, pageWidth / 2, 293, { align: "center" });

  // ══════════════════════════════════════════════════
  // SAVE / DOWNLOAD PDF
  // ══════════════════════════════════════════════════
  doc.save(`Invoice_${data.customerName.replace(/\s+/g, "_")}_${data.invoiceId.slice(-6)}.pdf`);
}
