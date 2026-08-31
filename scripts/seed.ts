import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local manually — tsx does not auto-read Next.js env files
try {
  const envPath = join(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {
  // no .env.local — rely on actual environment variables
}

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set. Check your .env.local file.");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: String,
});

const ProductSchema = new mongoose.Schema({
  name: String,
  category: String,
  metal: String,
  purity: String,
  size: String,
  weightPerPiece: Number,
  quantity: Number,
  purchasePrice: Number,
  sellingPrice: Number,
  lowStockThreshold: Number,
});

const RateSchema = new mongoose.Schema({
  goldRate22k: Number,
  goldRate18k: Number,
  silverRate: Number,
  shopName: String,
  updatedBy: mongoose.Schema.Types.ObjectId,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
const Rate = mongoose.models.Rate || mongoose.model("Rate", RateSchema);

async function seed() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGODB_URI);

  // 1. Seed Users
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const staffPasswordHash = await bcrypt.hash("staff123", 10);

  await User.deleteMany({});

  const adminUser = await User.create({
    name: "Aura Admin",
    email: "admin@jewelry.com",
    passwordHash: adminPasswordHash,
    role: "admin",
  });

  const staffUser = await User.create({
    name: "Rahul Staff",
    email: "staff@jewelry.com",
    passwordHash: staffPasswordHash,
    role: "staff",
  });

  console.log("Users seeded successfully:");
  console.log("  - Admin: admin@jewelry.com / admin123");
  console.log("  - Staff: staff@jewelry.com / staff123");

  // 2. Seed Rates
  await Rate.deleteMany({});
  await Rate.create({
    goldRate22k: 7200,
    goldRate18k: 5900,
    silverRate: 85,
    shopName: "Zeal Jewellers®",
    updatedBy: adminUser._id,
  });

  // 3. Seed Products
  await Product.deleteMany({});
  const products = [
    {
      name: "Royal Peacock 22K Gold Necklace",
      category: "Necklace",
      metal: "Gold",
      purity: "22K",
      size: "18 inch",
      weightPerPiece: 28.5,
      quantity: 8,
      purchasePrice: 185000,
      sellingPrice: 215000,
      lowStockThreshold: 3,
    },
    {
      name: "Heritage Kundan Gold Bangle Set",
      category: "Bangle",
      metal: "Gold",
      purity: "22K",
      size: "2.4 inch",
      weightPerPiece: 45.0,
      quantity: 2, // Low stock demo!
      purchasePrice: 290000,
      sellingPrice: 335000,
      lowStockThreshold: 3,
    },
    {
      name: "Solitaire Diamond Look 18K Ring",
      category: "Ring",
      metal: "Gold",
      purity: "18K",
      size: "Size 14",
      weightPerPiece: 6.2,
      quantity: 12,
      purchasePrice: 38000,
      sellingPrice: 48000,
      lowStockThreshold: 4,
    },
    {
      name: "Antique Oxidized Silver Payal",
      category: "Payal",
      metal: "Silver",
      purity: "925",
      size: "10 inch",
      weightPerPiece: 65.0,
      quantity: 15,
      purchasePrice: 4800,
      sellingPrice: 6500,
      lowStockThreshold: 5,
    },
    {
      name: "Floral Drop 22K Gold Earrings",
      category: "Earring",
      metal: "Gold",
      purity: "22K",
      size: "Standard",
      weightPerPiece: 12.0,
      quantity: 1, // Low stock demo!
      purchasePrice: 78000,
      sellingPrice: 92000,
      lowStockThreshold: 3,
    },
    {
      name: "Sterling Silver Designer Bracelet",
      category: "Bracelet",
      metal: "Silver",
      purity: "925",
      size: "7.5 inch",
      weightPerPiece: 22.0,
      quantity: 10,
      purchasePrice: 1600,
      sellingPrice: 2400,
      lowStockThreshold: 3,
    },
  ];

  await Product.insertMany(products);
  console.log(`Seeded ${products.length} sample inventory products.`);

  await mongoose.disconnect();
  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
