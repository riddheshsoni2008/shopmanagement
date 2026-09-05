export type BusinessCategory = "jewelry" | "studio" | "clothing";

export interface CategoryConfig {
  id: BusinessCategory;
  label: string;
  shortLabel: string;
  description: string;
  icon: string; // lucide icon name
  accentColor: string; // tailwind color token
  orderTypes: string[];
  expenseCategories: string[];
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
    label: "Jewelry Shop",
    shortLabel: "Jewelry",
    description: "Stock-based inventory, gold/silver rate management, and sales billing.",
    icon: "Gem",
    accentColor: "amber",
    orderTypes: [],
    expenseCategories: [],
    features: {
      equipment: false,
      staffAssignment: false,
      measurements: false,
      stock: true,
    },
  },
  studio: {
    id: "studio",
    label: "Camera Studio",
    shortLabel: "Studio",
    description: "Order/job-based management for photography and videography services.",
    icon: "Camera",
    accentColor: "violet",
    orderTypes: [
      "Wedding Shoot",
      "Pre-Wedding Shoot",
      "Portrait Session",
      "Event Coverage",
      "Product Shoot",
      "Commercial / Ad Shoot",
      "Birthday / Celebration",
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
    features: {
      equipment: true,
      staffAssignment: true,
      measurements: false,
      stock: false,
    },
  },
  clothing: {
    id: "clothing",
    label: "Clothing Shop",
    shortLabel: "Clothing",
    description: "Order/job-based management for stitching, tailoring, and custom garments.",
    icon: "Scissors",
    accentColor: "rose",
    orderTypes: [
      "Custom Stitching",
      "Alteration",
      "Embroidery",
      "Blouse Stitching",
      "Lehenga / Heavy Work",
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
