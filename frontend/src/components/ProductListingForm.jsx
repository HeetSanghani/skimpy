import React, { useState, useEffect } from 'react';
import { createProduct } from '../api/settingsApi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from "../api/baseUrl";

const CLOTHING_KEYWORDS = ["clothes", "clothing", "t-shirt", "shirt", "jeans", "trousers", "pants", "dress", "skirt", "shorts", "jacket", "coat", "sweater", "hoodie", "kurta", "suit", "blazer", "top"];
const BOOK_KEYWORDS = ["book", "books", "novel", "comics", "magazine", "textbook", "encyclopedia"];

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
  { name: "Publication Year", values: ["2025", "2024", "2023", "2022", "2021", "2020", "2015-2019", "Before 2015"] }
];

function isClothingCategory(category) {
  const categoryName = (category?.category_name || category?.name || "").toLowerCase();
  return CLOTHING_KEYWORDS.some(keyword => categoryName.includes(keyword));
}

function isBookCategory(category) {
  const categoryName = (category?.category_name || category?.name || "").toLowerCase();
  return BOOK_KEYWORDS.some(keyword => categoryName.includes(keyword));
}

// ── Shared themed input classes ──────────────────────────────────────────────
const inputCls = "w-full bg-white/5 border border-white/15 text-gray-200 placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
const labelCls = "block text-sm font-semibold text-gray-400 mb-2";
const sectionCls = "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6";

