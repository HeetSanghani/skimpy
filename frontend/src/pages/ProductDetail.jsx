import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchProductById, deleteProduct, updateProduct, updateVariant, deleteVariant } from "../api/settingsApi";
import axios from "axios";
import { useConfirmation } from "../context/ConfirmationContext";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../api/baseUrl";

// --- PRESET ATTRIBUTE DEFINITIONS (same as ProductListingForm) ---
const CLOTHING_KEYWORDS = [
  "clothes", "clothing", "t-shirt", "shirt", "jeans", "trousers", "pants",
  "dress", "skirt", "shorts", "jacket", "coat", "sweater", "hoodie",
  "kurta", "suit", "blazer", "top"
];

const BOOK_KEYWORDS = ["book", "books", "novel", "comics", "magazine", "textbook", "encyclopedia"];
const BASE_URL = API_BASE_URL;

const CLOTHING_ATTRIBUTES = [
  { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL"] },
  { name: "Color", values: ["Black", "White", "Gray", "Blue", "Navy Blue", "Red", "Green", "Beige", "Brown", "Maroon"] },
  { name: "Fabric", values: ["Cotton", "Polyester", "Linen", "Denim", "Blend"] },
  { name: "Fit", values: ["Regular", "Slim", "Oversized", "Relaxed"] },
  { name: "Pattern", values: ["Solid", "Striped", "Checked", "Printed"] },
  { name: "Sleeve Type", values: ["Half Sleeve", "Full Sleeve", "Sleeveless"] },
  { name: "Neck/Collar Type", values: ["Round Neck", "V-Neck", "Collared"] },
];

const BOOK_ATTRIBUTES = [
  { name: "Language", values: ["English", "Hindi", "Gujarati", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Urdu"] },
  { name: "Condition", values: ["New", "Like New", "Very Good", "Good", "Acceptable", "Old"] },
  { name: "Edition", values: ["1st Edition", "2nd Edition", "3rd Edition", "Revised Edition", "Special Edition"] },
  { name: "Publication Year", values: ["2025", "2024", "2023", "2022", "2021", "2020", "2015-2019", "Before 2015"] },
];

function isClothingCategory(category) {
  const name = (category?.category_name || category?.name || "").toLowerCase();
  return CLOTHING_KEYWORDS.some(k => name.includes(k));
}

function isBookCategory(category) {
  const name = (category?.category_name || category?.name || "").toLowerCase();
  return BOOK_KEYWORDS.some(k => name.includes(k));
}

// Styles
const inputCls = "w-full bg-white/5 border border-white/15 text-gray-200 placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
const labelCls = "block text-sm font-semibold text-gray-400 mb-2";
const cardCls = "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6";
const btnPrimary = "px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105";
const btnSecondary = "px-6 py-2.5 border border-white/15 text-gray-300 font-semibold rounded-xl hover:bg-white/5 hover:text-white transition-all";
const btnDanger = "px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all";

const getVariantId = (v) => String(v?.id ?? v?._id ?? "");


export default function ProductDetail() {
  const { productId } = useParams();

  const navigate = useNavigate();
  const { showConfirm } = useConfirmation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Variants + Attributes
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [allAttributeValues, setAllAttributeValues] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  const [editingVariantId, setEditingVariantId] = useState(null);
  const [variantForm, setVariantForm] = useState({ price: "", stock: "", sku: "", description: "", product_condition: "NEW", selectedAttributes: {} });

  const [showAddVariant, setShowAddVariant] = useState(false);
  const [addVariantForm, setAddVariantForm] = useState({ sku: "", price: "", stock: "", description: "", product_condition: "NEW", selectedAttributes: {} });
  const [creatingVariant, setCreatingVariant] = useState(false);

  const [editForm, setEditForm] = useState({});
  const [editMode, setEditMode] = useState(false);

  // New Image Upload State
  const [newImages, setNewImages] = useState([]);
  const [previewNewImages, setPreviewNewImages] = useState([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false); // Make sure this is used or remove if unused warning/error

  const toggleDeleteImage = (imgUrl) => {
    if (deletedImageUrls.includes(imgUrl)) {
      setDeletedImageUrls((prev) => prev.filter((u) => u !== imgUrl));
    } else {
      setDeletedImageUrls((prev) => [...prev, imgUrl]);
    }
  };

  // Variant Edit State (already defined above but ensuring usage)
  // const [editingVariantId, setEditingVariantId] = useState(null);
  // const [variantForm, setVariantForm] = useState({ price: "", stock: "", selectedAttributes: {} });

  // --- Helpers ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeProductToForm = (p) => ({
    product_name: p?.product_name ?? p?.name ?? "",
    description: p?.description ?? "",
    brand: p?.brand ?? p?.manufacturer ?? "",
    price: p?.price ?? "",
    stock: p?.stock ?? "",
    product_condition: p?.product_condition ?? p?.condition ?? "NEW",
    images: p?.images ?? p?.images_list ?? []
  });

  // --- Image Handlers ---
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    setNewImages(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewNewImages(prev => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setPreviewNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  // --- Variant Handlers ---
  const startEditingVariant = (variant) => {
    setEditingVariantId(variant.id || variant._id);
    setVariantForm({
      price: variant.price,
      stock: variant.stock,
      sku: variant.sku || "",
      description: variant.description || "",
      product_condition: variant.product_condition || "NEW",
    });
  };

  const cancelEditingVariant = () => {
    setEditingVariantId(null);
    setVariantForm({ price: "", stock: "", sku: "", description: "", product_condition: "NEW", selectedAttributes: {} });
  };

  const handleVariantFormChange = (e) => {
    const { name, value } = e.target;
    setVariantForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVariantChange = (e) => {
    const { name, value } = e.target;
    setAddVariantForm((prev) => ({ ...prev, [name]: value }));
  };

  const setAddVariantAttr = (attributeId, valueId) => {
    setAddVariantForm((prev) => ({
      ...prev,
      selectedAttributes: {
        ...(prev.selectedAttributes || {}),
        [attributeId]: valueId,
      },
    }));
  };

  const resetAddVariantForm = () => {
    setAddVariantForm({ sku: "", price: "", stock: "", description: "", product_condition: "NEW", selectedAttributes: {} });
    setShowAddVariant(false);
  };

  const createVariant = async () => {
    try {
      setCreatingVariant(true);
      const selected = addVariantForm.selectedAttributes || {};
      const attributePairs = Object.entries(selected)
        .filter(([, valueId]) => valueId)
        .map(([attributeId, valueId]) => ({ attribute_id: attributeId, value_id: valueId }));

      if (!addVariantForm.price || !addVariantForm.stock) {
        toast.error("Price and stock are required.");
        return;
      }

      if (attributePairs.length === 0) {
        toast.error("Select at least one attribute.");
        return;
      }

      const fd = new FormData();
      fd.append("price", addVariantForm.price);
      fd.append("stock", addVariantForm.stock);
      if (addVariantForm.sku) fd.append("sku", addVariantForm.sku);
      if (addVariantForm.description) fd.append("description", addVariantForm.description);
      if (addVariantForm.product_condition) fd.append("product_condition", addVariantForm.product_condition);
      fd.append("attribute_values", JSON.stringify(attributePairs));

      await axios.post(`${BASE_URL}/Variant/add/${productId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
      });

      toast.success("Variant created!");
      await fetchVariants(productId);
      resetAddVariantForm();
    } catch (err) {
      console.error("createVariant error:", err);
      toast.error("Failed to create variant.");
    } finally {
      setCreatingVariant(false);
    }
  };

  const saveVariant = async () => {
    if (!editingVariantId) return;
    try {
      const formData = new FormData();
      formData.append("price", variantForm.price);
      formData.append("stock", variantForm.stock);
      if (variantForm.sku) formData.append("sku", variantForm.sku);
      if (variantForm.description !== undefined) formData.append("description", variantForm.description);
      if (variantForm.product_condition) formData.append("product_condition", variantForm.product_condition);

      await updateVariant(editingVariantId, formData);

      // Update local state
      setVariants(prev => prev.map(v => {
        if ((v.id === editingVariantId) || (v._id === editingVariantId)) {
          return { ...v, ...variantForm };
        }
        return v;


      }));

      toast.success("Variant updated!");
      cancelEditingVariant();
    } catch (err) {
      console.error("Failed to update variant:", err);
      toast.error("Failed to update variant.");
    }
  };

  // --- Fetch product, variants, attribute-values ---
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    fetchProductById(productId)
      .then((data) => {
        setProduct(data);
        setEditForm(normalizeProductToForm(data));
      })
      .catch((err) => {
        console.error("fetchProductById error:", err);
        setError("Not found.");
        setProduct(null);
      })
      .finally(() => setLoading(false));

    fetchVariants(productId);
    fetchAllAttributeValues();
    // eslint-disable-next-line
  }, [productId]);

  useEffect(() => {
    if (!product?.category_id) return;
    const cid = product.category_id;
    setLoadingAttributes(true);
    axios
      .get(`${BASE_URL}/Attribute/by_category/${cid}`, { headers: getAuthHeaders() })
      .then((res) => {
        setAttributes(res.data?.attributes || []);
      })
      .catch(() => setAttributes([]))
      .finally(() => setLoadingAttributes(false));
  }, [product?.category_id]);

  useEffect(() => {
    if (!product) return;
    if (!editMode) {
      setEditForm(prev => ({ ...prev, ...normalizeProductToForm(product) }));
    }
  }, [product, editMode]);

  const fetchVariants = async (pid = productId) => {
    try {
      let res;
      try {
        const url = `${BASE_URL}/Variant/list/${pid}`;
        console.log("Fetching variants:", url);
        res = await axios.get(url, { headers: getAuthHeaders() });
      } catch (e) {
        const url = `${API_BASE_URL}/Variant/list/${pid}`;
        console.log("Fetching variants (fallback):", url);
        res = await axios.get(url, { headers: getAuthHeaders() });
      }

      const vRaw = res.data?.variants ?? res.data ?? [];
      const v = Array.isArray(vRaw) ? vRaw : [];
      console.log("Variants fetched:", v.length);
      setVariants(v);
    } catch (err) {
      console.error("fetchVariants error:", err);
      setVariants([]);
    }
  };

  const fetchAllAttributeValues = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/AttributeValue/`, { headers: getAuthHeaders() });
      const vals = res.data?.attribute_values ?? res.data ?? [];
      setAllAttributeValues(Array.isArray(vals) ? vals : []);
    } catch (err) {
      console.error("fetchAllAttributeValues error:", err);
      setAllAttributeValues([]);
    }
  };

  // Logic to load categories/attributes if we need to edit variants
  // (Simplified for now, focusing on UI update)

  // --- Handlers ---
  const handleDelete = () => {
    showConfirm({
      title: "Delete Product",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deleteProduct(productId);
          toast.success("Product deleted successfully");
          navigate("/seller/dashboard?tab=listings");
        } catch (err) {
          console.error("Error deleting product:", err);
          toast.error("Failed to delete product.");
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const enterEditMode = () => {
    setEditForm(normalizeProductToForm(product ?? {}));
    setEditMode(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("product_name", editForm.product_name);
      formData.append("description", editForm.description);
      // ✅ Fixed: use "brand" not "manufacturer"
      if (editForm.brand) formData.append("brand", editForm.brand);
      // ✅ Added: send price, stock, product_condition
      if (editForm.price !== "") formData.append("price", editForm.price);
      if (editForm.stock !== "") formData.append("stock", editForm.stock);
      if (editForm.product_condition) formData.append("product_condition", editForm.product_condition);

      // Append new images
      newImages.forEach(file => {
        formData.append("files", file);
      });

      // Append deleted images list
      if (deletedImageUrls.length > 0) {
        formData.append("delete_image_urls", JSON.stringify(deletedImageUrls));
      }

      await updateProduct(productId, formData);

      const updatedProduct = await fetchProductById(productId);
      setProduct(updatedProduct);
      setEditForm(normalizeProductToForm(updatedProduct));

      // Clear new images and deletions
      setNewImages([]);
      setPreviewNewImages([]);
      setDeletedImageUrls([]);

      setEditMode(false);
      toast.success("Product updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update product.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-gray-200 mb-4">{error || "Product not found"}</h2>
        <button onClick={() => navigate("/seller/dashboard?tab=listings")} className={btnPrimary}>
          Back to Dashboard
        </button>
      </div>
      <Footer />
    </div>
  );

  // --- Render Edit Mode ---
  if (editMode) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] font-inter flex flex-col">
        <Navbar />
        {/* Ambient glows */}
        <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none z-0" />
        <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none z-0" />

        <div className="relative z-10 flex-grow container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-sora font-bold text-white mb-6">Edit Product</h1>

            <div className={cardCls + " space-y-6"}>
              <div>
                <label className={labelCls}>Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={editForm.product_name}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>

              {/* --- IMAGES SECTION --- */}
              <div>
                <label className={labelCls}>Product Images</label>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {/* Existing Images */}
                  {product.images && product.images.map((img, idx) => {
                    const isDeleted = deletedImageUrls.includes(img);
                    return (
                      <div key={`existing-${idx}`} className={`relative group aspect-square bg-white/5 rounded-xl overflow-hidden border ${isDeleted ? "border-red-500/50" : "border-white/10"}`}>
                        <img src={img} alt="Existing" className={`w-full h-full object-cover transition-opacity ${isDeleted ? "opacity-30 grayscale" : ""}`} />
                        <div className={`absolute inset-0 bg-black/50 ${isDeleted ? "opacity-100" : "opacity-0 group-hover:opacity-100"} flex items-center justify-center transition-opacity`}>
                          <button
                            onClick={() => toggleDeleteImage(img)}
                            className={`${isDeleted ? "bg-white text-red-600" : "bg-red-500 text-white"} px-3 py-1 rounded-full text-xs font-bold`}
                          >
                            {isDeleted ? "Restore" : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* New Images */}
                  {previewNewImages.map((img, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-square bg-white/5 rounded-xl overflow-hidden border border-green-500/30">
                      <img src={img} alt="New" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/15 hover:border-indigo-500/50 hover:bg-white/5"
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <p className="text-gray-400 text-sm mb-2">Drag & drop new images or</p>
                  <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-semibold text-sm">
                    Browse Files
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  name="description"
                  rows={5}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className={inputCls + " resize-none"}
                />
              </div>

              {/* ✅ Added: Price, Stock, Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditChange}
                    step="0.01"
                    min="0"
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelCls}>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditChange}
                    min="0"
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>Condition</label>
                  <select
                    name="product_condition"
                    value={editForm.product_condition}
                    onChange={handleEditChange}
                    className={inputCls}
                  >
                    <option value="NEW" className="bg-[#1a1a2e]">New</option>
                    <option value="USED" className="bg-[#1a1a2e]">Used</option>
                    <option value="REFURBISHED" className="bg-[#1a1a2e]">Refurbished</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Brand / Manufacturer</label>
                <input
                  type="text"
                  name="brand"
                  value={editForm.brand}
                  onChange={handleEditChange}
                  className={inputCls}
                />
              </div>

              {/* --- VARIANTS SECTION --- */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Manage Variants</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddVariant((v) => !v)}
                    className={btnSecondary}
                  >
                    Add Variant
                  </button>
                </div>

                {showAddVariant && (
                  <div className={cardCls + " mb-6 space-y-4"}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>SKU (optional)</label>
                        <input
                          type="text"
                          name="sku"
                          value={addVariantForm.sku}
                          onChange={handleAddVariantChange}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Price</label>
                        <input
                          type="number"
                          name="price"
                          value={addVariantForm.price}
                          onChange={handleAddVariantChange}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Stock</label>
                        <input
                          type="number"
                          name="stock"
                          value={addVariantForm.stock}
                          onChange={handleAddVariantChange}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={labelCls + " mb-0"}>Attributes</span>
                        {loadingAttributes && <span className="text-xs text-gray-500">Loading...</span>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(attributes || []).map((attr) => {
                          const attrId = String(attr._id || attr.id || "");
                          const selectedValueId = addVariantForm.selectedAttributes?.[attrId] || "";
                          const values = (allAttributeValues || []).filter((v) => String(v.attribute_id) === attrId);
                          return (
                            <div key={attrId}>
                              <label className={labelCls}>{attr.name}</label>
                              <select
                                value={selectedValueId}
                                onChange={(e) => setAddVariantAttr(attrId, e.target.value)}
                                className={inputCls}
                              >
                                <option value="">Select {attr.name}</option>
                                {values.map((v) => (
                                  <option key={String(v._id || v.id)} value={String(v._id || v.id)}>
                                    {v.value}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Description + Condition for new variant */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea
                          name="description"
                          value={addVariantForm.description}
                          onChange={handleAddVariantChange}
                          rows={2}
                          className={inputCls + " resize-none"}
                          placeholder="Variant description..."
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Condition</label>
                        <select
                          name="product_condition"
                          value={addVariantForm.product_condition}
                          onChange={handleAddVariantChange}
                          className={inputCls}
                        >
                          <option value="NEW" className="bg-[#1a1a2e]">New</option>
                          <option value="USED" className="bg-[#1a1a2e]">Used</option>
                          <option value="REFURBISHED" className="bg-[#1a1a2e]">Refurbished</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={resetAddVariantForm} className={btnSecondary}>
                        Cancel
                      </button>
                      <button type="button" onClick={createVariant} disabled={creatingVariant} className={btnPrimary}>
                        {creatingVariant ? "Creating..." : "Create Variant"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-white/5 text-gray-300">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Info</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Condition</th>
                        <th className="px-4 py-3 rounded-tr-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {variants.map((v) => {
                        const isEditing = (editingVariantId === v.id || editingVariantId === v._id);
                        return (
                          <tr key={v._id || v.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">
                              {v.attributes?.map(a => `${a.attribute_name}: ${a.value_name}`).join(", ") || "Standard"}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  name="price"
                                  value={variantForm.price}
                                  onChange={handleVariantFormChange}
                                  className="w-24 bg-black/20 border border-white/10 rounded px-2 py-1 text-white"
                                />
                              ) : (
                                `₹${v.price}`
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  name="stock"
                                  value={variantForm.stock}
                                  onChange={handleVariantFormChange}
                                  className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-white"
                                />
                              ) : (
                                v.stock
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="sku"
                                  value={variantForm.sku || ""}
                                  onChange={handleVariantFormChange}
                                  className="w-24 bg-black/20 border border-white/10 rounded px-2 py-1 text-white"
                                />
                              ) : (
                                v.sku || "-"
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  name="product_condition"
                                  value={variantForm.product_condition}
                                  onChange={handleVariantFormChange}
                                  className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm"
                                >
                                  <option value="NEW" className="bg-[#1a1a2e]">New</option>
                                  <option value="USED" className="bg-[#1a1a2e]">Used</option>
                                  <option value="REFURBISHED" className="bg-[#1a1a2e]">Refurbished</option>
                                </select>
                              ) : (
                                <span className="text-xs">{v.product_condition || "-"}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button onClick={saveVariant} className="text-green-400 hover:text-green-300">Save</button>
                                  <button onClick={cancelEditingVariant} className="text-red-400 hover:text-red-300">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => startEditingVariant(v)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setEditMode(false)} className={btnSecondary}>Cancel</button>
                <button onClick={handleUpdate} className={btnPrimary}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // --- Render View Mode ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter flex flex-col">
      <Navbar />
      {/* Ambient glows */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none z-0" />

      <div className="relative z-10 flex-grow container mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            ← Back
          </button>
          <div className="flex gap-3">
            <button onClick={enterEditMode} className={btnSecondary}>
              Edit Product
            </button>
            <button onClick={handleDelete} disabled={deleting} className={btnDanger}>
              {deleting ? "Deleting..." : "Delete Product"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600">No Image</span>
              )}
            </div>
            {/* Thumbnails grid if needed */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1).map((img, idx) => (
                  <div key={idx} className="aspect-square bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-sora font-extrabold text-white mb-4">{product.product_name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium border border-indigo-500/30">
                  {product.category?.name || "Category"}
                </span>
                <span className="text-gray-400 text-sm">SKU: {product?.sku || "N/A"}</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">{product.description}</p>
            </div>

            <div className={cardCls}>
              <h3 className="text-lg font-bold text-white mb-4">Product Variants</h3>
              {variants.length === 0 ? (
                <p className="text-gray-500 italic">No variants listed.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                    <thead className="text-xs uppercase bg-white/5 text-gray-300">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Attributes</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Condition</th>
                        <th className="px-4 py-3 rounded-tr-lg">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {variants.map((v) => (
                        <tr key={getVariantId(v)} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">
                            {v.attributes?.map(a => `${a.attribute_name}: ${a.value_name}`).join(", ") || "Standard"}
                          </td>
                          <td className="px-4 py-3">₹{v.price}</td>
                          <td className="px-4 py-3">{v.stock}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs">{v.product_condition || "-"}</span>
                          </td>
                          <td className="px-4 py-3">{v.sku || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={cardCls}>
              <h3 className="text-lg font-bold text-white mb-4">Stock & Condition</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider">Condition</span>
                  <span className="text-gray-200 font-medium">{product.product_condition || "New"}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider">Total Stock</span>
                  <span className="text-gray-200 font-medium">{product.stock || "0"}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase tracking-wider">Brand</span>
                  <span className="text-gray-200 font-medium">{product.brand || "-"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}