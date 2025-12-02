"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth, type AuthState } from "@/store/auth";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";
import FileUpload from "@/components/ui/FileUpload";

type Category = { id: string; name: string };

export default function NewProductPage() {
  const router = useRouter();
  const token = useAuth((s: AuthState) => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

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
    
    api.get("/api/categories").then((res) => {
      setCategories(res.data.categories);
      if (res.data.categories.length > 0) {
        setCategoryId(res.data.categories[0].id);
      }
    });
  }, [router, token]);

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

  const [createModal, setCreateModal] = useState(false);

  function openCreateModal(e: React.FormEvent) {
    e.preventDefault();
    setCreateModal(true);
  }

  async function confirmCreate() {
    setLoading(true);

    try {
      // Convert specs array to object
      const specifications = specs.reduce((acc, curr) => {
        if (curr.key.trim()) {
          acc[curr.key.trim()] = curr.value;
        }
        return acc;
      }, {} as Record<string, string>);

      await api.post("/api/products", {
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
      alert("Failed to create product");
      console.error(err);
    } finally {
      setLoading(false);
      setCreateModal(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/admin/products" 
          className="rounded-xl glass-card p-3 hover:bg-white/10 transition-all border border-white/10 hover:border-web3-accent-cyan/30 group"
        >
          <ArrowLeft className="h-6 w-6 text-web3-text-secondary group-hover:text-web3-accent-cyan transition-colors" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Add New Product</h1>
          <p className="text-web3-text-secondary mt-1">Create a new product in your inventory</p>
        </div>
      </div>

      <form onSubmit={openCreateModal} className="space-y-6 glass-card rounded-2xl border border-white/10 p-8">
        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-bold text-web3-text-primary mb-4 pb-3 border-b border-white/10">
            Basic Information
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-web3-text-primary">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-web3-text-primary">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                style={{
                  colorScheme: 'dark'
                }}
              >
                {categories.map((c) => (
                  <option 
                    key={c.id} 
                    value={c.id}
                    style={{
                      backgroundColor: '#0a1628',
                      color: '#ffffff'
                    }}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-web3-text-primary">
                Price (IDR) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={price || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setPrice(value ? Number(value) : 0);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-web3-text-primary">
                Stock <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={stock || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setStock(value ? Number(value) : 0);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <h2 className="text-xl font-bold text-web3-text-primary mb-4 pb-3 border-b border-white/10">
            Product Image
          </h2>
          <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Product Image</label>
          <FileUpload onUpload={setImageUrl} defaultUrl={imageUrl} />
          <p className="mt-2 text-xs text-web3-text-muted">Supported formats: JPG, PNG, GIF</p>
        </div>

        {/* Specifications */}
        <div>
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-xl font-bold text-web3-text-primary">Specifications</h2>
            <button
              type="button"
              onClick={addSpec}
              className="flex items-center gap-2 text-sm font-semibold text-web3-accent-cyan hover:text-web3-accent-purple transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Field
            </button>
          </div>
          <div className="space-y-3">
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-3 items-center glass-card rounded-xl p-3 border border-white/5">
                <input
                  type="text"
                  placeholder="Key (e.g. Rod)"
                  value={spec.key}
                  onChange={(e) => updateSpec(index, "key", e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Ares Rod)"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeSpec(index)}
                  className="rounded-xl p-2.5 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded border-white/10 bg-white/5 text-web3-accent-cyan focus:ring-2 focus:ring-web3-accent-cyan/20"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-web3-text-primary cursor-pointer">
              Product is active (Visible in store)
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
          <Link
            href="/admin/products"
            className="rounded-xl px-6 py-3 text-web3-text-secondary hover:bg-white/5 hover:text-white transition-all border border-white/10 font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan px-8 py-3 font-bold text-white hover:scale-105 transition-all border-2 border-web3-accent-green/50 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-glow-green"
          >
            {!loading && (
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            )}
            <Save className="h-5 w-5 relative z-10" />
            <span className="relative z-10">
              {loading ? "Creating..." : "Create Product"}
            </span>
          </button>
        </div>
      </form>
      {/* Create Confirmation Modal */}
      {createModal && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl border-2 border-white/10 animate-slide-up relative">
              <h2 className="mb-4 text-2xl font-bold gradient-text">Confirm Creation</h2>
              <p className="mb-6 text-web3-text-secondary">
                Are you sure you want to create product <strong className="text-white">"{name}"</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCreateModal(false)}
                  className="rounded-xl px-6 py-3 text-web3-text-secondary hover:bg-white/5 hover:text-white transition-all border border-white/10 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCreate}
                  disabled={loading}
                  className="rounded-xl px-6 py-3 font-bold text-white transition-all hover:scale-105 bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan border-2 border-web3-accent-green/50 hover:shadow-glow-green disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Confirm Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
