"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  Gem,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductDialog } from "@/components/stock/product-dialog";
import { DeleteProductModal } from "@/components/stock/delete-product-modal";
import { productCategories, productMetals } from "@/lib/validators/product";

interface ProductTableProps {
  initialData: {
    products: Array<any>;
    total: number;
    page: number;
    totalPages: number;
  };
  userRole: "admin" | "staff";
}

export function ProductTable({ initialData, userRole }: ProductTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);

  // Client Filter states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [metalFilter, setMetalFilter] = useState("ALL");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isAdmin = userRole === "admin";

  // Filter products on client for fluid interactive UX
  let filtered = initialData.products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== "ALL" && p.category !== categoryFilter) {
      return false;
    }
    if (metalFilter !== "ALL" && p.metal !== metalFilter) {
      return false;
    }
    if (lowStockOnly && p.quantity > p.lowStockThreshold) {
      return false;
    }
    return true;
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (product: any) => {
    setDeletingProduct(product);
    setDeleteModalOpen(true);
  };

  const getMetalBadgeVariant = (metal: string) => {
    if (metal === "Gold") return "gold";
    if (metal === "Silver") return "silver";
    if (metal === "Platinum") return "platinum";
    return "default";
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 sm:p-4 shadow-sm backdrop-blur-md transition-colors duration-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search product name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[130px] sm:w-40"
            >
              <option value="ALL">All Categories</option>
              {productCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            {/* Metal Dropdown */}
            <Select
              value={metalFilter}
              onChange={(e) => {
                setMetalFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-[110px] sm:w-36"
            >
              <option value="ALL">All Metals</option>
              {productMetals.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>

            {/* Low Stock Toggle Button */}
            <Button
              variant={lowStockOnly ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setLowStockOnly(!lowStockOnly);
                setCurrentPage(1);
              }}
              className="h-10 text-xs font-semibold shrink-0"
            >
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{lowStockOnly ? "Showing Low Stock" : "Low Stock"}</span>
              <span className="sm:hidden">{lowStockOnly ? "Low" : "Low"}</span>
            </Button>
          </div>
        </div>

        {/* Add Product Button */}
        <div className="sm:self-end">
          <Button
            onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }}
            className="font-bold shadow-md w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add New Item
          </Button>
        </div>
      </div>

      {/* Stock Catalog */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-900/40 py-16 text-center">
          <div className="rounded-full bg-amber-100 dark:bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400 mb-3">
            <Gem className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">No Inventory Items Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Try adjusting your search keywords, metal, or category filters.
          </p>
          <Button
            onClick={() => {
              setSearch("");
              setCategoryFilter("ALL");
              setMetalFilter("ALL");
              setLowStockOnly(false);
            }}
            variant="outline"
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="space-y-3 lg:hidden">
            {paginated.map((product) => {
              const isLow = product.quantity <= product.lowStockThreshold;
              return (
                <div
                  key={product._id}
                  className="rounded-xl border border-amber-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/stock/${product._id}`}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 hover:underline text-sm block truncate"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant={getMetalBadgeVariant(product.metal) as any} className="text-[10px]">
                          {product.metal}
                        </Badge>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {product.purity}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          • {product.category}
                        </span>
                      </div>
                    </div>
                    <Badge variant={isLow ? "lowStock" : "inStock"} className="shrink-0">
                      {product.quantity} pc(s)
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Selling Price</span>
                      <p className="text-base font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Weight</span>
                      <p className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {product.weightPerPiece} g
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Cost</span>
                        <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                          {formatCurrency(product.purchasePrice)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1 border-t border-amber-100 dark:border-slate-800 pt-2">
                    <Link href={`/stock/${product._id}`}>
                      <Button variant="ghost" size="icon" title="View Details" className="h-8 w-8">
                        <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      title="Edit Item"
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product)}
                        title="Delete Item"
                        className="h-8 w-8 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Metal / Purity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Total Weight (g)</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Selling Price</TableHead>
                  {isAdmin && <TableHead>Cost Price</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((product) => {
                  const isLow = product.quantity <= product.lowStockThreshold;

                  return (
                    <TableRow key={product._id}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        <Link
                          href={`/stock/${product._id}`}
                          className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-2"
                        >
                          {product.name}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={getMetalBadgeVariant(product.metal) as any}>
                            {product.metal}
                          </Badge>
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                            {product.purity}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-700 dark:text-slate-300">
                        {product.category}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {product.weightPerPiece} g
                      </TableCell>

                      <TableCell>
                        <Badge variant={isLow ? "lowStock" : "inStock"}>
                          {product.quantity} pc(s) {isLow ? " (Low)" : ""}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-bold text-amber-700 dark:text-amber-400">
                        {formatCurrency(product.sellingPrice)}
                      </TableCell>

                      {isAdmin && (
                        <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {formatCurrency(product.purchasePrice)}
                        </TableCell>
                      )}

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/stock/${product._id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Details"
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            title="Edit Item"
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400" />
                          </Button>

                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product)}
                              title="Delete Item"
                              className="h-8 w-8 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-4 w-4 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row items-center justify-between pt-4 border-t border-amber-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-900 dark:text-slate-200">{currentPage}</strong> of{" "}
            <strong className="text-slate-900 dark:text-slate-200">{totalPages}</strong> ({filtered.length} items)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Product Dialog (Add / Edit) */}
      <ProductDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={editingProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        product={deletingProduct}
      />
    </div>
  );
}
