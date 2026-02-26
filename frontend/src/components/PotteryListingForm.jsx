import React, { useState } from 'react';
import { createProduct } from '../api/settingsApi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../api/baseUrl';

const POTTERY_ATTRIBUTES = [
  { name: "Material", values: ["ceramic", "clay", "terracotta", "stoneware", "porcelain"] },
  { name: "Color", values: ["white", "black", "brown", "blue", "green", "multicolor"] },
  { name: "Finish", values: ["glossy", "matte", "textured"] },
  { name: "Pattern", values: ["plain", "floral", "geometric", "hand-painted"] },
];

const inputCls = "w-full bg-white/5 border border-white/15 text-gray-200 placeholder-gray-600 rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
const labelCls = "block text-sm font-semibold text-gray-400 mb-2";
const sectionCls = "bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6";

const PotteryListingForm = ({ onBack }) => {
  const { id: categoryId } = useParams();
  const navigate = useNavigate();
  const API_BASE = API_BASE_URL;
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    description: '',
    price: '',
    stock: '',
    product_condition: 'NEW',
    category_id: categoryId,
    capacity_ml: '',
    volume_liters: '',
    diameter_cm: '',
    files: []
  });
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  // --- Handlers ---
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
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
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
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };
  const removeImage = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, files: newFiles }));
    setPreviewImages(newPreviews);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1) Create Product
      const submitData = new FormData();
      submitData.append('category_id', formData.category_id);
      submitData.append('product_name', formData.product_name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      submitData.append('product_condition', formData.product_condition);
      formData.files.forEach((file) => submitData.append('files', file));

      // ✅ Send pottery-specific dimension fields as extra_fields JSON
      const extraFields = {};
      if (formData.capacity_ml) extraFields.capacity_ml = Number(formData.capacity_ml);
      if (formData.volume_liters) extraFields.volume_liters = Number(formData.volume_liters);
      if (formData.diameter_cm) extraFields.diameter_cm = Number(formData.diameter_cm);
      if (Object.keys(extraFields).length > 0) {
        submitData.append('extra_fields', JSON.stringify(extraFields));
      }

      const product = await createProduct(submitData);
      const productId = product._id || product.id;

      // 2) Ensure attributes/values
      const [allAttrsResp, allValsResp] = await Promise.all([
        axios.get(`${API_BASE}/Attribute/`),
        axios.get(`${API_BASE}/AttributeValue/`)
      ]);
      const allAttributes = (allAttrsResp.data?.attributes || []).map(a => ({ _id: a._id, name: a.name, values: a.values || [] }));
      const allValues = allValsResp.data?.attribute_values || [];
      const findAttributeByName = (name) => allAttributes.find(a => a.name.toLowerCase() === name.toLowerCase());
      const findValueId = (attributeId, valueName) => {
        const found = allValues.find(v => v.attribute_id === attributeId && v.value.toLowerCase() === valueName.toLowerCase());
        return found ? found._id : null;
      };

      const attributePairs = [];
      for (const name of Object.keys(selectedAttributes)) {
        const chosenValue = selectedAttributes[name];
        let attributeId;
        const existingAttr = findAttributeByName(name);
        if (existingAttr) {
          attributeId = existingAttr._id;
        } else {
          try {
            const addAttrResp = await axios.post(`${API_BASE}/Attribute/add`, new URLSearchParams({ name }), {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...getAuthHeaders() }
            });
            attributeId = addAttrResp.data?.id;
            allAttributes.push({ _id: attributeId, name, values: [] });
          } catch (err) {
            const freshAttrsResp = await axios.get(`${API_BASE}/Attribute/`);
            const freshAttrs = freshAttrsResp.data?.attributes || [];
            allAttributes.length = 0;
            allAttributes.push(...freshAttrs);
            const refetchedAttr = findAttributeByName(name);
            if (refetchedAttr) attributeId = refetchedAttr._id;
            else throw err;
          }
        }
        let valueId = findValueId(attributeId, chosenValue);
        if (!valueId) {
          try {
            const addValResp = await axios.post(`${API_BASE}/AttributeValue/add`, new URLSearchParams({ attribute_id: attributeId, value: chosenValue }), {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...getAuthHeaders() }
            });
            valueId = addValResp.data?.id;
            allValues.push({ _id: valueId, attribute_id: attributeId, value: chosenValue });
          } catch (err) {
            const freshValsResp = await axios.get(`${API_BASE}/AttributeValue/`);
            const freshVals = freshValsResp.data?.attribute_values || [];
            allValues.length = 0;
            allValues.push(...freshVals);
            valueId = findValueId(attributeId, chosenValue);
            if (!valueId) throw err;
          }
        }
        attributePairs.push({ attribute_id: attributeId, value_id: valueId });
      }

      // Add numeric attributes if present
      // Note: Logic for numeric attributes preserved (currently stubbed or relying on future implementation)

      // 3) Create Variant
      if (attributePairs.length > 0) {
        const variantData = new FormData();
        variantData.append('price', formData.price);
        variantData.append('stock', formData.stock);
        variantData.append('product_condition', formData.product_condition);
        variantData.append('description', formData.description);
        variantData.append('attribute_values', JSON.stringify(attributePairs));
        if (formData.sku) variantData.append('sku', formData.sku);
        await axios.post(`${API_BASE}/Variant/add/${productId}`, variantData, {
          headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
        });
      }

      toast.success('Pottery listed successfully!');
      if (onBack) onBack();
      else navigate('/seller/dashboard?tab=listings');
    } catch (error) {
      console.error('Error creating pottery listing:', error);
      toast.error('Error creating listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter">
      <Navbar />

      {/* Ambient glows */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-sora text-3xl font-extrabold text-white">List Your Pottery Item</h1>
          <button onClick={handleBack} className="text-sm text-gray-400 hover:text-white border border-white/15 px-4 py-2 rounded-xl transition-all">Back to Categories</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. PHOTOS & VIDEO Section */}
          <div className={sectionCls}>
            <h2 className="font-sora text-lg font-bold text-white mb-1">Photos & Video</h2>
            <p className="text-sm text-gray-500 mb-5">Add at least 5 photos. Buyers want to see all details and angles.</p>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/15 hover:border-indigo-500/50 hover:bg-white/5'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-4xl mb-4">📷</div>
              <p className="text-gray-400 mb-2 font-medium">Drag and drop files here</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-pottery"
              />
              <label
                htmlFor="file-upload-pottery"
                className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors"
              >
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

          {/* 2. TITLE Section */}
          <div className={sectionCls}>
            <h2 className="font-sora text-lg font-bold text-white mb-5">Title</h2>

            <div className="mb-5">
              <label className={labelCls}>Item title</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleInputChange}
                placeholder="Pottery Item Title"
                maxLength={80}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>SKU <span className="text-gray-600 font-normal">(optional)</span></label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="Optional SKU"
                className={inputCls}
              />
            </div>
          </div>

          {/* 3. ITEM SPECIFICS Section */}
          <div className={sectionCls}>
            <h2 className="font-sora text-lg font-bold text-white mb-5">Item Specifics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {POTTERY_ATTRIBUTES.map((attr) => (
                <div key={attr.name}>
                  <label className={labelCls}>{attr.name}</label>
                  <select
                    className={inputCls}
                    value={selectedAttributes[attr.name] || ''}
                    onChange={e => setSelectedAttributes(prev => ({ ...prev, [attr.name]: e.target.value }))}
                    required
                  >
                    <option value='' className="bg-[#1a1a2e]">Select {attr.name}</option>
                    {Array.isArray(attr.values) && attr.values.map(opt => <option key={opt} value={opt} className="bg-[#1a1a2e]">{opt}</option>)}
                  </select>
                </div>
              ))}

              {/* Numeric Fields */}
              <div>
                <label className={labelCls}>Capacity (ml)</label>
                <input type="number" name="capacity_ml" value={formData.capacity_ml} onChange={handleInputChange} className={inputCls} placeholder="e.g., 250" min="0" />
              </div>
              <div>
                <label className={labelCls}>Volume (Liters)</label>
                <input type="number" name="volume_liters" value={formData.volume_liters} onChange={handleInputChange} className={inputCls} placeholder="e.g., 1.5" step="0.1" min="0" />
              </div>
              <div>
                <label className={labelCls}>Diameter (cm)</label>
                <input type="number" name="diameter_cm" value={formData.diameter_cm} onChange={handleInputChange} className={inputCls} placeholder="e.g., 15" step="0.1" min="0" />
              </div>
            </div>
          </div>

          {/* 4. ADDITIONAL DETAILS Section */}
          <div className={sectionCls}>
            <h2 className="font-sora text-lg font-bold text-white mb-5">Additional Details</h2>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className={inputCls + " resize-none"} placeholder="Describe your item in detail..." required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelCls}>Price (₹)</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" min="0" className={inputCls} required /></div>
                <div><label className={labelCls}>Stock Quantity</label><input type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="1" className={inputCls} required /></div>
              </div>
              <div>
                <label className={labelCls}>Condition</label>
                <select name="product_condition" value={formData.product_condition} onChange={handleInputChange} className={inputCls}>
                  <option value="NEW" className="bg-[#1a1a2e]">New</option>
                  <option value="USED" className="bg-[#1a1a2e]">Used</option>
                  <option value="REFURBISHED" className="bg-[#1a1a2e]">Refurbished</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pb-8">
            <button type="button" onClick={handleBack} className="px-6 py-3 border border-white/15 text-gray-400 font-semibold rounded-xl hover:bg-white/5 hover:text-white transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-105 disabled:opacity-50">
              {loading ? 'Listing...' : 'List Pottery'}
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};
export default PotteryListingForm;