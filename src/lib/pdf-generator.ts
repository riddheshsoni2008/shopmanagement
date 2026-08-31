import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceItem {
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

export interface ExpenseStatementPDFItem {
  date: string;
  category: string;
  note: string;
  addedBy: string;
  amount: number;
}

export interface ExpenseStatementPDFData {
  shopName: string;
  generatedBy?: string;
  periodLabel: string;
  totalExpenses: number;
  totalEntries: number;
  categoryTotals: Record<string, number>;
  expenses: ExpenseStatementPDFItem[];
}

export interface SalesStatementPDFItem {
  invoiceId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  itemsCount: number;
  itemNames?: string;
  paymentStatus: string;
  paymentMethod: string;
  soldBy: string;
  totalAmount: number;
}

export interface SalesStatementPDFData {
  shopName: string;
  generatedBy?: string;
  periodLabel: string;
  totalRevenue: number;
  totalSalesCount: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
  sales: SalesStatementPDFItem[];
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
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty ",
    "Thirty ",
    "Forty ",
    "Fifty ",
    "Sixty ",
    "Seventy ",
    "Eighty ",
    "Ninety ",
  ];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + inWords(n % 100);
    if (n < 100000)
      return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000)
      return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
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
// UNICODE & GUJARATI HIGH-RESOLUTION CANVAS RENDERER FOR PDF
// ══════════════════════════════════════════════════════════════════
function renderUnicodeTextToImage(
  text: string,
  fontSizePt: number = 9,
  colorHex: string = "#000000",
  fontWeight: "bold" | "normal" = "normal"
): { dataUrl: string; widthMm: number; heightMm: number; baselineFromTopMm: number } {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { dataUrl: "", widthMm: 0, heightMm: 0, baselineFromTopMm: 0 };
  }

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { dataUrl: "", widthMm: 0, heightMm: 0, baselineFromTopMm: 0 };

    // Scale factor for crisp retina/high-DPI printing (4x scale = 384 DPI print quality)
    const scale = 4;
    // 1 pt in PDF = (96 / 72) CSS pixels = 1.333333 px
    const cssPxSize = fontSizePt * (96 / 72);
    const scaledFontSize = cssPxSize * scale;

    // Use clean font weights and order for Gujarati typography
    // Weight 600 or normal ensures glyphs remain clear without heavy synthetic bold distortion
    const weightCss = fontWeight === "bold" ? "600" : "normal";
    const fontStyle = `${weightCss} ${scaledFontSize}px "Noto Sans Gujarati", "Gujarati Sangam MN", "Shruti", "Segoe UI", "Mukta", sans-serif`;

    ctx.font = fontStyle;
    const metrics = ctx.measureText(text);

    const ascent = metrics.actualBoundingBoxAscent || scaledFontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || scaledFontSize * 0.25;
    const textWidth = Math.ceil(metrics.width);
    const totalHeight = Math.ceil(ascent + descent);

    // Subtle 2px margin at 1x scale (8px at 4x scale) to protect glyph edges
    const padPx = 2 * scale;

    canvas.width = Math.max(1, textWidth + padPx * 2);
    canvas.height = Math.max(1, totalHeight + padPx * 2);

    // Re-apply context settings after canvas resize
    ctx.font = fontStyle;
    ctx.fillStyle = colorHex;
    ctx.textBaseline = "alphabetic";

    const drawXOnCanvas = padPx;
    const drawYOnCanvas = padPx + ascent;
    ctx.fillText(text, drawXOnCanvas, drawYOnCanvas);

    const dataUrl = canvas.toDataURL("image/png");

    // Convert pixels to PDF mm (1 CSS px at 96 DPI = 25.4 / 96 mm = 0.26458333 mm)
    const pxToMm = 25.4 / 96;
    const widthMm = (canvas.width / scale) * pxToMm;
    const heightMm = (canvas.height / scale) * pxToMm;
    const baselineFromTopMm = (drawYOnCanvas / scale) * pxToMm;

    return { dataUrl, widthMm, heightMm, baselineFromTopMm };
  } catch {
    return { dataUrl: "", widthMm: 0, heightMm: 0, baselineFromTopMm: 0 };
  }
}