const ProductListingForm = ({ category, onBack }) => {
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [formData, setFormData] = useState({
    product_name: '',
    files: [],
    category_id: category._id || category.id,
  });

  const blankSpec = {
    brand: '',
    sku: '',
    attributes: {},
    description: '',
    price: '',
    stock: '',
    product_condition: 'NEW',
  };
  const [itemSpecs, setItemSpecs] = useState([{ ...blankSpec }]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    const fetchDynamicAttributes = async () => {
      try {
        if (!category._id) return;
        const res = await axios.get(`${API_BASE_URL}/Attribute/by_category/${category._id}`, { headers: getAuthHeaders() });
        setAttributes(res.data.attributes || []);
      } catch (e) {
        setAttributes([]);
      }
    };
    fetchDynamicAttributes();
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
    updatePreviewImages([...formData.files, ...files]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...files] }));
      updatePreviewImages([...formData.files, ...files]);
    }
  };

  const updatePreviewImages = (files) => {
    setPreviewImages(files.map(file => URL.createObjectURL(file)));
  };

  const removeImage = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, files: newFiles }));
    setPreviewImages(newPreviews);
  };

  const handleSpecChange = (i, field, value) => {
    setItemSpecs(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  const handleAttributeChange = (i, attrKey, value) => {
    setItemSpecs(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], attributes: { ...updated[i].attributes, [attrKey]: value } };
      return updated;
    });
  };

  const addSpecification = () => {
    setItemSpecs(prev => [...prev, { ...blankSpec, product_condition: prev[0].product_condition }]);
  };

  const removeSpecification = (i) => {
    setItemSpecs(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  };

  const ensureAttributeAndValueExist = async (attributeName, chosenValue, allAttributes, allValues) => {
    const findAttributeByName = (name) => allAttributes.find(a => a.name.toLowerCase() === name.toLowerCase());
    const findValueId = (attributeId, valueName) => allValues.find(v => v.attribute_id === attributeId && v.value.toLowerCase() === valueName.toLowerCase())?._id;

    let attributeId;
    let existingAttr = findAttributeByName(attributeName);
    if (existingAttr) {
      attributeId = existingAttr._id;
    } else {
      try {
        const addAttrResp = await axios.post(`${API_BASE_URL}/Attribute/add`, new URLSearchParams({ name: attributeName }), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...getAuthHeaders() }
        });
        attributeId = addAttrResp.data?.id;
        allAttributes.push({ _id: attributeId, name: attributeName, values: [] });
      } catch (err) {
        const freshAttrsResp = await axios.get(`${API_BASE_URL}/Attribute/`);
        const freshAttrs = freshAttrsResp.data?.attributes || [];
        allAttributes.length = 0;
        allAttributes.push(...freshAttrs);
        existingAttr = findAttributeByName(attributeName);
        if (existingAttr) attributeId = existingAttr._id;
        else throw err;
      }
    }

    let valueId = findValueId(attributeId, chosenValue);
    if (!valueId) {
      try {
        const addValResp = await axios.post(`${API_BASE_URL}/AttributeValue/add`, new URLSearchParams({ attribute_id: attributeId, value: chosenValue }), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...getAuthHeaders() }
        });
        valueId = addValResp.data?.id;
        allValues.push({ _id: valueId, attribute_id: attributeId, value: chosenValue });
      } catch (err) {
        const freshValsResp = await axios.get(`${API_BASE_URL}/AttributeValue/`);
        const freshVals = freshValsResp.data?.attribute_values || [];
        allValues.length = 0;
        allValues.push(...freshVals);
        valueId = findValueId(attributeId, chosenValue);
        if (!valueId) throw err;
      }
    }

    return { attribute_id: attributeId, value_id: valueId };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ── Step 1: Create the product (uses main/first spec for title fields) ──
      const mainSpec = itemSpecs[0];
      const productData = new FormData();
      productData.append('category_id', formData.category_id);
      productData.append('product_name', formData.product_name);
      productData.append('description', mainSpec.description);
      productData.append('price', mainSpec.price);
      productData.append('stock', mainSpec.stock);
      productData.append('product_condition', mainSpec.product_condition);
      if (mainSpec.brand) productData.append('brand', mainSpec.brand);
      formData.files.forEach((file) => productData.append('files', file));

      const product = await createProduct(productData);
      const productId = product._id || product.id;

      // ── Step 2: Fetch all known attributes + values once ──
      let allAttributes = [];
      let allValues = [];
      try {
        const [attrsResp, valsResp] = await Promise.all([
          axios.get(`${API_BASE_URL}/Attribute/`),
          axios.get(`${API_BASE_URL}/AttributeValue/`),
        ]);
        allAttributes = attrsResp.data?.attributes || [];
        allValues = valsResp.data?.attribute_values || [];
      } catch (err) {
        console.warn('Could not fetch attributes/values. Proceeding without attribute mapping.', err);
      }

      // Build a key→name map for the attribute dropdowns shown in the form
      const attributesToShow =
        attributes && attributes.length > 0
          ? attributes
          : isClothingCategory(category)
            ? CLOTHING_ATTRIBUTES
            : isBookCategory(category)
              ? BOOK_ATTRIBUTES
              : [];
      const attrKeyToName = {};
      attributesToShow.forEach((a) => {
        attrKeyToName[a._id || a.name] = a.name;
      });

      // ── Step 3: Save each variant (always at least 1 — the main variant) ──
      let savedCount = 0;
      for (let i = 0; i < itemSpecs.length; i++) {
        const spec = itemSpecs[i];

        // Resolve each selected attribute → { attribute_id, value_id } pair
        const attributePairs = [];
        for (const key of Object.keys(spec.attributes || {})) {
          const chosenValue = spec.attributes[key];
          if (!chosenValue) continue;
          const attributeName = attrKeyToName[key] || key;
          try {
            const pair = await ensureAttributeAndValueExist(
              attributeName,
              chosenValue,
              allAttributes,
              allValues
            );
            if (pair?.attribute_id && pair?.value_id) {
              attributePairs.push(pair);
            }
          } catch (err) {
            console.warn(`Skipping attribute "${attributeName}" = "${chosenValue}" — could not resolve IDs.`, err);
          }
        }

        // POST this variant (main or additional)
        const variantData = new FormData();
        variantData.append('price', spec.price);
        variantData.append('stock', spec.stock);
        variantData.append('product_condition', spec.product_condition);
        variantData.append('description', spec.description);
        variantData.append('attribute_values', JSON.stringify(attributePairs));
        if (spec.sku) variantData.append('sku', spec.sku);
        if (spec.brand) variantData.append('brand', spec.brand);

        try {
          await axios.post(
            `${API_BASE_URL}/Variant/add/${productId}`,
            variantData,
            { headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() } }
          );
          savedCount++;
          console.log(`Variant ${i + 1} saved successfully.`);
        } catch (err) {
          const detail = err?.response?.data?.detail || err?.message || 'Unknown error';
          console.error(`Variant ${i + 1} failed to save:`, detail);
          // Don't block the rest — try saving remaining variants
        }
      }

      if (savedCount === itemSpecs.length) {
        toast.success(
          itemSpecs.length === 1
            ? 'Product listed successfully!'
            : `Product listed with ${savedCount} variants!`
        );
      } else {
        toast.success(
          `Product created. ${savedCount} of ${itemSpecs.length} variant(s) saved.`
        );
      }

      if (onBack) onBack();
      else navigate('/seller/dashboard?tab=listings');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error creating product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  let attributesToShow = attributes && attributes.length > 0 ? attributes : [];
  let isClothing = false;
  if (!attributesToShow.length && isClothingCategory(category)) {
    attributesToShow = CLOTHING_ATTRIBUTES;
    isClothing = true;
  } else if (!attributesToShow.length && isBookCategory(category)) {
    attributesToShow = BOOK_ATTRIBUTES;
  }

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Form header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-sora text-3xl font-extrabold">
            <span className="text-white">Complete your </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">Listing</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Category: <span className="text-indigo-400 font-semibold">{category.category_name || category.name}</span>
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-white/15 hover:border-white/30 px-4 py-2 rounded-xl transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── PHOTOS & VIDEO ── */}
        <div className={sectionCls}>
          <h2 className="font-sora text-lg font-bold text-white mb-1">Photos & Video</h2>
          <p className="text-sm text-gray-500 mb-5">
            Add at least 5 photos. Buyers want to see all details and angles.
          </p>

          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/15 hover:border-indigo-500/50 hover:bg-white/5'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 mb-1 font-medium">Drag and drop files here</p>
            <p className="text-gray-600 text-sm mb-4">or</p>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl cursor-pointer hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
            >
              <Upload className="w-4 h-4" />
              Upload from computer
            </label>
          </div>

          <p className="text-xs text-gray-600 mt-3">{formData.files.length}/25 photos</p>

          {previewImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-xl border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── TITLE ── */}
        <div className={sectionCls}>
          <h2 className="font-sora text-lg font-bold text-white mb-5">Product Title</h2>
          <div>
            <label className={labelCls}>Item title</label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleInputChange}
              placeholder="e.g., Men's Cotton Shirt"
              maxLength={80}
              className={inputCls}
              required
            />
            <p className="text-xs text-gray-600 mt-2">{formData.product_name.length}/80 characters</p>
          </div>
        </div>

        {/* ── ITEM SPECIFICS / VARIANTS ── */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-sora text-lg font-bold text-white">Item Specifics</h2>
            <button
              type="button"
              onClick={addSpecification}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-semibold rounded-xl hover:bg-indigo-500/25 hover:border-indigo-500/50 transition-all duration-200 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>

          <div className="space-y-8">
            {itemSpecs.map((spec, idx) => (
              <div
                key={idx}
                className={`relative ${idx < itemSpecs.length - 1 ? 'border-b border-white/10 pb-8 mb-2' : ''}`}
              >
                {/* Variant header */}
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-300">
                      {idx === 0 ? 'Main Item' : `Variant ${idx + 1}`}
                    </h3>
                  </div>
                  {itemSpecs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecification(idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 border border-rose-500/20 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                {/* Brand (clothing only) */}
                {isClothing && (
                  <div className="mb-5">
                    <label className={labelCls}>Brand</label>
                    <input
                      type="text"
                      value={spec.brand}
                      onChange={e => handleSpecChange(idx, 'brand', e.target.value)}
                      placeholder="e.g., Nike, Zara, Levi's"
                      className={inputCls}
                      required
                    />
                  </div>
                )}

                {/* SKU */}
                <div className="mb-5">
                  <label className={labelCls}>SKU <span className="text-gray-600 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={spec.sku}
                    onChange={e => handleSpecChange(idx, 'sku', e.target.value)}
                    placeholder="Optional SKU"
                    className={inputCls}
                  />
                </div>

                {/* Dynamic attributes */}
                {attributesToShow.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 mb-5 md:grid-cols-2">
                    {attributesToShow.map((attr) => (
                      <div key={attr.name || attr._id}>
                        <label className={labelCls}>{attr.name}</label>
                        <select
                          className={inputCls}
                          value={spec.attributes[attr._id ?? attr.name] || ''}
                          onChange={e => handleAttributeChange(idx, attr._id ?? attr.name, e.target.value)}
                        >
                          <option value="" className="bg-[#1a1a2e]">Select {attr.name}</option>
                          {Array.isArray(attr.values) && attr.values.map(opt => (
                            <option key={opt} value={opt} className="bg-[#1a1a2e]">{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm mb-5">No specific attributes or category-specific options found.</p>
                )}

                {/* Description, Price, Stock, Condition */}
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      value={spec.description}
                      onChange={e => handleSpecChange(idx, 'description', e.target.value)}
                      rows={4}
                      className={inputCls + " resize-none"}
                      placeholder="Describe your item in detail — condition, features, dimensions..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Price (₹)</label>
                      <input
                        type="number"
                        value={spec.price}
                        onChange={e => handleSpecChange(idx, 'price', e.target.value)}
                        step="0.01"
                        min="0"
                        className={inputCls}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Stock Quantity</label>
                      <input
                        type="number"
                        value={spec.stock}
                        onChange={e => handleSpecChange(idx, 'stock', e.target.value)}
                        min="1"
                        className={inputCls}
                        placeholder="1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Condition</label>
                    <select
                      value={spec.product_condition}
                      onChange={e => handleSpecChange(idx, 'product_condition', e.target.value)}
                      className={inputCls}
                      required
                    >
                      <option value="NEW" className="bg-[#1a1a2e]">New</option>
                      <option value="USED" className="bg-[#1a1a2e]">Used</option>
                      <option value="REFURBISHED" className="bg-[#1a1a2e]">Refurbished</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex justify-end gap-4 pb-8">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-white/15 text-gray-400 font-semibold rounded-xl hover:bg-white/5 hover:border-white/25 hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating...
              </span>
            ) : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductListingForm;