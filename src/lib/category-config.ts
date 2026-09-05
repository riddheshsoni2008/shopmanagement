export type BusinessCategory = "jewelry" | "studio" | "clothing";

export interface CategoryFieldLabels {
  orderType: string;
  orderTypePlaceholder: string;
  orderNumber: string;
  dueDate: string;
  description: string;
  clientSectionTitle: string;
  financialsSectionTitle: string;
}

export interface CategoryConfig {
  id: BusinessCategory;
  modelType: "stock_based" | "order_based";
  label: string;
  shortLabel: string;
  description: string;
  icon: string; // lucide icon name
  accentColor: string; // tailwind color token
  orderPrefix: string;
  orderTypes: string[];
  expenseCategories: string[];
  fieldLabels: CategoryFieldLabels;
  features: {
    equipment: boolean;
    staffAssignment: boolean;
    measurements: boolean;
    stock: boolean;
  };
}

export const CATEGORY_CONFIGS: Record<BusinessCategory, CategoryConfig> = {
  jewelry: {
    id: "jewelry",
    modelType: "stock_based",
    label: "Jewelry Shop",
    shortLabel: "Jewelry",
    description: "Stock-based inventory, gold/silver rate management, and sales billing.",
    icon: "Gem",
    accentColor: "amber",
    orderPrefix: "JWL",
    orderTypes: [],
    expenseCategories: [],
    fieldLabels: {
      orderType: "Type",
      orderTypePlaceholder: "",
      orderNumber: "Bill #",
      dueDate: "Date",
      description: "Notes",
      clientSectionTitle: "Customer Details",
      financialsSectionTitle: "Billing",
    },
    features: {
      equipment: false,
      staffAssignment: false,
      measurements: false,
      stock: true,
    },
  },
  studio: {
    id: "studio",
    modelType: "order_based",
    label: "Camera Studio",
    shortLabel: "Studio",
    description: "Order/job-based management for photography and videography services.",
    icon: "Camera",
    accentColor: "violet",
    orderPrefix: "STU",
    orderTypes: [
      "Wedding Shoot",
      "Pre-Wedding Shoot",
      "Portrait Session",
      "Event Coverage",
      "Product Shoot",
      "Commercial / Ad Shoot",
      "Birthday / Celebration",
      "Fashion Portfolio",
      "Other",
    ],
    expenseCategories: [
      "Travel",
      "Editing / Post-Processing",
      "Equipment Rental",
      "Assistant Fee",
      "Venue / Location",
      "Props",
      "Printing / Albums",
      "Misc",
    ],
    fieldLabels: {
      orderType: "Shoot / Job Type",
      orderTypePlaceholder: "Select shoot type...",
      orderNumber: "Shoot ID",
      dueDate: "Shoot / Event Date",
      description: "Shoot Scope & Location Brief",
      clientSectionTitle: "Client Details",
      financialsSectionTitle: "Job Budget & Commercials",
    },
    features: {
      equipment: true,
      staffAssignment: true,
      measurements: false,
      stock: false,
    },
  },
  clothing: {
    id: "clothing",
    modelType: "order_based",
    label: "Clothing Shop",
    shortLabel: "Clothing",
    description: "Order/job-based management for stitching, tailoring, and custom garments.",
    icon: "Scissors",
    accentColor: "rose",
    orderPrefix: "CLT",
    orderTypes: [
      "Custom Stitching",
      "Alteration",
      "Embroidery",
      "Blouse Stitching",
      "Lehenga / Heavy Work",
      "Kurta / Sherwani",
      "Suit / Formal Wear",
      "Bulk Order",
      "Designer Wear",
      "Other",
    ],
    expenseCategories: [
      "Fabric Cost",
      "Tailoring / Labor",
      "Embellishments",
      "Thread & Accessories",
      "Buttons / Zippers",
      "Packaging",
      "Transport",
      "Misc",
    ],
    fieldLabels: {
      orderType: "Stitching / Service Type",
      orderTypePlaceholder: "Select service type...",
      orderNumber: "Order Number",
      dueDate: "Trial / Delivery Date",
      description: "Garment Design & Style Notes",
      clientSectionTitle: "Customer Details",
      financialsSectionTitle: "Order Financials & Material Costs",
    },
    features: {
      equipment: false,
      staffAssignment: false,
      measurements: true,
      stock: false,
    },
  },
};

export function getCategoryConfig(cat: BusinessCategory): CategoryConfig {
  return CATEGORY_CONFIGS[cat];
}

export const ORDER_STATUSES = [
  { value: "received", label: "Received", color: "sky" },
  { value: "in_progress", label: "In Progress", color: "amber" },
  { value: "completed", label: "Completed", color: "emerald" },
  { value: "delivered", label: "Delivered", color: "violet" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];
