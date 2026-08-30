"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/actions/stock";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    _id: string;
    name: string;
  } | null;
  onDeleted?: () => void;
}

export function DeleteProductModal({
  isOpen,
  onClose,
  product,
  onDeleted,
}: DeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteProduct(product._id);
      if (res.success) {
        toast.success(`Deleted "${product.name}" from inventory.`);
        onClose();
        if (onDeleted) onDeleted();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Product Deletion"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300">
          <AlertTriangle className="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" />
          <p className="text-sm">
            Are you sure you want to permanently delete{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-bold">&quot;{product.name}&quot;</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="font-bold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              "Yes, Delete Item"
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