function drawSafeText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    colorHex?: string;
    fontWeight?: "bold" | "normal";
    align?: "left" | "center" | "right";
  }
) {
  const str = text || "";
  const hasUnicode = /[^\x00-\x7F]/.test(str);

  if (hasUnicode) {
    const fontSize = options?.fontSize || 9;
    const colorHex = options?.colorHex || "#000000";
    const fontWeight = options?.fontWeight || "normal";
    const align = options?.align || "left";

    const rendered = renderUnicodeTextToImage(str, fontSize, colorHex, fontWeight);

    if (rendered.dataUrl) {
      const padMm = 2 * (25.4 / 96);
      let drawX = x - padMm;
      if (align === "center") {
        drawX = x - rendered.widthMm / 2;
      } else if (align === "right") {
        drawX = x - rendered.widthMm + padMm;
      }

      const drawY = y - rendered.baselineFromTopMm;
      doc.addImage(rendered.dataUrl, "PNG", drawX, drawY, rendered.widthMm, rendered.heightMm);
      return;
    }
  }

  doc.text(str, x, y, options?.align ? { align: options.align } : undefined);
}

function handleAutoTableCellUnicode(doc: jsPDF, cellData: any) {
  if (cellData.section === "body" || cellData.section === "head") {
    const rawText = cellData.cell.text ? cellData.cell.text.join("\n") : "";
    if (/[^\x00-\x7F]/.test(rawText)) {
      const fontSize = cellData.cell.styles.fontSize || 8;
      const isBold = cellData.cell.styles.fontStyle === "bold";
      const colorRGB = cellData.cell.styles.textColor || [0, 0, 0];
      const colorHex = Array.isArray(colorRGB)
        ? `#${colorRGB.map((c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("")}`
        : "#000000";

      const rendered = renderUnicodeTextToImage(rawText, fontSize, colorHex, isBold ? "bold" : "normal");
      if (rendered.dataUrl) {
        const fill = cellData.cell.styles.fillColor;
        if (fill && Array.isArray(fill)) {
          doc.setFillColor(fill[0], fill[1], fill[2]);
          doc.rect(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, "F");
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, "F");
        }

        const lineW = cellData.cell.styles.lineWidth;
        if (lineW) {
          const lineC = cellData.cell.styles.lineColor || [160, 140, 100];
          doc.setDrawColor(lineC[0], lineC[1], lineC[2]);
          doc.setLineWidth(lineW);
          doc.rect(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, "S");
        }

        const padLeft = cellData.cell.padding("left") || 1.5;
        const padMm = 2 * (25.4 / 96);
        let drawX = cellData.cell.x + padLeft - padMm;
        if (cellData.cell.styles.halign === "center") {
          drawX = cellData.cell.x + (cellData.cell.width - rendered.widthMm) / 2;
        } else if (cellData.cell.styles.halign === "right") {
          drawX = cellData.cell.x + cellData.cell.width - rendered.widthMm - (cellData.cell.padding("right") || 1.5) + padMm;
        }

        const drawY = cellData.cell.y + (cellData.cell.height - rendered.heightMm) / 2;
        doc.addImage(rendered.dataUrl, "PNG", drawX, drawY, rendered.widthMm, rendered.heightMm);
      }
    }
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
  drawSafeText(doc, data.shopName, pw / 2, y + 10, {
    fontSize: 19,
    fontWeight: "bold",
    colorHex: "#825f14",
    align: "center",
  });

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
  // ROW 4: CUSTOMER DETAILS (left) + INVOICE INFO (right)
  // ══════════════════════════════════════════
  const partyTop = y;
  const midX = L + W * 0.55;

  // Vertical divider
  doc.line(midX, partyTop, midX, partyTop + 32);

  // Left side: Customer details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Customer Details :", L + 3, y + 5.5);

  drawSafeText(doc, data.customerName, L + 3, y + 12, {
    fontSize: 9.5,
    fontWeight: "normal",
    colorHex: "#000000",
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  doc.text(`Ph: ${data.customerPhone || "N/A"}`, L + 3, y + 18);

  doc.setFontSize(7.5);
  doc.text("GSTIN / UIN : -", L + 3, y + 25);

  // Right side: Invoice Metadata
  const rLabelX = midX + 3;
  const rColon = midX + 32;
  const rValX = midX + 35;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);

  const invNum =
    data.invoiceId.length > 8
      ? `ZJ/${data.invoiceId.slice(-6).toUpperCase()}`
      : data.invoiceId;
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
  doc.text(
    `${(data.paymentStatus || "PAID").toUpperCase()} / ${data.paymentMethod || "Cash"}`,
    rValX,
    y + 29,
  );

  y += 32;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // ══════════════════════════════════════════
  // ROW 5: ITEMS TABLE
  // ══════════════════════════════════════════
  const tableStartY = y + 0.5;

  const tableRows = data.items.map((item, i) => {
    let nameText = /[^\x00-\x7F]/.test(item.name) ? item.name : item.name.toUpperCase();

    const rawP = item.productWeight ?? item.weight ?? 0;
    const pUnit = item.productWeightUnit || "g";
    const pWeight = pUnit === "mg" ? rawP / 1000 : rawP;

    const rawJ = item.jadatarWeight ?? 0;
    const jUnit = item.jadatarWeightUnit || "g";
    const jWeight = jUnit === "mg" ? rawJ / 1000 : rawJ;

    const rawN = item.nangWeight ?? 0;
    const nUnit = item.nangWeightUnit || "g";
    const nWeight = nUnit === "mg" ? rawN / 1000 : rawN;

    const rawM = item.meenoWeight ?? 0;
    const mUnit = item.meenoWeightUnit || "g";
    const mWeight = mUnit === "mg" ? rawM / 1000 : rawM;

    const netWeight = item.netWeight ?? item.weight ?? Math.max(0, pWeight - jWeight - nWeight - mWeight);

    const fmtUnitWt = (rawVal: number, unit?: string) => {
      if (unit === "mg") return `${rawVal}mg`;
      return `${rawVal.toFixed(3)}g`;
    };

    const wtDeductions: string[] = [];
    if (rawJ > 0) wtDeductions.push(`Jadatar: ${fmtUnitWt(rawJ, jUnit)}`);
    if (rawN > 0) wtDeductions.push(`Stone: ${fmtUnitWt(rawN, nUnit)}`);
    if (rawM > 0) wtDeductions.push(`Meeno: ${fmtUnitWt(rawM, mUnit)}`);

    if (wtDeductions.length > 0) {
      nameText += `\nGross: ${fmtUnitWt(rawP, pUnit)} | Less (${wtDeductions.join(", ")}) = Net: ${netWeight.toFixed(3)}g`;
    }

    const extras: string[] = [];
    if (item.hallmarkCharge && item.hallmarkCharge > 0)
      extras.push(`HM: ${fmtINR(item.hallmarkCharge)}`);
    if (item.jadatarCharge && item.jadatarCharge > 0)
      extras.push(`Jadatar: ${fmtINR(item.jadatarCharge)}`);
    if (item.rhodiumCharge && item.rhodiumCharge > 0)
      extras.push(`Rodium: ${fmtINR(item.rhodiumCharge)}`);
    if (item.nangCharge && item.nangCharge > 0)
      extras.push(`Nang: ${fmtINR(item.nangCharge)}`);
    if (item.meenoCharge && item.meenoCharge > 0)
      extras.push(`Meeno: ${fmtINR(item.meenoCharge)}`);

    if (extras.length > 0) {
      nameText += `\nCharges: (${extras.join(" | ")})`;
    }

    return [
      `${i + 1}`,
      nameText,
      "7113",
      netWeight.toFixed(3),
      "GMS",
      fmtINR(item.pricePerGram),
      fmtINR(item.lineTotal),
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [
      [
        "S.N.",
        "Description of Goods",
        "HSN\nCode",
        "Qty.",
        "Unit",
        "Price",
        "Amount (Rs.)",
      ],
    ],
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
    didDrawCell: (cellData: any) => {
      handleAutoTableCellUnicode(doc, cellData);
    },
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
  const totalMaking = data.items.reduce(
    (sum, item) => sum + item.qty * item.weight * item.makingCharge,
    0,
  );
  const totalExtra = data.items.reduce(
    (sum, item) =>
      sum +
      (item.hallmarkCharge || 0) +
      (item.jadatarCharge || 0) +
      (item.rhodiumCharge || 0) +
      (item.nangCharge || 0) +
      (item.meenoCharge || 0),
    0,
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
    doc.text(
      "Add  :  Extra Charges (HM/Jadatar/Rodium/Nang)",
      totalLabelX - 35,
      tY,
    );
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
  doc.text(`Rs. ${fmtINR(data.totalAmount)}`, amtX, bannerY + 5.5, {
    align: "right",
  });

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
  doc.setFontSize(6.2);
  doc.setTextColor(...MID);
  doc.text("E. & O.E.", L + 3, footerStartY + 10);
  doc.text(
    "1. No guarantee or warranty on breakage of jewelry items.",
    L + 3,
    footerStartY + 14,
  );
  doc.text(
    "2. Goods once sold will not be returned or taken back.",
    L + 3,
    footerStartY + 18,
  );
  doc.text(
    "3. Subject to 'Botad' Jurisdiction only.",
    L + 3,
    footerStartY + 22,
  );

  // RIGHT: Signatures
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD_DARK);
  doc.text(`for ${data.shopName.toUpperCase()}`, R - 3, footerStartY + 4.5, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...MID);
  doc.text("Receiver's Signature :", footerDivider + 3, footerStartY + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("Authorised Signatory", R - 3, footerStartY + 26, {
    align: "right",
  });

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
    { align: "center" },
  );

  // ══════════════════════════════════════════
  // SAVE / DOWNLOAD PDF
  // ══════════════════════════════════════════
  doc.save(
    `Invoice_${data.customerName.replace(/\s+/g, "_")}_${data.invoiceId.slice(-6)}.pdf`,
  );
}

// ══════════════════════════════════════════════════════════════════
// EXPENSE STATEMENT PDF GENERATOR — Bank / Corporate Financial Format
// ══════════════════════════════════════════════════════════════════
export async function generateExpenseStatementPDF(
  data: ExpenseStatementPDFData,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const L = 10;
  const R = 200;
  const W = 190;

  const GOLD: [number, number, number] = [178, 134, 46];
  const GOLD_LIGHT: [number, number, number] = [235, 215, 160];
  const GOLD_DARK: [number, number, number] = [130, 95, 20];
  const BLACK: [number, number, number] = [0, 0, 0];
  const DARK: [number, number, number] = [30, 25, 15];
  const MID: [number, number, number] = [80, 70, 50];
  const BORDER: [number, number, number] = [160, 140, 100];
  const ROSE: [number, number, number] = [190, 40, 40];

  const logoBase64 = await loadLogoBase64();
  let y = 10;

  // Header Banner
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  doc.text("OFFICIAL FINANCIAL EXPENSE STATEMENT", L + 3, y + 4);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...MID);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    R - 3,
    y + 4,
    { align: "right" },
  );

  y += 6;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // Shop Header Box
  doc.setFillColor(255, 252, 242);
  doc.rect(L, y, W, 22, "F");

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", L + 4, y + 1, 26, 20);
    } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...GOLD_DARK);
  doc.text((data.shopName || "ZEAL JEWELLERS").toUpperCase(), pw / 2, y + 9, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MID);
  doc.text("OPERATIONAL EXPENSE LEDGER & FINANCIAL STATEMENT", pw / 2, y + 15, {
    align: "center",
  });

  y += 22;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // Statement Meta Bar
  doc.setFillColor(248, 246, 240);
  doc.rect(L, y, W, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Statement Period:", L + 4, y + 7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.text(data.periodLabel, L + 35, y + 7.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  doc.text("Account / Owner:", L + 115, y + 7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.text(data.generatedBy || "Admin Account", L + 145, y + 7.5);

  y += 12;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // Executive Summary Card Box
  y += 4;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(240, 180, 180);
  doc.roundedRect(L, y, W, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ROSE);
  doc.text("TOTAL OPERATIONAL EXPENSES", L + 6, y + 6);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Rs. ${fmtINR(data.totalExpenses)}`, L + 6, y + 15);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  doc.text(`Total Recorded Entries: ${data.totalEntries}`, R - 6, y + 10, {
    align: "right",
  });
  doc.text(
    `Categories Tracked: ${Object.keys(data.categoryTotals).length}`,
    R - 6,
    y + 15,
    { align: "right" },
  );

  y += 24;

  // Category Breakdown Summary Mini Table
  if (Object.keys(data.categoryTotals).length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GOLD_DARK);
    doc.text("Category Breakdown Summary", L, y);

    y += 2;
    const catRows = Object.entries(data.categoryTotals).map(([cat, amount]) => {
      const pct =
        data.totalExpenses > 0
          ? ((amount / data.totalExpenses) * 100).toFixed(1)
          : "0.0";
      return [cat, `Rs. ${fmtINR(amount)}`, `${pct}%`];
    });

    autoTable(doc, {
      startY: y,
      head: [["Category", "Total Spent (Rs.)", "% of Total"]],
      body: catRows,
      headStyles: {
        fillColor: [GOLD_LIGHT[0], GOLD_LIGHT[1], GOLD_LIGHT[2]],
        textColor: [DARK[0], DARK[1], DARK[2]],
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [BLACK[0], BLACK[1], BLACK[2]],
        cellPadding: 1.8,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 70, halign: "right" },
        2: { cellWidth: 50, halign: "right" },
      },
      margin: { left: L, right: 10 },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Detailed Expense Transaction Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Itemized Expense Ledger Transactions", L, y);

  y += 2;

  const itemRows = data.expenses.map((e, index) => [
    `${index + 1}`,
    new Date(e.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    e.category,
    e.note || "No memo recorded",
    e.addedBy || "Admin",
    `Rs. ${fmtINR(e.amount)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "S.N.",
        "Date",
        "Category",
        "Description / Memo",
        "Logged By",
        "Amount (Rs.)",
      ],
    ],
    body: itemRows,
    headStyles: {
      fillColor: [GOLD[0], GOLD[1], GOLD[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [BLACK[0], BLACK[1], BLACK[2]],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 26, halign: "center" },
      2: { cellWidth: 32 },
      3: { cellWidth: 68 },
      4: { cellWidth: 24, halign: "center" },
      5: { cellWidth: 30, halign: "right" },
    },
    margin: { left: L, right: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Grand Total Summary Line
  doc.setFillColor(GOLD_LIGHT[0], GOLD_LIGHT[1], GOLD_LIGHT[2]);
  doc.rect(L, y, W, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(
    `Total Statement Expenses (${data.totalEntries} items)`,
    L + 4,
    y + 5.5,
  );

  doc.setFontSize(10);
  doc.setTextColor(...ROSE);
  doc.text(`Rs. ${fmtINR(data.totalExpenses)}`, R - 4, y + 5.5, {
    align: "right",
  });

  y += 12;

  // Electronic Statement Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...MID);
  doc.text(
    "This is an electronically generated financial statement from Zeal Jewellers Shop Management & POS System.",
    pw / 2,
    y,
    { align: "center" },
  );
  doc.text(
    "All financial entries are encrypted and verified against store ledger logs.",
    pw / 2,
    y + 4,
    { align: "center" },
  );

  // Trigger Save / Download and automatically release memory resources
  const cleanPeriod = data.periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Expense_Statement_${cleanPeriod}.pdf`);
}

// ══════════════════════════════════════════════════════════════════
// SALES STATEMENT PDF GENERATOR — Bank / Corporate Financial Format
// ══════════════════════════════════════════════════════════════════
export async function generateSalesStatementPDF(data: SalesStatementPDFData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const L = 10;
  const R = 200;
  const W = 190;

  const GOLD: [number, number, number] = [178, 134, 46];
  const GOLD_LIGHT: [number, number, number] = [235, 215, 160];
  const GOLD_DARK: [number, number, number] = [130, 95, 20];
  const BLACK: [number, number, number] = [0, 0, 0];
  const DARK: [number, number, number] = [30, 25, 15];
  const MID: [number, number, number] = [80, 70, 50];
  const BORDER: [number, number, number] = [160, 140, 100];
  const EMERALD: [number, number, number] = [16, 122, 68];

  const logoBase64 = await loadLogoBase64();
  let y = 10;

  // Header Banner
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  doc.text("OFFICIAL SALES TRANSACTION LEDGER STATEMENT", L + 3, y + 4);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...MID);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    R - 3,
    y + 4,
    { align: "right" },
  );

  y += 6;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // Shop Header Box
  doc.setFillColor(255, 252, 242);
  doc.rect(L, y, W, 22, "F");

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", L + 4, y + 1, 26, 20);
    } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...GOLD_DARK);
  doc.text((data.shopName || "ZEAL JEWELLERS").toUpperCase(), pw / 2, y + 9, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MID);
  doc.text("SALES REVENUE & INVOICE TRANSACTION STATEMENT", pw / 2, y + 15, {
    align: "center",
  });

  y += 22;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // Statement Meta Bar
  doc.setFillColor(248, 246, 240);
  doc.rect(L, y, W, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Statement Period:", L + 4, y + 7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.text(data.periodLabel, L + 35, y + 7.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GOLD_DARK);
  doc.text("Account / Owner:", L + 115, y + 7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BLACK);
  doc.text(data.generatedBy || "Admin Account", L + 145, y + 7.5);

  y += 12;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);

  // Executive Summary Card Box
  y += 4;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(L, y, W, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...EMERALD);
  doc.text("TOTAL SALES REVENUE", L + 6, y + 6);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Rs. ${fmtINR(data.totalRevenue)}`, L + 6, y + 15);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MID);
  doc.text(`Total Invoices Billed: ${data.totalSalesCount}`, R - 6, y + 10, {
    align: "right",
  });
  doc.text(
    `Paid: ${data.paidCount} | Pending: ${data.pendingCount} | Partial: ${data.partialCount}`,
    R - 6,
    y + 15,
    { align: "right" },
  );

  y += 24;

  // Itemized Sales Transaction Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...GOLD_DARK);
  doc.text("Itemized Sales Invoice Transactions", L, y);

  y += 2;

  const itemRows = data.sales.map((s, index) => [
    `${index + 1}`,
    `#${s.invoiceId.slice(-8).toUpperCase()}`,
    new Date(s.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    /[^\x00-\x7F]/.test(s.customerName) ? s.customerName : s.customerName.toUpperCase(),
    s.customerPhone || "N/A",
    s.itemNames || `${s.itemsCount} pc(s)`,
    `${s.paymentStatus} (${s.paymentMethod || "Cash"})`,
    `Rs. ${fmtINR(s.totalAmount)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "S.N.",
        "Invoice ID",
        "Date",
        "Customer Name",
        "Phone",
        "Items Purchased",
        "Status & Mode",
        "Amount (Rs.)",
      ],
    ],
    body: itemRows,
    headStyles: {
      fillColor: [GOLD[0], GOLD[1], GOLD[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [BLACK[0], BLACK[1], BLACK[2]],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 24, halign: "center" },
      3: { cellWidth: 42 },
      4: { cellWidth: 24, halign: "center" },
      5: { cellWidth: 16, halign: "center" },
      6: { cellWidth: 28, halign: "center" },
      7: { cellWidth: 26, halign: "right" },
    },
    margin: { left: L, right: 10 },
    didDrawCell: (cellData: any) => {
      handleAutoTableCellUnicode(doc, cellData);
    },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Grand Total Summary Line
  doc.setFillColor(GOLD_LIGHT[0], GOLD_LIGHT[1], GOLD_LIGHT[2]);
  doc.rect(L, y, W, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(
    `Total Sales Revenue (${data.totalSalesCount} invoices)`,
    L + 4,
    y + 5.5,
  );

  doc.setFontSize(10);
  doc.setTextColor(...EMERALD);
  doc.text(`Rs. ${fmtINR(data.totalRevenue)}`, R - 4, y + 5.5, {
    align: "right",
  });

  y += 12;

  // Electronic Statement Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...MID);
  doc.text(
    "This is an electronically generated sales financial statement from Zeal Jewellers Shop Management & POS System.",
    pw / 2,
    y,
    { align: "center" },
  );
  doc.text(
    "All sales records are encrypted and verified against store ledger logs.",
    pw / 2,
    y + 4,
    { align: "center" },
  );

  // Trigger Save / Download and automatically release memory resources
  const cleanPeriod = data.periodLabel.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Sales_Statement_${cleanPeriod}.pdf`);
}
