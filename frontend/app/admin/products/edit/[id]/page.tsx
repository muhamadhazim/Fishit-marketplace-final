"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth, type AuthState } from "@/store/auth";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type Category = { id: string; name: string };

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const token = useAuth((s: AuthState) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  
  // Specs State (Key-Value pairs)
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (!token && !localToken) {
      router.replace("/admin/login");
      return;
    }

    async function load() {
      try {
        const resolvedParams = await params;
        setProductId(resolvedParams.id);
        
        const [catRes, prodRes] = await Promise.all([
          api.get("/api/categories"),
          api.get(`/api/products/${resolvedParams.id}`)
        ]);

        setCategories(catRes.data.categories);
        
        const p = prodRes.data;
        setName(p.name);
        setPrice(p.price);
        setStock(p.stock || 0);
        setCategoryId(p.category?.id || (catRes.data.categories[0]?.id || ""));
        setImageUrl(p.image_url);
        setIsActive(p.is_active !== false); // Default true if undefined

        // Convert specs object to array
        if (p.specifications) {
          const specArray = Object.entries(p.specifications).map(([key, value]) => ({
            key,
            value: String(value),
          }));
          setSpecs(specArray.length > 0 ? specArray : [{ key: "", value: "" }]);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load product");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, token, params]);

  function addSpec() {
    setSpecs([...specs, { key: "", value: "" }]);
  }

  function removeSpec(index: number) {
    setSpecs(specs.filter((_, i) => i !== index));
  }

  function updateSpec(index: number, field: "key" | "value", val: string) {
    const newSpecs = [...specs];
    newSpecs[index][field] = val;
    setSpecs(newSpecs);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert specs array to object
      const specifications = specs.reduce((acc, curr) => {
        if (curr.key.trim()) {
          acc[curr.key.trim()] = curr.value;
        }
        return acc;
      }, {} as Record<string, string>);

      await api.put(`/api/products/${productId}`, {
        name,
        price,
        stock,
        category_id: categoryId,
        image_url: imageUrl,
        is_active: isActive,
        specifications,
      });

      router.push("/admin/products");
    } catch (err) {
      alert("Failed to update product");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/products" className="rounded-full bg-slate-800 p-2 hover:bg-slate-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded bg-slate-900 p-2 text-white border border-slate-700 focus:border-mythicGold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded bg-slate-900 p-2 text-white border border-slate-700 focus:border-mythicGold focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400">Price (IDR)</label>
            <input
              type="number"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded bg-slate-900 p-2 text-white border border-slate-700 focus:border-mythicGold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400">Stock</label>
            <input
              type="number"
              required
              min="0"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full rounded bg-slate-900 p-2 text-white border border-slate-700 focus:border-mythicGold focus:outline-none"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded bg-slate-900 p-2 text-white border border-slate-700 focus:border-mythicGold focus:outline-none"
          />
        </div>

        {/* Specifications */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-400">Specifications</label>
            <button
              type="button"
              onClick={addSpec}
              className="flex items-center gap-1 text-xs text-mythicGold hover:underline"
            >
              <Plus className="h-3 w-3" /> Add Field
            </button>
          </div>
          <div className="space-y-2">
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Level)"
                  value={spec.key}
                  onChange={(e) => updateSpec(index, "key", e.target.value)}
                  className="flex-1 rounded bg-slate-900 p-2 text-sm text-white border border-slate-700 focus:border-mythicGold focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 50)"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  className="flex-1 rounded bg-slate-900 p-2 text-sm text-white border border-slate-700 focus:border-mythicGold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(index)}
                  className="rounded p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-mythicGold focus:ring-mythicGold"
          />
          <label htmlFor="isActive" className="text-sm text-white">
            Active (Visible in store)
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-roblox-green px-6 py-2 font-bold text-white hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
