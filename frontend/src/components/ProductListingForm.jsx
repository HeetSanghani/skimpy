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

  // Keep top-level state for product name and files
  const [formData, setFormData] = useState({
    product_name: '',
    files: [],
    category_id: category._id || category.id,
  });

  const blankSpec = {
    brand: '',
    attributes: {},
    description: '',
    price: '',
    stock: '',
    product_condition: 'NEW',
  };
  // itemSpecs holds the details for all variants (the first one is the "main" one)
  const [itemSpecs, setItemSpecs] = useState([ { ...blankSpec } ]);
  
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    // Fetch attributes for the selected category from backend
    const fetchDynamicAttributes = async () => {
      try {
        if (!category._id) return;
        // NOTE: Adjust the API endpoint as per your backend route
        const res = await axios.get(`${API_BASE}/Attribute/by_category/${category._id}`, { headers: getAuthHeaders() });
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

  // Update functions for item spec fields
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
      // Use attrKey as provided (either name or _id)
      updated[i] = { ...updated[i], attributes: { ...updated[i].attributes, [attrKey]: value } };
      return updated;
    });
  };

  const addSpecification = () => {
    // Add new spec, defaulting condition to the first spec's condition for convenience
    setItemSpecs(prev => [ ...prev, { ...blankSpec, product_condition: prev[0].product_condition } ]); 
  };

  const removeSpecification = (i) => {
    setItemSpecs(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  };

  // Helper function to create/find attribute and value IDs
  const ensureAttributeAndValueExist = async (attributeName, chosenValue, allAttributes, allValues) => {
    const findAttributeByName = (name) => allAttributes.find(a => a.name === name);
    const findValueId = (attributeId, valueName) => allValues.find(v => v.attribute_id === attributeId && v.value === valueName)?._id;

    // 1. Ensure Attribute exists (create if missing)
    let attributeId;
    let existingAttr = findAttributeByName(attributeName);
    if (existingAttr) {
      attributeId = existingAttr._id;
    } else {
      const addAttrResp = await axios.post(`${API_BASE}/Attribute/add`, new URLSearchParams({ name: attributeName }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...getAuthHeaders() }
      });
      attributeId = addAttrResp.data?.id;
      allAttributes.push({ _id: attributeId, name: attributeName, values: [] });
    }

    // 2. Ensure Value exists for this attribute (create if missing)
    let valueId = findValueId(attributeId, chosenValue);
    if (!valueId) {
      try {
        const addValResp = await axios.post(`${API_BASE}/AttributeValue/add`, new URLSearchParams({ attribute_id: attributeId, value: chosenValue }), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...getAuthHeaders() }
        });
        valueId = addValResp.data?.id;
        allValues.push({ _id: valueId, attribute_id: attributeId, value: chosenValue });
      } catch (err) {
        // If value already exists (e.g., duplicate key error), refetch id
        valueId = findValueId(attributeId, chosenValue);
        if (!valueId) throw err;
      }
    }

    return { attribute_id: attributeId, value_id: valueId };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const mainSpec = itemSpecs[0]; // The first spec provides the main product details

    try {
      // --- 1. Create the Main Product Record ---
      const productData = new FormData();
      productData.append('category_id', formData.category_id);
      productData.append('product_name', formData.product_name);
      // Use description, price, stock, condition, and brand from the FIRST item spec
      productData.append('description', mainSpec.description);
      productData.append('price', mainSpec.price);
      productData.append('stock', mainSpec.stock);
      productData.append('product_condition', mainSpec.product_condition);
      
      if (mainSpec.brand) {
        productData.append('brand', mainSpec.brand);
      }
      
      formData.files.forEach((file) => {
        productData.append('files', file); // Attach all files to the main product
      });

      const product = await createProduct(productData); // Assuming this returns the created product object
      const productId = product._id || product.id;

      // --- 2. Resolve Attribute IDs (Setup for Variant Creation) ---
      const [allAttrsResp, allValsResp] = await Promise.all([
        axios.get(`${API_BASE}/Attribute/`),
        axios.get(`${API_BASE}/AttributeValue/`)
      ]);
      // Use flat arrays for fast lookup and modification
      const allAttributes = (allAttrsResp.data?.attributes || []);
      const allValues = allValsResp.data?.attribute_values || [];

      // Build a map from UI key (name or _id) to Attribute name for all possible attributes
      const attrKeyToName = {};
      const attributesToShow = attributes && attributes.length > 0 ? attributes : (isClothingCategory(category) ? CLOTHING_ATTRIBUTES : isBookCategory(category) ? BOOK_ATTRIBUTES : []);
      (attributesToShow || []).forEach(a => {
        attrKeyToName[a._id || a.name] = a.name;
      });

      // --- 3. Create Variants for ALL item specs ---
      for (let i = 0; i < itemSpecs.length; i++) {
        const spec = itemSpecs[i];
        const attributePairs = [];
        const selectedAttributes = spec.attributes;

        for (const key of Object.keys(selectedAttributes)) {
          const chosenValue = selectedAttributes[key];
          if (chosenValue) {
            // Determine the attribute name from the key
            const attributeName = attrKeyToName[key] || key;
            const pair = await ensureAttributeAndValueExist(attributeName, chosenValue, allAttributes, allValues);
            attributePairs.push(pair);
          }
        }

        // Create Variant
        const variantData = new FormData();
        variantData.append('price', spec.price);
        variantData.append('stock', spec.stock);
        variantData.append('product_condition', spec.product_condition);
        variantData.append('description', spec.description); // Variant-specific description
        variantData.append('attribute_values', JSON.stringify(attributePairs));
        
        // Use brand from spec
        if (spec.brand) {
            variantData.append('brand', spec.brand);
        }

        // POST variant:
        await axios.post(`${API_BASE}/Variant/add/${productId}`, variantData, {
          headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
        });
      }

      alert('Product and all variants created successfully!');
      onBack();
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Determine which attributes to show (dynamic from API or fallback constants)
  let attributesToShow = attributes && attributes.length > 0 ? attributes : [];
  let isClothing = false;
  
  if (!attributesToShow.length && isClothingCategory(category)) {
    attributesToShow = CLOTHING_ATTRIBUTES;
    isClothing = true; 
  } else if (!attributesToShow.length && isBookCategory(category)) {
    attributesToShow = BOOK_ATTRIBUTES;
  }

  // --- JSX START ---
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

        {/* ITEM SPECIFICS Section - REPEATED for VARIANTS */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">ITEM SPECIFICS</h2>
            <button type="button" onClick={addSpecification} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700">Add</button>
          </div>
          <div className="space-y-8">
            {itemSpecs.map((spec, idx) => (
              <div key={idx} className={`relative pt-4 ${idx < itemSpecs.length - 1 ? 'border-b pb-8 mb-8' : 'pb-4'}`}>
                
                {/* Variant Number/Title and Delete Button */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-md font-semibold text-gray-700">Item {idx + 1} Details</h3>
                    
                    {/* *** FIXED DELETE BUTTON POSITION *** */}
                    {itemSpecs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecification(idx)}
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 hover:text-red-700"
                      >
                        Delete Listing
                      </button>
                    )}
                </div>

                {/* Brand Field (for clothing) */}
                {isClothing && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={spec.brand}
                      onChange={e => handleSpecChange(idx, 'brand', e.target.value)}
                      placeholder="e.g., Nike, Zara, Levi's"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                {/* Dynamic/Preset Attributes (Size, Color, etc.) */}
                {attributesToShow.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {attributesToShow.map((attr) => (
                      <div key={attr.name || attr._id}>
                        <label className="block text-sm font-medium mb-2">{attr.name}</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          // Key is attr._id if available, otherwise attr.name
                          value={spec.attributes[attr._id ?? attr.name] || ''} 
                          onChange={e => handleAttributeChange(idx, attr._id ?? attr.name, e.target.value)}
                          // required // Uncomment if all attributes must be selected
                        >
                          <option value=''>Select {attr.name}</option>
                          {Array.isArray(attr.values) && attr.values.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 mb-4">No specific fields for this category.</div>
                )}
                
                {/* Description, Price, Stock, Condition - BINDED TO SPEC */}
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      name="description"
                      value={spec.description}
                      onChange={e => handleSpecChange(idx, 'description', e.target.value)}
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your item in detail..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Price ($)</label>
                      <input
                        type="number"
                        name="price"
                        value={spec.price}
                        onChange={e => handleSpecChange(idx, 'price', e.target.value)}
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
                        value={spec.stock}
                        onChange={e => handleSpecChange(idx, 'stock', e.target.value)}
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
                      value={spec.product_condition}
                      onChange={e => handleSpecChange(idx, 'product_condition', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="NEW">New</option>
                      <option value="USED">Used</option>
                      <option value="REFURBISHED">Refurbished</option>
                    </select>
                  </div>
                </div>

              </div>
            ))}
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