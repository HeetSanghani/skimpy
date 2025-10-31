import React, { useState, useEffect } from 'react';
import { createProduct } from '../api/settingsApi';
import axios from 'axios';

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
// NOTE: Brand is handled as a separate input field below.

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

const ProductListingForm = ({ category, onBack }) => {
  const API_BASE = 'http://127.0.0.1:8000';
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    price: '',
    stock: '',
    product_condition: 'NEW',
    category_id: category._id || category.id,
    brand: '', // <<< NEW STATE FIELD FOR BRAND
    files: []
  });

  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    // Fetch attributes for the selected category from backend
    const fetchDynamicAttributes = async () => {
      try {
        if (!category._id) return;
        const res = await axios.get(`/Attribute/by_category/${category._id}`); // adjust baseURL if needed
        setAttributes(res.data.attributes || []);
      } catch (e) {
        setAttributes([]);
      }
    };
    fetchDynamicAttributes();
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
    updatePreviewImages([...formData.files, ...files]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...files]
      }));
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
    setFormData(prev => ({
      ...prev,
      files: newFiles
    }));
    setPreviewImages(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('category_id', formData.category_id);
      submitData.append('product_name', formData.product_name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      submitData.append('product_condition', formData.product_condition);
      
      // <<< ATTACH BRAND FIELD >>>
      if (formData.brand) {
          submitData.append('brand', formData.brand);
      }
      
      formData.files.forEach((file) => {
        submitData.append('files', file);
      });

      // 1) Create Product
      const product = await createProduct(submitData);
      const productId = product._id || product.id;

      // If no item specifics were chosen, we're done
      const hasAttributes = selectedAttributes && Object.keys(selectedAttributes).length > 0;
      if (!hasAttributes) {
        alert('Product created successfully!');
        onBack();
        return;
      }

      // 2) Ensure Attributes and Values exist → gather IDs
      // Fetch existing attributes and all values to resolve IDs quickly
      const [allAttrsResp, allValsResp] = await Promise.all([
        axios.get(`${API_BASE}/Attribute/`),
        axios.get(`${API_BASE}/AttributeValue/`)
      ]);

      const allAttributes = (allAttrsResp.data?.attributes || []).map(a => ({
        _id: a._id,
        name: a.name,
        values: a.values || []
      }));
      const allValues = allValsResp.data?.attribute_values || [];

      const findAttributeByName = (name) => allAttributes.find(a => a.name === name);
      const findValueId = (attributeId, valueName) => {
        const found = allValues.find(v => v.attribute_id === attributeId && v.value === valueName);
        return found ? found._id : null;
      };

      // Build a map from id->name for UI-provided keys
      const attrIdToName = {};
      (attributesToShow || []).forEach(a => {
        if (a._id) attrIdToName[a._id] = a.name;
      });

      const attributePairs = [];

      for (const key of Object.keys(selectedAttributes)) {
        const chosenValue = selectedAttributes[key];

        // Derive attribute name and id (if present)
        const attributeIdFromUI = key.length === 24 ? key : null; // crude ObjectId length check
        const attributeName = attributeIdFromUI ? (attrIdToName[attributeIdFromUI] || key) : key;

        // Ensure attribute exists (create if missing)
        let attributeId = attributeIdFromUI;
        if (!attributeId) {
          const existingAttr = findAttributeByName(attributeName);
          if (existingAttr) {
            attributeId = existingAttr._id;
          } else {
            const addAttrResp = await axios.post(`${API_BASE}/Attribute/add`, new URLSearchParams({ name: attributeName }), {
              headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                ...getAuthHeaders()
              }
            });
            attributeId = addAttrResp.data?.id;
            // Track newly created in local cache for subsequent lookups
            allAttributes.push({ _id: attributeId, name: attributeName, values: [] });
          }
        }

        // Ensure value exists for this attribute (create if missing)
        let valueId = findValueId(attributeId, chosenValue);
        if (!valueId) {
          try {
            const addValResp = await axios.post(`${API_BASE}/AttributeValue/add`, new URLSearchParams({ attribute_id: attributeId, value: chosenValue }), {
              headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                ...getAuthHeaders()
              }
            });
            valueId = addValResp.data?.id;
            allValues.push({ _id: valueId, attribute_id: attributeId, value: chosenValue });
          } catch (err) {
            // If value already exists (409/400), refetch id from cache/list
            valueId = findValueId(attributeId, chosenValue);
            if (!valueId) throw err;
          }
        }

        attributePairs.push({ attribute_id: attributeId, value_id: valueId });
      }

      // 3) Create Variant for this product using selected attributes/values
      const variantData = new FormData();
      variantData.append('price', formData.price);
      variantData.append('stock', formData.stock);
      variantData.append('attribute_values', JSON.stringify(attributePairs));
      // Optionally attach variant images (can be skipped). Uncomment to upload same files to variant
      // formData.files.forEach((file) => variantData.append('images', file));

      await axios.post(`${API_BASE}/Variant/add/${productId}`, variantData, {
        headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
      });

      alert('Product and variant created successfully!');
      onBack();
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  let attributesToShow = attributes && attributes.length > 0 ? attributes : [];
  let isClothing = false;
  
  if (!attributesToShow.length && isClothingCategory(category)) {
    attributesToShow = CLOTHING_ATTRIBUTES;
    isClothing = true; // Flag to show the Brand field
  } else if (!attributesToShow.length && isBookCategory(category)) {
    attributesToShow = BOOK_ATTRIBUTES;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Complete your listing</h1>
        <button 
          onClick={onBack}
          className="text-sm underline hover:text-blue-600"
        >
          Back to Categories
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* PHOTOS & VIDEO Section */}
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
            {/* Upload Area */}
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
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
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

          {/* Preview Images */}
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

        {/* TITLE Section */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">TITLE</h2>
            <button type="button" className="text-sm text-blue-600 hover:underline">
              See title options
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Item title</label>
            <input
              type="text"
              name="product_name"
              value={formData.product_name}
              onChange={handleInputChange}
              placeholder="e.g., Shirt Men"
              maxLength={80}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {formData.product_name.length}/80 characters
            </div>
          </div>
        </div>

        {/* ITEM SPECIFICS Section */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">ITEM SPECIFICS</h2>
          </div>
          
          {/* <<< NEW: BRAND INPUT FIELD FOR CLOTHING >>> */}
          {isClothing && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="e.g., Nike, Zara, Levi's"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {/* Default/Fetched Attributes (Dropdowns) */}
          {attributesToShow.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {attributesToShow.map((attr) => (
                <div key={attr.name || attr._id}>
                  <label className="block text-sm font-medium mb-2">{attr.name}</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedAttributes[attr._id ?? attr.name] || ''}
                    onChange={e => setSelectedAttributes(prev => ({ ...prev, [attr._id ?? attr.name]: e.target.value }))}
                    required
                  >
                    <option value=''>Select {attr.name}</option>
                    {Array.isArray(attr.values) && attr.values.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No specific fields for this category.</div>
          )}
        </div>

        {/* Additional Fields */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">ADDITIONAL DETAILS</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your item in detail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Condition</label>
              <select
                name="product_condition"
                value={formData.product_condition}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NEW">New</option>
                <option value="USED">Used</option>
                <option value="REFURBISHED">Refurbished</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductListingForm;