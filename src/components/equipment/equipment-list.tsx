"use client";

import { useState, useTransition } from "react";
import { EquipmentSummary, EquipmentFormInput, createEquipment, deleteEquipment, updateEquipment } from "@/actions/equipment";
import { formatDate } from "@/lib/utils";
import type { EquipmentType, EquipmentOwnership, EquipmentCondition } from "@/models/Equipment";
import {
  Camera, Plus, AlertTriangle, CheckCircle2,
  Wrench, Trash2, Calendar, Search, Loader2,
  ShieldCheck, ShieldAlert, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EquipmentListProps {
  initialEquipment: EquipmentSummary[];
  initialServiceDueCount: number;
}

const CONDITION_BADGES: Record<string, { label: string; class: string }> = {
  good: { label: "Good", class: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300" },
  needs_service: { label: "Needs Service", class: "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300" },
  in_repair: { label: "In Repair", class: "bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-300" },
  retired: { label: "Retired", class: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300" },
};

export function EquipmentList({ initialEquipment, initialServiceDueCount }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<EquipmentSummary[]>(initialEquipment);
  const [serviceDueCount, setServiceDueCount] = useState(initialServiceDueCount);
  const [filterOwnership, setFilterOwnership] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<EquipmentFormInput>({
    name: "",
    type: "camera",
    ownership: "owned",
    purchaseDate: "",
    rentalExpiryDate: "",
    serviceNextDue: "",
    condition: "good",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = equipment.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase());
    const matchesOwnership = filterOwnership === "all" || item.ownership === filterOwnership;
    return matchesSearch && matchesOwnership;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Equipment name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createEquipment(formData);
      if (res.success) {
        toast.success("Equipment item added!");
        setIsModalOpen(false);
        setFormData({
          name: "",
          type: "camera",
          ownership: "owned",
          purchaseDate: "",
          rentalExpiryDate: "",
          serviceNextDue: "",
          condition: "good",
          notes: "",
        });
        // Refresh
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to add equipment");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    startTransition(async () => {
      const res = await deleteEquipment(id);
      if (res.success) {
        toast.success("Equipment deleted");
        setEquipment((prev) => prev.filter((e) => e._id !== id));
      } else {
        toast.error(res.error || "Failed to delete");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-violet-200/80 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-violet-700 dark:text-violet-400">
            Camera Studio — Equipment Tracker
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track cameras, lenses, lighting kits, drones, and service maintenance schedules.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="font-semibold text-xs sm:text-sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Equipment
        </Button>
      </div>

      {/* Service Due Alert Banner */}
      {serviceDueCount > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                {serviceDueCount} equipment item(s) require service soon
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Scheduled service or rental expiry is due within the next 30 days.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search gear..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["all", "owned", "rented"].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilterOwnership(opt)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filterOwnership === opt
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Cards Grid */}
      {filtered.length === 0 ? (
        <Card className="py-12 text-center border-dashed">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Camera className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No equipment recorded</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Add your cameras, lenses, drones, and lighting inventory to keep track of maintenance and rentals.
            </p>
            <Button size="sm" onClick={() => setIsModalOpen(true)} className="mt-2 text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add First Gear
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const cond = CONDITION_BADGES[item.condition] || CONDITION_BADGES.good;

            return (
              <Card key={item._id} className="relative hover:shadow-md transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5 capitalize flex items-center gap-1.5 text-slate-500">
                        <Tag className="h-3 w-3 shrink-0" />
                        <span>{item.type.replace("_", " ")}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] font-semibold border ${cond.class}`}>
                      {cond.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2">
                    <span className="text-slate-400">Ownership:</span>
                    <span className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {item.ownership}
                    </span>
                  </div>

                  {item.serviceNextDue && (
                    <div className={`flex items-center justify-between rounded p-1.5 text-[11px] ${
                      item.isServiceDueSoon
                        ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                        : "text-slate-500"
                    }`}>
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" /> Next Service:
                      </span>
                      <span>{formatDate(item.serviceNextDue)}</span>
                    </div>
                  )}

                  {item.rentalExpiryDate && (
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Rental Ends:
                      </span>
                      <span>{formatDate(item.rentalExpiryDate)}</span>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-slate-400 italic pt-1 truncate">
                      {item.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => handleDelete(item._id, item.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                      title="Delete equipment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Equipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Add Equipment Item
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Item Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Sony Alpha A7 IV"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EquipmentType })}
                  >
                    <option value="camera">Camera Body</option>
                    <option value="lens">Lens</option>
                    <option value="lighting">Lighting Kit</option>
                    <option value="drone">Drone</option>
                    <option value="audio">Audio / Mic</option>
                    <option value="tripod_stabilizer">Tripod / Gimbal</option>
                    <option value="backdrop_props">Props / Backdrop</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Ownership
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    value={formData.ownership}
                    onChange={(e) => setFormData({ ...formData, ownership: e.target.value as EquipmentOwnership })}
                  >
                    <option value="owned">Owned</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Next Service Due
                  </label>
                  <Input
                    type="date"
                    value={formData.serviceNextDue || ""}
                    onChange={(e) => setFormData({ ...formData, serviceNextDue: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Condition
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as EquipmentCondition })}
                  >
                    <option value="good">Good</option>
                    <option value="needs_service">Needs Service</option>
                    <option value="in_repair">In Repair</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              {formData.ownership === "rented" && (
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Rental Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={formData.rentalExpiryDate || ""}
                    onChange={(e) => setFormData({ ...formData, rentalExpiryDate: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <Input
                  placeholder="Serial number, accessories, warranty info..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Save Equipment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

