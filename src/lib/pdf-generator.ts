import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceItem {
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
}

export interface InvoicePDFData {
  invoiceId: string;
  shopName: string;
  customerName: string;
  customerPhone: string;
  createdAt: string | Date;
  soldBy: string;
  paymentStatus?: string;
  paymentMethod?: string;
  items: InvoiceItem[];
  discount: number;
  totalAmount: number;
}

// Format numbers into clean Indian Currency format
function fmtINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

// Number to Words Converter for INR
function numberToWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ",
    "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  }

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let str = inWords(integerPart);
  str += str.trim() ? "Rupees " : "";

  if (decimalPart > 0) {
    str += "and " + inWords(decimalPart) + "Paise ";
  }
  return (str + "Only").trim();
}

// Helper to fetch and cache logo base64
let cachedLogoBase64: string | null = null;

async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result as string;
        resolve(cachedLogoBase64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// MAIN PDF GENERATOR — Traditional Indian GST Tax Invoice Format
// Clean, professional layout with gold/amber branding
// ══════════════════════════════════════════════════════════════════
export async function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210; // A4 width mm
  const L = 10; // left margin mm
  const R = 200; // right boundary mm
  const W = 190; // usable width mm (R - L)

  // ── Logo Theme Colors ──
  const GOLD: [number, number, number] = [178, 134, 46];
  const GOLD_LIGHT: [number, number, number] = [235, 215, 160];
  const GOLD_DARK: [number, number, number] = [130, 95, 20];
  const BLACK: [number, number, number] = [0, 0, 0];
  const DARK: [number, number, number] = [30, 25, 15];
  const MID: [number, number, number] = [80, 70, 50];
  const BORDER: [number, number, number] = [160, 140, 100];

  // ── Load Logo ──
  const logoBase64 = await loadLogoBase64();

  const topY = 10;
  let y = topY;

  // ══════════════════════════════════════════
  // ROW 1: GSTIN line + "Original Copy"
  // ══════════════════════════════════════════
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text("GSTIN : 24BPLPR1615B1Z8", L + 3, y + 5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.text("Original Copy", R - 3, y + 5, { align: "right" });

  // Horizontal line
  y += 7;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // ══════════════════════════════════════════
  // ROW 2: TAX INVOICE centered label
  // ══════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text("TAX INVOICE", pw / 2, y + 4.5, { align: "center" });

  const tiW = doc.getTextWidth("TAX INVOICE");
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(pw / 2 - tiW / 2, y + 5.5, pw / 2 + tiW / 2, y + 5.5);

  y += 7.5;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // ══════════════════════════════════════════
  // ROW 3: LOGO + SHOP NAME + ADDRESS
  // ══════════════════════════════════════════
  doc.setFillColor(255, 252, 242);
  doc.rect(L, y, W, 22, "F");

  // Logo (left)
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", L + 4, y + 1, 26, 20);
    } catch {
      // fallback
    }
  }

  // Shop Name — centered gold header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...GOLD_DARK);
  doc.text(data.shopName.toUpperCase(), pw / 2, y + 10, { align: "center" });

  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
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
  const midX = L + W * 0.55;

  // Vertical divider
  doc.line(midX, partyTop, midX, partyTop + 32);

  // Left side: Party details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Party Details :", L + 3, y + 5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(data.customerName.toUpperCase(), L + 3, y + 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  doc.text(`Ph: ${data.customerPhone || "N/A"}`, L + 3, y + 15);

  doc.setFontSize(7.5);
  doc.text("GSTIN / UIN : -", L + 3, y + 27);

  // Right side: Invoice Metadata
  const rLabelX = midX + 3;
  const rColon = midX + 32;
  const rValX = midX + 35;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);

  const invNum = data.invoiceId.length > 8 ? `ZJ/${data.invoiceId.slice(-6).toUpperCase()}` : data.invoiceId;
  const formattedDate = new Date(data.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc.text("Invoice No.", rLabelX, y + 5);
  doc.text(":", rColon, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(invNum, rValX, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  doc.text("Dated", rLabelX, y + 11);
  doc.text(":", rColon, y + 11);
  doc.text(formattedDate, rValX, y + 11);

  doc.text("Place of Supply", rLabelX, y + 17);
  doc.text(":", rColon, y + 17);
  doc.text("Gujarat (24)", rValX, y + 17);

  doc.text("Reverse Charge", rLabelX, y + 23);
  doc.text(":", rColon, y + 23);
  doc.text("N", rValX, y + 23);

  doc.text("Payment", rLabelX, y + 29);
  doc.text(":", rColon, y + 29);
  doc.setFont("helvetica", "bold");
  doc.text(`${(data.paymentStatus || "PAID").toUpperCase()} / ${data.paymentMethod || "Cash"}`, rValX, y + 29);

  y += 32;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // ══════════════════════════════════════════
  // ROW 5: ITEMS TABLE
  // ══════════════════════════════════════════
  const tableStartY = y + 0.5;

  const tableRows = data.items.map((item, i) => {
    let nameText = item.name.toUpperCase();
    const extras: string[] = [];
    if (item.hallmarkCharge && item.hallmarkCharge > 0) extras.push(`HM: ${fmtINR(item.hallmarkCharge)}`);
    if (item.jadatarCharge && item.jadatarCharge > 0) extras.push(`Jadatar: ${fmtINR(item.jadatarCharge)}`);
    if (item.rhodiumCharge && item.rhodiumCharge > 0) extras.push(`Rodium: ${fmtINR(item.rhodiumCharge)}`);
    if (item.nangCharge && item.nangCharge > 0) extras.push(`Nang: ${fmtINR(item.nangCharge)}`);
    
    if (extras.length > 0) {
      nameText += `\n(${extras.join(" | ")})`;
    }

    return [
      `${i + 1}`,
      nameText,
      "7113",
      item.weight.toFixed(4),
      "GMS",
      fmtINR(item.pricePerGram),
      fmtINR(item.lineTotal),
    ];
  });

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
      cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
      lineColor: [BORDER[0], BORDER[1], BORDER[2]],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [BLACK[0], BLACK[1], BLACK[2]],
      cellPadding: { top: 2.5, bottom: 2.5, left: 1.5, right: 1.5 },
      lineColor: [BORDER[0], BORDER[1], BORDER[2]],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 68 },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 18, halign: "right" },
      4: { cellWidth: 12, halign: "center", fontSize: 7 },
      5: { cellWidth: 30, halign: "right" },
      6: { cellWidth: 36, halign: "right" },
    },
    margin: { left: L, right: 10 },
    tableLineColor: [BORDER[0], BORDER[1], BORDER[2]],
    tableLineWidth: 0.3,
    didParseCell: (cellData: any) => {
      if (cellData.section === "body") {
        cellData.cell.styles.minCellHeight = 7;
      }
    },
  });

  // ══════════════════════════════════════════
  // TOTALS / ADDITIONS / DEDUCTIONS
  // ══════════════════════════════════════════
  let tY = (doc as any).lastAutoTable.finalY;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  let subtotal = 0;
  data.items.forEach((item) => (subtotal += item.lineTotal));
  let totalWeight = 0;
  data.items.forEach((item) => (totalWeight += item.weight));
  const totalMaking = data.items.reduce((sum, item) => sum + (item.qty * item.weight * item.makingCharge), 0);
  const totalExtra = data.items.reduce(
    (sum, item) =>
      sum +
      (item.hallmarkCharge || 0) +
      (item.jadatarCharge || 0) +
      (item.rhodiumCharge || 0) +
      (item.nangCharge || 0),
    0
  );

  const taxableAmount = subtotal;
  const cgstRate = 1.5;
  const sgstRate = 1.5;
  const cgstAmount = Math.round(((taxableAmount * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxableAmount * sgstRate) / 100) * 100) / 100;

  const amtX = R - 3;
  const totalLabelX = L + W * 0.45;

  // Subtotal line
  tY += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text("Subtotal", totalLabelX, tY, { align: "right" });
  doc.text(fmtINR(subtotal), amtX, tY, { align: "right" });

  // Thin line
  tY += 1.5;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(totalLabelX + 5, tY, R, tY);

  // Making charges line
  tY += 4.5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...MID);
  doc.text("Add  :  Making Charges (included above)", totalLabelX - 35, tY);
  doc.text(fmtINR(totalMaking), amtX, tY, { align: "right" });

  // Extra charges line
  if (totalExtra > 0) {
    tY += 4.5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...MID);
    doc.text("Add  :  Extra Charges (HM/Jadatar/Rodium/Nang)", totalLabelX - 35, tY);
    doc.text(fmtINR(totalExtra), amtX, tY, { align: "right" });
  }

  // Discount line
  if (data.discount > 0) {
    tY += 4.5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(160, 30, 30);
    doc.text("Less :  Discount", totalLabelX - 35, tY);
    doc.text(fmtINR(data.discount), amtX, tY, { align: "right" });
  }

  // CGST & SGST
  tY += 4.5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...MID);
  doc.text("Add  :  CGST @ 1.5%", totalLabelX - 35, tY);
  doc.text(fmtINR(cgstAmount), amtX, tY, { align: "right" });

  tY += 4.5;
  doc.text("Add  :  SGST @ 1.5%", totalLabelX - 35, tY);
  doc.text(fmtINR(sgstAmount), amtX, tY, { align: "right" });

  tY += 3.5;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ══════════════════════════════════════════
  // GRAND TOTAL BANNER
  // ══════════════════════════════════════════
  const bannerY = tY;
  const bannerHeight = 8;
  doc.setFillColor(GOLD_LIGHT[0], GOLD_LIGHT[1], GOLD_LIGHT[2]);
  doc.rect(L, bannerY, W, bannerHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("Grand Total", L + 60, bannerY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`${totalWeight.toFixed(4)} GMS`, L + 115, bannerY + 5.5);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  doc.text(`Rs. ${fmtINR(data.totalAmount)}`, amtX, bannerY + 5.5, { align: "right" });

  tY += bannerHeight;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ══════════════════════════════════════════
  // TAX BREAKDOWN TABLE
  // ══════════════════════════════════════════
  tY += 1;
  const taxCols = [
    { label: "Tax Rate", x: L + 3, w: 18 },
    { label: "Taxable Amt.", x: L + 24, w: 28 },
    { label: "CGST Amt.", x: L + 55, w: 24 },
    { label: "SGST Amt.", x: L + 82, w: 24 },
    { label: "Total Tax", x: L + 109, w: 24 },
  ];

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  taxCols.forEach((col) => {
    doc.text(col.label, col.x, tY + 3.5);
  });

  tY += 4.5;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(L + 1, tY, L + 135, tY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  doc.text("3%", taxCols[0].x, tY + 3.5);
  doc.text(fmtINR(taxableAmount), taxCols[1].x, tY + 3.5);
  doc.text(fmtINR(cgstAmount), taxCols[2].x, tY + 3.5);
  doc.text(fmtINR(sgstAmount), taxCols[3].x, tY + 3.5);
  doc.text(fmtINR(cgstAmount + sgstAmount), taxCols[4].x, tY + 3.5);

  tY += 6;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ══════════════════════════════════════════
  // AMOUNT IN WORDS
  // ══════════════════════════════════════════
  tY += 1;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Rupees", L + 3, tY + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  const words = numberToWords(data.totalAmount);
  doc.text(words, L + 22, tY + 4.5, { maxWidth: W - 28 });

  tY += 8;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, tY, R, tY);

  // ══════════════════════════════════════════
  // FOOTER: Terms + Signatures
  // ══════════════════════════════════════════
  const footerDivider = pw / 2 + 10;
  const footerStartY = tY;
  const footerHeight = 32;
  const footerEndY = footerStartY + footerHeight;

  // Vertical line dividing terms and signatures
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(footerDivider, footerStartY, footerDivider, footerEndY);

  // LEFT: Terms & Conditions
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Terms & Conditions", L + 3, footerStartY + 4.5);

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.15);
  doc.line(L + 3, footerStartY + 5.5, L + 40, footerStartY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MID);
  doc.text("E. & O.E.", L + 3, footerStartY + 10);
  doc.text("1. Goods once sold will not be taken back.", L + 3, footerStartY + 14);
  doc.text("2. Interest @ 18% p.a. will be charged if the payment", L + 3, footerStartY + 18);
  doc.text("   is not made within the stipulated time.", L + 3, footerStartY + 22);
  doc.text("3. Subject to 'Gujarat' Jurisdiction only.", L + 3, footerStartY + 26);

  // RIGHT: Signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_DARK);
  doc.text(`for ${data.shopName.toUpperCase()}`, R - 3, footerStartY + 4.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text("Receiver's Signature :", footerDivider + 3, footerStartY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("Authorised Signatory", R - 3, footerStartY + 26, { align: "right" });

  // ══════════════════════════════════════════
  // OUTER BORDER & BOTTOM ACCENTS
  // ══════════════════════════════════════════
  const totalBorderHeight = footerEndY - topY;

  // Outer border
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.rect(L, topY, W, totalBorderHeight);

  // Gold accent bar right below outer border
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.rect(L, footerEndY, W, 1.5, "F");

  // Thank you line
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...MID);
  doc.text(
    `Thank you for choosing ${data.shopName}! Your trust is our treasure.`,
    pw / 2,
    footerEndY + 5,
    { align: "center" }
  );

  // ══════════════════════════════════════════
  // SAVE / DOWNLOAD PDF
  // ══════════════════════════════════════════
  doc.save(
    `Invoice_${data.customerName.replace(/\s+/g, "_")}_${data.invoiceId.slice(-6)}.pdf`
  );
}
