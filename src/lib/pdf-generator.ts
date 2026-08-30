import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/utils";

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

// ── Indian Rupee formatting ──
function fmtINR(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Amount in Words (Indian system) ──
function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
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
  let result = convert(intPart);
  if (decPart > 0) {
    result += " and " + convert(decPart) + " Paise";
  }
  return result + " Only";
}

// ── Load logo as base64 ──
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

// ══════════════════════════════════════════════════════════════════
// MAIN PDF GENERATOR — Traditional Indian GST Tax Invoice Format
// Matching NILESHBHAI.pdf structure with gold/amber logo theme
// ══════════════════════════════════════════════════════════════════
export async function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210; // A4 width
  const L = 12; // left margin
  const R = pw - 12; // right boundary
  const W = R - L; // usable width

  // ── Logo Theme Colors ──
  const GOLD: [number, number, number] = [178, 134, 46]; // rich gold from logo
  const GOLD_LIGHT: [number, number, number] = [218, 185, 107]; // light gold
  const GOLD_DARK: [number, number, number] = [130, 95, 20]; // dark gold
  const BLACK: [number, number, number] = [0, 0, 0];
  const DARK: [number, number, number] = [30, 25, 15];
  const MID: [number, number, number] = [80, 70, 50];
  const LIGHT_BG: [number, number, number] = [255, 250, 240]; // warm cream
  const WHITE: [number, number, number] = [255, 255, 255];

  // Border color for all lines
  const BORDER: [number, number, number] = [160, 140, 100];

  // ── Load Logo ──
  const logoBase64 = await loadLogoBase64();

  let y = 8; // top of outer border

  // ══════════════════════════════════════════
  // ROW 1: GSTIN line + "Original Copy"
  // ══════════════════════════════════════════
  y += 1;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text("GSTIN : 24BPLPR1615B1Z8", L + 3, y + 5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Original Copy", R - 3, y + 5, { align: "right" });

  // Horizontal line
  y += 8;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // ══════════════════════════════════════════
  // ROW 2: TAX INVOICE centered label
  // ══════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text("TAX INVOICE", pw / 2, y + 5, { align: "center" });
  // Underline
  const tiW = doc.getTextWidth("TAX INVOICE");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(pw / 2 - tiW / 2, y + 6.5, pw / 2 + tiW / 2, y + 6.5);

  y += 9;

  // ══════════════════════════════════════════
  // ROW 3: LOGO + SHOP NAME + ADDRESS
  // ══════════════════════════════════════════

  // Gold accent bar behind shop name area
  doc.setFillColor(255, 252, 240);
  doc.rect(L, y, W, 22, "F");

  // Logo (left-center)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", L + 3, y + 1, 28, 20);
    } catch {
      // fallback — no logo
    }
  }

  // Shop Name — large, centered, gold color
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GOLD_DARK);
  doc.text(data.shopName.toUpperCase(), pw / 2, y + 10, { align: "center" });

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MID);
  doc.text("LIMDA CHOWK, BOTAD", pw / 2, y + 16, { align: "center" });

  y += 22;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // ══════════════════════════════════════════
  // ROW 4: PARTY DETAILS (left) + INVOICE INFO (right)
  // ══════════════════════════════════════════
  const partyTop = y;
  const midX = L + W * 0.55; // vertical divider position

  // Vertical divider
  doc.setDrawColor(...BORDER);
  doc.line(midX, y, midX, y + 32);

  // LEFT SIDE — Party Details
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Party Details :", L + 3, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(data.customerName.toUpperCase(), L + 3, y + 11);

  doc.setFontSize(8);
  doc.setTextColor(...MID);
  doc.text(`Ph: ${data.customerPhone}`, L + 3, y + 16);

  if (data.customerAddress) {
    doc.text(data.customerAddress, L + 3, y + 21);
  }

  doc.setFontSize(8);
  doc.text("GSTIN / UIN : ", L + 3, y + 27);

  // RIGHT SIDE — Invoice Info
  const rLabelX = midX + 3;
  const rColon = midX + 38;
  const rValX = midX + 42;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);

  doc.text("Invoice No.", rLabelX, y + 5);
  doc.text(":", rColon, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text(`ZJ/${data.invoiceId.slice(-6).toUpperCase()}`, rValX, y + 5);

  doc.setFont("helvetica", "normal");
  doc.text("Dated", rLabelX, y + 11);
  doc.text(":", rColon, y + 11);
  doc.text(formatDate(data.createdAt), rValX, y + 11);

  doc.text("Place of Supply", rLabelX, y + 17);
  doc.text(":", rColon, y + 17);
  doc.text("Gujarat (24)", rValX, y + 17);

  doc.text("Reverse Charge", rLabelX, y + 23);
  doc.text(":", rColon, y + 23);
  doc.text("N", rValX, y + 23);

  doc.text("Payment", rLabelX, y + 29);
  doc.text(":", rColon, y + 29);
  const payText = `${(data.paymentStatus || "PAID").toUpperCase()} / ${data.paymentMethod || "Cash"}`;
  doc.text(payText, rValX, y + 29);

  y += 32;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // ══════════════════════════════════════════
  // ROW 5: ITEMS TABLE
  // ══════════════════════════════════════════
  const tableStartY = y + 1;

  const tableRows = data.items.map((item, i) => [
    `${i + 1}`,
    item.name.toUpperCase(),
    "7113",
    item.weight.toFixed(4),
    "GMS",
    fmtINR(item.pricePerGram),
    fmtINR(item.lineTotal),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["S.N.", "Description of Goods", "HSN\nCode", "Qty.", "Unit", "Price", "Amount (₹)"]],
    body: tableRows,
    headStyles: {
      fillColor: [GOLD_LIGHT[0], GOLD_LIGHT[1], GOLD_LIGHT[2]],
      textColor: [DARK[0], DARK[1], DARK[2]],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
      lineColor: [BORDER[0], BORDER[1], BORDER[2]],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [BLACK[0], BLACK[1], BLACK[2]],
      cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
      lineColor: [BORDER[0], BORDER[1], BORDER[2]],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 58 },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 16, halign: "center", fontSize: 7 },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 34, halign: "right" },
    },
    margin: { left: L, right: pw - R },
    tableLineColor: [BORDER[0], BORDER[1], BORDER[2]],
    tableLineWidth: 0.3,
    // Ensure minimum height for items area
    didParseCell: (data: any) => {
      if (data.section === "body") {
        data.cell.styles.minCellHeight = 8;
      }
    },
  });

  // ══════════════════════════════════════════
  // TOTALS / ADDITIONS / DEDUCTIONS
  // ══════════════════════════════════════════
  let tY = (doc as any).lastAutoTable.finalY;

  // Draw horizontal line after table
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  let subtotal = 0;
  data.items.forEach((item) => (subtotal += item.lineTotal));
  let totalWeight = 0;
  data.items.forEach((item) => (totalWeight += item.weight));
  const totalMaking = data.items.reduce((sum, item) => sum + item.makingCharge, 0);

  const taxableAmount = subtotal;
  const cgstRate = 1.5;
  const sgstRate = 1.5;
  const cgstAmount = Math.round((taxableAmount * cgstRate) / 100 * 100) / 100;
  const sgstAmount = Math.round((taxableAmount * sgstRate) / 100 * 100) / 100;

  // Layout: labels on left, amounts on right (inside border)
  const amtX = R - 3; // right-aligned amount column
  const totalLabelX = L + W * 0.45;

  // Subtotal line
  tY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("Subtotal", totalLabelX, tY, { align: "right" });
  doc.text(fmtINR(subtotal), amtX, tY, { align: "right" });

  // Thin line
  tY += 1.5;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(totalLabelX + 5, tY, R, tY);

  // Making charges info line
  tY += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...MID);
  doc.text("Add  :  Making Charges (included above)", totalLabelX - 35, tY);
  doc.text(fmtINR(totalMaking), amtX, tY, { align: "right" });

  // Discount line
  if (data.discount > 0) {
    tY += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(160, 30, 30);
    doc.text("Less :  Discount", totalLabelX - 35, tY);
    doc.text(fmtINR(data.discount), amtX, tY, { align: "right" });
  }

  // CGST
  tY += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...MID);
  doc.text(`Add  :  CGST @ ${cgstRate}%`, totalLabelX - 35, tY);
  doc.text(fmtINR(cgstAmount), amtX, tY, { align: "right" });

  // SGST
  tY += 5;
  doc.text(`Add  :  SGST @ ${sgstRate}%`, totalLabelX - 35, tY);
  doc.text(fmtINR(sgstAmount), amtX, tY, { align: "right" });

  // Grand Total horizontal line
  tY += 3;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ── GRAND TOTAL ROW ──
  tY += 1;
  doc.setFillColor(GOLD_LIGHT[0], GOLD_LIGHT[1], GOLD_LIGHT[2]);
  doc.rect(L, tY, W, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Grand Total", pw / 2 - 5, tY + 6, { align: "center" });

  // Total weight
  doc.setFontSize(8);
  doc.setTextColor(...MID);
  doc.text(`${totalWeight.toFixed(4)} GMS`, pw / 2 + 25, tY + 6);

  // Grand total amount
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  doc.text(`Rs. ${fmtINR(data.totalAmount)}`, amtX, tY + 6, { align: "right" });

  tY += 9;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ══════════════════════════════════════════
  // TAX BREAKDOWN TABLE
  // ══════════════════════════════════════════
  tY += 1;
  const taxTableY = tY;

  // Tax table headers
  const taxCols = [
    { label: "Tax Rate", x: L + 3, w: 18 },
    { label: "Taxable Amt.", x: L + 24, w: 28 },
    { label: "CGST Amt.", x: L + 55, w: 24 },
    { label: "SGST Amt.", x: L + 82, w: 24 },
    { label: "Total Tax", x: L + 109, w: 24 },
  ];

  // Header row
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  taxCols.forEach((col) => {
    doc.text(col.label, col.x, tY + 3.5);
  });

  // Thin line under header
  tY += 5;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(L + 1, tY, L + 135, tY);

  // Tax data row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  doc.text("3%", taxCols[0].x, tY + 4);
  doc.text(fmtINR(taxableAmount), taxCols[1].x, tY + 4);
  doc.text(fmtINR(cgstAmount), taxCols[2].x, tY + 4);
  doc.text(fmtINR(sgstAmount), taxCols[3].x, tY + 4);
  doc.text(fmtINR(cgstAmount + sgstAmount), taxCols[4].x, tY + 4);

  tY += 7;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ══════════════════════════════════════════
  // AMOUNT IN WORDS
  // ══════════════════════════════════════════
  tY += 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Rupees", L + 3, tY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  const words = numberToWords(data.totalAmount);
  doc.text(words, L + 22, tY + 5, { maxWidth: W - 28 });

  tY += 10;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ══════════════════════════════════════════
  // FOOTER: Terms + Signatures (Dynamic Height)
  // ══════════════════════════════════════════
  const footerDivider = pw / 2 + 10;
  const footerStartY = tY;
  const footerHeight = 35; // compact footer height
  const footerEndY = footerStartY + footerHeight;

  // Vertical line dividing terms and signature section
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(footerDivider, footerStartY, footerDivider, footerEndY);

  // LEFT: Terms & Conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Terms & Conditions", L + 3, footerStartY + 5);

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(L + 3, footerStartY + 6, L + 40, footerStartY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text("E. & O.E.", L + 3, footerStartY + 11);
  doc.text("1. Goods once sold will not be taken back.", L + 3, footerStartY + 15);
  doc.text("2. Interest @ 18% p.a. will be charged if the payment", L + 3, footerStartY + 19);
  doc.text("   is not made within the stipulated time.", L + 3, footerStartY + 23);
  doc.text("3. Subject to 'Gujarat' Jurisdiction only.", L + 3, footerStartY + 27);

  // RIGHT: Signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_DARK);
  doc.text(`for ${data.shopName.toUpperCase()}`, R - 3, footerStartY + 5, { align: "right" });

  // Receiver's Signature
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text("Receiver's Signature :", footerDivider + 3, footerStartY + 16);

  // Authorised Signatory (bottom right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("Authorised Signatory", R - 3, footerStartY + 29, { align: "right" });

  // ══════════════════════════════════════════
  // DYNAMIC OUTER BORDER & BOTTOM ACCENTS
  // ══════════════════════════════════════════
  const topY = 8;
  const totalBorderHeight = footerEndY - topY;

  // Outer border around content
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.rect(L, topY, W, totalBorderHeight);

  // Gold accent bar right below outer border
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(L, footerEndY, W, 1.5, "F");

  // Thank you line centered below gold bar
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...MID);
  doc.text(
    `Thank you for choosing ${data.shopName}! Your trust is our treasure.`,
    pw / 2,
    footerEndY + 5.5,
    { align: "center" }
  );

  // ══════════════════════════════════════════
  // SAVE / DOWNLOAD PDF
  // ══════════════════════════════════════════
  doc.save(
    `Invoice_${data.customerName.replace(/\s+/g, "_")}_${data.invoiceId.slice(-6)}.pdf`
  );
}
