"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth, type AuthState } from "@/store/auth";
import { Plus, Pencil, Trash2, X, Save, Search, ImageIcon } from "lucide-react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import FileUpload from "@/components/ui/FileUpload";
import SellerSelector from "@/components/admin/SellerSelector";
import { useToast } from "@/components/ui/Toast";
type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: { name: string; id: string; slug: string } | null;
  is_active: boolean;
  is_banned: boolean; // Added
  seller?: { id: string; username: string }; // Added
  image_url?: string;
  specifications?: Record<string, unknown>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

function formatIDR(n: number) {
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

export default function ProductsPage() {
  const router = useRouter();
  const token = useAuth((s: AuthState) => s.token);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();
  
  // Modal States
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
    isOpen: false,
    productId: null,
    productName: ""
  });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedProductForBan, setSelectedProductForBan] = useState<Product | null>(null);
  const [banError, setBanError] = useState<string | null>(null);

  // Filter State
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(p =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    stock: 0,
    category_id: "",
    is_active: true,
    image_url: "",
  });
  
  const [editSpecs, setEditSpecs] = useState<{ key: string; value: string }[]>([]);

  const user = useAuth((s: AuthState) => s.user);
  const fetchUser = useAuth((s: AuthState) => s.fetchUser);

  useEffect(() => {
    const localToken = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    
    // 1. Redirect if absolutely no token
    if (!token && !localToken) {
      router.replace("/admin/login");
      return;
    }
    
    // 2. Hydrate token if needed
    if (!token && localToken) {
       useAuth.getState().setToken(localToken);
    }
    
    // 3. Hydrate user if needed, OR wait for it
    if (!user) {
        fetchUser();
    }
  }, [token, user, fetchUser, router]);

  // Separate effect for loading data that DEPENDS on user
  useEffect(() => {
      if (user) {
          load();
          if (categories.length === 0) loadCategories();
      }
  }, [user, selectedSellerId]); // Run when user readies OR admin changes filter

  async function load() {
    if (!user) return;
    try {
      let endpoint = "/api/admin/products";
      
      if (user.role === 'seller') {
          endpoint = "/api/products/my-products";
      } else if (user.role === 'admin' && selectedSellerId) {
          endpoint = `/api/admin/products?seller_id=${selectedSellerId}`;
      }
      
      const res = await api.get(endpoint);
      setProducts(res.data.products);
    } catch(e: any) {
        if (e.response && e.response.status === 403) {
            // Should not happen if logic is correct, but safe fallback
             console.error("Access forbidden to endpoint");
        }
        console.error("Failed to load products", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  function openDeleteModal(id: string, name: string) {
    setDeleteModal({ isOpen: true, productId: id, productName: name });
  }

  function closeDeleteModal() {
    setDeleteModal({ isOpen: false, productId: null, productName: "" });
  }

  async function confirmDelete() {
    if (!deleteModal.productId) return;
    try {
      await api.delete(`/api/products/${deleteModal.productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteModal.productId));
      closeDeleteModal();
      toast.success("Product Deleted", `"${deleteModal.productName}" has been deleted.`);
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Delete Failed", "Failed to delete product. Please try again.");
    }
  }

  function openEditModal(product?: Product) {
    if (product) {
        setEditingProduct(product);
        setEditForm({
          name: product.name,
          price: product.price,
          stock: product.stock,
          category_id: product.category?.id || (product.category as any)?._id || "",
          is_active: product.is_active ?? true,
          image_url: product.image_url || "",
        });
        
        // Convert specifications
        const specsArray = product.specifications 
          ? Object.entries(product.specifications).map(([key, value]) => ({
              key,
              value: String(value)
            }))
          : [{ key: "", value: "" }];
        setEditSpecs(specsArray);
    } else {
        setEditingProduct(null);
        setEditForm({
            name: "",
            price: 0,
            stock: 0,
            category_id: "",
            is_active: true,
            image_url: "",
        });
        setEditSpecs([{ key: "", value: "" }]);
    }
    setIsEditModalOpen(true);
  }

  function closeEditModal() {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setEditSpecs([]);
  }

  function addEditSpec() {
    setEditSpecs([...editSpecs, { key: "", value: "" }]);
  }

  function removeEditSpec(index: number) {
    setEditSpecs(editSpecs.filter((_, i) => i !== index));
  }

  function updateEditSpec(index: number, field: "key" | "value", val: string) {
    const newSpecs = [...editSpecs];
    newSpecs[index][field] = val;
    setEditSpecs(newSpecs);
  }

  const [saveModal, setSaveModal] = useState(false);

  function openSaveModal() {
    // Validation
    if (!editForm.name || !editForm.price || !editForm.category_id) {
        toast.warning("Validation Error", "Name, Price, and Category are required");
        return;
    }
    setSaveModal(true);
  }

  async function confirmSave() {
    try {
      // Convert specs array to object
      const specifications = editSpecs.reduce((acc, curr) => {
        if (curr.key.trim()) {
          acc[curr.key.trim()] = curr.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const updateData = {
        ...editForm,
        specifications
      };

      if (editingProduct) {
        // Update existing product
        await api.put(`/api/products/${editingProduct.id}`, updateData);
        setProducts((prev) =>
          prev.map((p) => 
            p.id === editingProduct.id 
              ? { 
                  ...p, 
                  ...editForm, 
                  specifications,
                  category: categories.find(c => c.id === editForm.category_id) || null 
                } 
              : p
          )
        );
      } else {
        // Create new product
        const res = await api.post("/api/products", updateData);
        // Fix: Include the form data (updateData) so the UI has name, price, etc.
        setProducts((prev) => [...prev, {
            id: res.data.id,
            ...updateData,
            category: categories.find(c => c.id === editForm.category_id) || null,
            is_banned: false,
            seller: user ? { id: user.id, username: user.username } : undefined
        }]);
      }
      
      setSaveModal(false);
      closeEditModal();
      toast.success("Product Saved", `"${editForm.name}" has been saved successfully.`);
    } catch (error: any) {
      console.error("Failed to save product:", error);
      toast.error("Save Failed", error.response?.data?.error || "Failed to save product. Please try again.");
    }
  }

  // Admin: Open Ban Modal
  function openBanModal(product: Product) {
      setSelectedProductForBan(product);
      setIsBanModalOpen(true);
      setBanError(null);
  }

  function closeBanModal() {
      setIsBanModalOpen(false);
      setSelectedProductForBan(null);
      setBanError(null);
  }

  // Admin: Confirm Ban/Unban
  async function toggleBan() { // Renamed from confirmBan
      if (!selectedProductForBan) return;
      
      const product = selectedProductForBan;
      const newBanStatus = !product.is_banned;
      
      console.log("Confirming Ban:", { id: product.id, newStatus: newBanStatus });

      try {
          // Fix: Use the standard update endpoint, not /ban
          const res = await api.put(`/api/products/${product.id}`, { is_banned: newBanStatus });
          console.log("Ban response:", res.data);
          setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_banned: res.data.is_banned, is_active: res.data.is_banned ? false : p.is_active } : p));
          closeBanModal();
      } catch (error: any) {
          console.error("Ban Error:", error);
          setBanError(error.response?.data?.error || "Failed to update ban status");
      }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <AdminSidebar />
        <main className="space-y-6"> {/* Added space-y-6 here */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Product Manager</h1>
              <p className="text-web3-text-secondary">Manage your product inventory</p>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                 <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-web3-text-muted group-focus-within:text-web3-accent-cyan transition-colors" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64 rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-web3-accent-cyan focus:ring-1 focus:ring-web3-accent-cyan/20 transition-all placeholder:text-web3-text-muted"
                    />
                 </div>

                 {user?.role === 'admin' && (
                     <SellerSelector selectedSellerId={selectedSellerId} onSelect={setSelectedSellerId} label="Filter by Seller" />
                 )}

                 {user?.role === 'seller' && (
                    <button
                    onClick={() => openEditModal()} // Call openEditModal without product for "Add"
                    className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-web3-accent-cyan to-web3-accent-purple px-6 py-3 font-bold text-white hover:scale-105 transition-all border-2 border-web3-accent-cyan/50 overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                      <Plus className="h-5 w-5 relative z-10" />
                      <span className="relative z-10">Add Product</span>
                    </button>
                 )}
            </div>
          </div>

          {loading ? (
            <div className="text-web3-text-secondary">Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-web3-accent-cyan/10 to-web3-accent-purple/10 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan w-16">Img</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Name</th>
                      {user?.role === 'admin' && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Seller</th>}
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Category</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Price</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Stock</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Specifications</th>
                      <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Status</th>
                      <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide text-web3-accent-cyan">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-web3-text-muted" />
                                )}
                            </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-web3-text-primary">{p.name}</td>
                        {user?.role === 'admin' && <td className="px-4 py-4 text-web3-text-secondary">{p.seller?.username || 'Unknown'}</td>}
                        <td className="px-4 py-4 text-web3-text-secondary">{p.category?.name || "-"}</td>
                        <td className="px-4 py-4 gradient-text font-bold">{formatIDR(p.price)}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-xl px-3 py-1.5 text-xs font-bold border-2 ${
                            p.stock > 0 
                              ? 'bg-web3-accent-green/20 text-web3-accent-green border-web3-accent-green' 
                              : 'bg-red-500/20 text-red-400 border-red-500'
                          }`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.specifications && Object.keys(p.specifications).length > 0 ? (
                              Object.entries(p.specifications).slice(0, 3).map(([key, value]) => (
                                <span 
                                  key={key}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-web3-accent-purple/10 text-web3-accent-purple text-xs border border-web3-accent-purple/20"
                                >
                                  <span className="font-semibold">{key}:</span>
                                  <span className="text-white">{String(value)}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-web3-text-muted text-xs">No specs</span>
                            )}
                            {p.specifications && Object.keys(p.specifications).length > 3 && (
                              <span className="text-web3-text-muted text-xs">+{Object.keys(p.specifications).length - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {p.is_banned ? (
                             <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/30">BANNED</span>
                          ) : p.is_active ? (
                            <span className="text-web3-accent-green font-semibold">Active</span>
                          ) : (
                            <span className="text-red-400 font-semibold">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {user?.role === 'admin' ? (
                                <button 
                                  onClick={() => openBanModal(p)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                      p.is_banned 
                                      ? 'bg-web3-accent-green/20 text-web3-accent-green border-web3-accent-green hover:bg-web3-accent-green/30' 
                                      : 'bg-red-500/20 text-red-500 border-red-500 hover:bg-red-500/30'
                                  }`}
                                >
                                    {p.is_banned ? 'UNBAN' : 'BAN'}
                                </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditModal(p)}
                                  className="rounded-xl p-2.5 text-web3-accent-cyan hover:bg-web3-accent-cyan/10 border border-transparent hover:border-web3-accent-cyan/30 transition-all hover:scale-110"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(p.id, p.name)}
                                  className="rounded-xl p-2.5 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all hover:scale-110"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                        <tr>
                            <td colSpan={user?.role === 'admin' ? 9 : 8} className="p-8 text-center text-web3-text-muted">
                                {searchTerm ? 'No products found matching your search.' : 'No products found.'}
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl border-2 border-white/10 animate-slide-up relative">
              <h2 className="mb-4 text-2xl font-bold gradient-text">Confirm Delete</h2>
            <p className="mb-6 text-web3-text-secondary">
              Are you sure you want to delete <strong className="text-white">"{deleteModal.productName}"</strong>?
              <br />
              <span className="text-red-400 font-semibold mt-2 block">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="rounded-xl px-6 py-3 text-web3-text-secondary hover:bg-white/5 hover:text-white transition-all border border-white/10 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete()}
                className="rounded-xl px-6 py-3 font-bold text-white transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Edit/Add Product Modal (Refactored) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-3xl glass-card rounded-2xl p-8 shadow-2xl border-2 border-white/10 animate-slide-up relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button
                onClick={closeEditModal}
                className="rounded-xl p-2 text-web3-text-secondary hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Product Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Price (IDR)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditForm({ ...editForm, price: value ? Number(value) : 0 });
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Stock</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.stock}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditForm({ ...editForm, stock: value ? Number(value) : 0 });
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Category</label>
                <select
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                  style={{
                    colorScheme: 'dark'
                  }}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option 
                      key={cat.id} 
                      value={cat.id}
                      style={{
                        backgroundColor: '#0a1628',
                        color: '#ffffff'
                      }}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-web3-text-primary">Product Image</label>
                <FileUpload 
                  onUpload={(url) => setEditForm({ ...editForm, image_url: url })} 
                  defaultUrl={editForm.image_url} 
                />
              </div>

              {/* Specifications Section */}
              <div>
                <div className="mb-3 flex items-center justify-between pb-3 border-b border-white/10">
                  <label className="text-sm font-semibold text-web3-text-primary">Specifications</label>
                  <button
                    type="button"
                    onClick={addEditSpec}
                    className="flex items-center gap-1 text-sm font-semibold text-web3-accent-cyan hover:text-web3-accent-purple transition-colors"
                  >
                    <Plus className="h-4 w-4" /> Add Field
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {editSpecs.map((spec, index) => (
                    <div key={index} className="flex gap-3 items-center glass-card rounded-xl p-3 border border-white/5">
                      <input
                        type="text"
                        placeholder="Key (e.g. Rod)"
                        value={spec.key}
                        onChange={(e) => updateEditSpec(index, "key", e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Ares Rod)"
                        value={spec.value}
                        onChange={(e) => updateEditSpec(index, "value", e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-web3-text-muted focus:border-web3-accent-cyan focus:outline-none focus:ring-2 focus:ring-web3-accent-cyan/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeEditSpec(index)}
                        className="rounded-xl p-2 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="h-5 w-5 rounded border-white/10 bg-white/5 text-web3-accent-cyan focus:ring-2 focus:ring-web3-accent-cyan/20"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-web3-text-primary cursor-pointer">
                  Product is active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={closeEditModal}
                className="rounded-xl px-6 py-3 text-web3-text-secondary hover:bg-white/5 hover:text-white transition-all border border-white/10 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={openSaveModal}
                className="relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan px-6 py-3 font-bold text-white hover:scale-105 transition-all border-2 border-web3-accent-green/50 overflow-hidden group hover:shadow-glow-green"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <Save className="h-5 w-5 relative z-10" />
                <span className="relative z-10">Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Save Confirmation Modal */}
      {saveModal && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl border-2 border-white/10 animate-slide-up relative">
              <h2 className="mb-4 text-2xl font-bold gradient-text">Confirm Save</h2>
              <p className="mb-6 text-web3-text-secondary">
                Are you sure you want to save changes to <strong className="text-white">"{editingProduct?.name || editForm.name}"</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSaveModal(false)}
                  className="rounded-xl px-6 py-3 text-web3-text-secondary hover:bg-white/5 hover:text-white transition-all border border-white/10 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  className="rounded-xl px-6 py-3 font-bold text-white transition-all hover:scale-105 bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan border-2 border-web3-accent-green/50 hover:shadow-glow-green"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Ban Confirmation Modal */}
      {isBanModalOpen && selectedProductForBan && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/70 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={`w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl border-2 animate-slide-up relative ${selectedProductForBan.is_banned ? 'border-web3-accent-green/30' : 'border-red-500/30'}`}>
                    <h2 className="mb-4 text-2xl font-bold gradient-text">
                        {selectedProductForBan.is_banned ? 'Confirm Unban' : 'Confirm Ban'}
                    </h2>
                    <p className="mb-6 text-web3-text-secondary">
                        Are you sure you want to <strong>{selectedProductForBan.is_banned ? 'UNBAN' : 'BAN'}</strong> <strong className="text-white">"{selectedProductForBan.name}"</strong>?
                        <br />
                        <span className={`font-semibold mt-2 block ${selectedProductForBan.is_banned ? 'text-web3-accent-green' : 'text-red-400'}`}>
                            {selectedProductForBan.is_banned 
                                ? 'The seller will regain access to manage this product.' 
                                : 'This product will be deactivated and verified as banned. The seller will lose access.'}
                        </span>
                    </p>
                    
                    {banError && (
                        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono break-all whitespace-pre-wrap">
                            {banError}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeBanModal}
                            className="rounded-xl px-6 py-3 text-web3-text-secondary hover:bg-white/5 hover:text-white transition-all border border-white/10 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={toggleBan}
                            className={`rounded-xl px-6 py-3 font-bold text-white transition-all hover:scale-105 border-2 shadow-lg ${
                                selectedProductForBan.is_banned
                                ? 'bg-gradient-to-r from-web3-accent-green to-emerald-600 border-web3-accent-green/50 hover:shadow-glow-green'
                                : 'bg-gradient-to-r from-red-600 to-red-700 border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                            }`}
                        >
                            {selectedProductForBan.is_banned ? 'Confirm Unban' : 'Confirm Ban'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
