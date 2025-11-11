import React, { useState } from 'react';
import axios from 'axios';
import { createProduct } from '../api/settingsApi';
import { useParams } from 'react-router-dom';

const HOME_DECOR_ATTRIBUTES = [
  { name: "Material", values: ["wood", "metal", "resin", "canvas", "mixed"] },
  { name: "Color", values: ["natural wood", "black", "white", "gold", "silver", "multicolor"] },
  { name: "Style", values: ["modern", "rustic", "bohemian", "vintage", "minimalist", "traditional"] },
  { name: "Mechanism Type", values: ["analog", "digital"], hint: "For Clocks" },
  { name: "Frame Material", values: ["wood", "metal", "plastic", "bamboo"], hint: "For Wall Art & Frames" },
  { name: "Resin Type", values: ["epoxy", "polyester", "acrylic"], hint: "For Resin Art Panels" },
];

const HomeDecorListingForm = ({ onBack }) => {
  const { id: categoryId } = useParams();
  const API_BASE = 'http://127.0.0.1:8000';
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
    files: []
  });
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  // --- Handlers (Full set included) ---
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

      const product = await createProduct(submitData);
      const productId = product._id || product.id;

      // 2) Ensure attributes/values
      const [allAttrsResp, allValsResp] = await Promise.all([
        axios.get(`${API_BASE}/Attribute/`),
        axios.get(`${API_BASE}/AttributeValue/`)
      ]);
      const allAttributes = (allAttrsResp.data?.attributes || []).map(a => ({ _id: a._id, name: a.name, values: a.values || [] }));
      const allValues = allValsResp.data?.attribute_values || [];
      const findAttributeByName = (name) => allAttributes.find(a => a.name === name);
      const findValueId = (attributeId, valueName) => {
        const found = allValues.find(v => v.attribute_id === attributeId && v.value === valueName);
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
          const addAttrResp = await axios.post(`${API_BASE}/Attribute/add`, new URLSearchParams({ name }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...getAuthHeaders() }
          });
          attributeId = addAttrResp.data?.id;
          allAttributes.push({ _id: attributeId, name, values: [] });
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
            valueId = findValueId(attributeId, chosenValue);
            if (!valueId) throw err;
          }
        }
        attributePairs.push({ attribute_id: attributeId, value_id: valueId });
      }

      // 3) Create Variant
      if (attributePairs.length > 0) {
        const variantData = new FormData();
        variantData.append('price', formData.price);
        variantData.append('stock', formData.stock);
        variantData.append('attribute_values', JSON.stringify(attributePairs));
        if (formData.sku) variantData.append('sku', formData.sku);
        await axios.post(`${API_BASE}/Variant/add/${productId}`, variantData, {
          headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
        });
      }

      alert('Home Decor item listed successfully!');
      if (onBack) onBack();
    } catch (error) {
      console.error('Error creating home decor listing:', error);
      alert('Error creating listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  // ----------------
  
  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">List Your Home Decor Item</h1>
        <button onClick={onBack} className="text-sm underline hover:text-blue-600">Back to Categories</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. PHOTOS & VIDEO Section */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">PHOTOS & VIDEO</h2>
            <button type="button" className="text-sm text-blue-600 hover:underline">
              See photo options
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add at least 5 photos. You can add up to 24 photos and a 1-minute video. 
            Buyers want to see all details and angles.
          </p>
          <div className="flex gap-6">
            <div className="flex-1">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-4xl mb-4">📷</div>
                <p className="text-lg mb-2">Drag and drop files</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-decor"
                />
                <label
                  htmlFor="file-upload-decor"
                  className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700"
                >
                  Upload from computer
                </label>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                {formData.files.length}/25 photos
              </div>
            </div>
          </div>
          {previewImages.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. TITLE Section */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">TITLE</h2>
            <button type="button" className="text-sm text-blue-600 hover:underline">
              See title options
            </button>
          </div>
          <label className="block text-sm font-medium mb-2">Item title</label>
          <input
            type="text"
            name="product_name"
            value={formData.product_name}
            onChange={handleInputChange}
            placeholder="Home Decor Item Title"
            maxLength={80}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="Optional SKU"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* 3. ITEM SPECIFICS Section (Your original content) */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">ITEM SPECIFICS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {HOME_DECOR_ATTRIBUTES.map((attr) => (
              <div key={attr.name}>
                <label className="block text-sm font-medium mb-2">{attr.name} {attr.hint && <span className='text-xs text-gray-500'>({attr.hint})</span>}</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedAttributes[attr.name] || ''}
                  onChange={e => setSelectedAttributes(prev => ({ ...prev, [attr.name]: e.target.value }))}
                  required
                >
                  <option value=''>Select {attr.name}</option>
                  {Array.isArray(attr.values) && attr.values.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        
        {/* 4. ADDITIONAL DETAILS Section */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">ADDITIONAL DETAILS</h2>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-2">Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="Describe your item in detail..."/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-2">Price ($)</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" min="0" className="w-full border rounded-lg px-3 py-2" required/></div>
              <div><label className="block text-sm font-medium mb-2">Stock Quantity</label><input type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="1" className="w-full border rounded-lg px-3 py-2" required/></div>
            </div>
            <div><label className="block text-sm font-medium mb-2">Condition</label><select name="product_condition" value={formData.product_condition} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2"><option value="NEW">New</option><option value="USED">Used</option></select></div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Listing...' : 'List Home Decor'}</button>
        </div>
      </form>
    </div>
  );
};
export default HomeDecorListingForm;