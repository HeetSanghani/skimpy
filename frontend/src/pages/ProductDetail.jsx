import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchProductById, deleteProduct, updateProduct } from "../api/settingsApi";
import axios from "axios";
// import { fetchAllProducts } from "../api/settingsApi";

const BASE_URL = "http://127.0.0.1:8000";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // NEW: For variants and attributes
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [allAttributeValues, setAllAttributeValues] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Variant inline editing state
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [variantForm, setVariantForm] = useState({ price: "", stock: "", selectedAttributes: {} });

  // Removed: other products with variants state and editing helpers
  // const [productsWithVariants, setProductsWithVariants] = useState([]);
  // const [loadingOther, setLoadingOther] = useState(false);
  // const [editingRowId, setEditingRowId] = useState(null);
  // const [rowForm, setRowForm] = useState({ product_name: "", price: "", stock: "", product_condition: "NEW", description: "" });

  // Edited product state
  const [editForm, setEditForm] = useState({});
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchProductById(productId)
      .then((data) => {
        setProduct(data);
        setEditForm({ ...data });
      })
      .catch(() => {
        setError("Not found.");
        setProduct(null);
      })
      .finally(() => setLoading(false));
    // Fetch variants and attribute values
    fetchVariants();
    fetchAllAttributeValues();
    // loadProductsWithVariants();
    // eslint-disable-next-line
  }, [productId]);

  // Refetch attributes when product, allAttributeValues, and variants are available
  useEffect(() => {
    if (product && allAttributeValues.length > 0 && variants.length > 0) {
      fetchAttributes(product, allAttributeValues, variants);
    }
  }, [product, allAttributeValues, variants]);

  const fetchVariants = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/Variant/list/${productId}`);
      setVariants(res.data.variants || []);
    } catch {
      setVariants([]);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAttributes = async (productData = null, attributeValues = null, variantsData = null) => {
    setLoadingAttributes(true);
    try {
      // Use productData parameter if provided, otherwise use product state
      const productToUse = productData || product;
      // Use attributeValues parameter if provided, otherwise use allAttributeValues state
      const valuesToUse = attributeValues || allAttributeValues;
      // Use variantsData parameter if provided, otherwise use variants state
      const variantsToUse = variantsData || variants;
      let fetchedAttributes = [];
      
      console.log("Fetching attributes for product:", productToUse);
      
      // Debug: Log the full product structure
      console.log("Full product structure:", JSON.stringify(productToUse, null, 2));
      console.log("category_id:", productToUse?.category_id);
      console.log("category:", productToUse?.category);
      console.log("category._id:", productToUse?.category?._id);
      console.log("category.id:", productToUse?.category?.id);
      
      // Fetch attributes specific to this product's category
      // Try multiple ways to get category ID
      const categoryId = productToUse?.category_id || 
                         productToUse?.category_id?._id || 
                         productToUse?.category?._id || 
                         productToUse?.category?.id ||
                         productToUse?.category?._id?._id;
      
      console.log("Resolved categoryId:", categoryId);
      
      if (categoryId) {
        console.log("Fetching attributes by category:", categoryId);
        try {
          const res = await axios.get(`${BASE_URL}/Attribute/by_category/${categoryId}`, {
            headers: getAuthHeaders()
          });
          console.log("Attributes response:", res.data);
          console.log("Response status:", res.status);
          // Try different possible response structures
          fetchedAttributes = res.data?.attributes || res.data?.data || res.data || [];
          console.log("Extracted attributes:", fetchedAttributes.length, fetchedAttributes);
        } catch (apiError) {
          console.error("API Error fetching by category:", apiError);
          console.error("API Error response:", apiError.response);
          // Fallback: Fetch all attributes but filter by what variants use
          console.log("Falling back to all attributes, will filter by variant attributes");
          const res = await axios.get(`${BASE_URL}/Attribute/`, {
            headers: getAuthHeaders()
          });
          const allAttributes = res.data?.attributes || res.data?.data || res.data || [];
          
          // Filter attributes to only those used by this product's variants
          if (variantsToUse.length > 0) {
            // Get all attribute names used by variants
            const variantAttributeNames = new Set();
            variantsToUse.forEach(variant => {
              (variant.attributes || []).forEach(attr => {
                variantAttributeNames.add(attr.attribute_name);
              });
            });
            
            console.log("Variant attribute names:", Array.from(variantAttributeNames));
            // Filter attributes to only those used by variants
            fetchedAttributes = allAttributes.filter(attr => 
              variantAttributeNames.has(attr.name)
            );
            console.log("Filtered attributes for variants:", fetchedAttributes.length);
          } else {
            // If no variants, use all attributes (shouldn't happen but handle it)
            fetchedAttributes = allAttributes;
          }
        }
      } else {
        // Fallback to all attributes if category not available, but filter by variants
        console.log("No category found, fetching all attributes and filtering by variants");
        const res = await axios.get(`${BASE_URL}/Attribute/`, {
          headers: getAuthHeaders()
        });
        console.log("All attributes response:", res.data);
        const allAttributes = res.data?.attributes || res.data?.data || res.data || [];
        
        // Filter attributes to only those used by this product's variants
        if (variantsToUse.length > 0) {
          // Get all attribute names used by variants
          const variantAttributeNames = new Set();
          variantsToUse.forEach(variant => {
            (variant.attributes || []).forEach(attr => {
              variantAttributeNames.add(attr.attribute_name);
            });
          });
          
          console.log("Variant attribute names:", Array.from(variantAttributeNames));
          // Filter attributes to only those used by variants
          fetchedAttributes = allAttributes.filter(attr => 
            variantAttributeNames.has(attr.name)
          );
          console.log("Filtered attributes for variants:", fetchedAttributes.length);
        } else {
          // If no variants, use all attributes (shouldn't happen but handle it)
          fetchedAttributes = allAttributes;
        }
      }
      
      console.log("Fetched attributes:", fetchedAttributes.length, fetchedAttributes);
      console.log("Attribute values to use:", valuesToUse?.length || 0);
      
      // Always populate values from attributeValues to ensure they're available
      if (valuesToUse && valuesToUse.length > 0) {
        fetchedAttributes = fetchedAttributes.map(attr => {
          // Get values for this attribute from attributeValues
          const values = valuesToUse
            .filter(av => av.attribute_id === attr._id || av.attribute_id === attr.id)
            .map(av => av.value);
          
          // If attribute already has values, merge them (avoid duplicates)
          const existingValues = attr.values || [];
          const mergedValues = [...new Set([...existingValues, ...values])];
          
          const finalValues = mergedValues.length > 0 ? mergedValues : existingValues;
          console.log(`Attribute ${attr.name}: values=${finalValues.length}`, finalValues);
          
          return { ...attr, values: finalValues };
        });
      } else {
        // If no attributeValues, at least ensure attributes have empty values array
        fetchedAttributes = fetchedAttributes.map(attr => ({
          ...attr,
          values: attr.values || []
        }));
      }
      
      console.log("Final attributes to set:", fetchedAttributes.length, fetchedAttributes);
      setAttributes(fetchedAttributes);
      
      if (fetchedAttributes.length === 0) {
        console.warn("No attributes found! Check API response structure.");
      }
      
      return fetchedAttributes; // Return fetched attributes
    } catch (error) {
      console.error("Error fetching attributes:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Full error:", error);
      setAttributes([]);
      return []; // Return empty array on error
    } finally {
      setLoadingAttributes(false);
    }
  };

  const fetchAllAttributeValues = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/AttributeValue/`, {
        headers: getAuthHeaders()
      });
      setAllAttributeValues(res.data?.attribute_values || res.data || []);
      console.log("Fetched attribute values:", res.data?.attribute_values?.length || 0);
    } catch (error) {
      console.error("Error fetching attribute values:", error);
      setAllAttributeValues([]);
    }
  };

  // Removed: loadProductsWithVariants, startRowEdit, saveRowEdit

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    setDeleting(true);
    try {
      await deleteProduct(productId);
      alert("Product deleted.");
      navigate("/seller/dashboard?tab=listings");
    } catch (e) {
      alert("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Update PRODUCT details (core fields, not variants)
  const handleUpdate = async () => {
    try {
      await updateProduct(productId, editForm);
      alert("Product updated");
      setEditMode(false);
      // reload product data
      fetchProductById(productId).then(setProduct);
    } catch {
      alert("Update failed");
    }
  };

  // Image management (delete uploaded image; upload not shown here for brevity)
  const handleDeleteImage = (img) => {
    setEditForm({
      ...editForm,
      images: editForm.images.filter((i) => i !== img),
    });
  };

  // Start editing a variant
  const startVariantEdit = async (v) => {
    if (!product) {
      alert("Product data not loaded yet. Please wait.");
      return;
    }
    
    // Always fetch attributes when starting edit to ensure they're loaded
    console.log("Starting edit, fetching attributes...", { product, allAttributeValues: allAttributeValues.length, variants: variants.length });
    const fetchedAttrs = await fetchAttributes(product, allAttributeValues, variants);
    
    // Wait for React state to update
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Only enable edit if we have attributes
    if (fetchedAttrs && fetchedAttrs.length > 0) {
      console.log("Attributes fetched successfully:", fetchedAttrs.length);
      setEditingVariantId(v.id || v._id);
      // Convert variant.attributes array to a map: attribute_name -> value_name
      const attrMap = {};
      (v.attributes || []).forEach(attr => {
        attrMap[attr.attribute_name] = attr.value_name;
      });
      setVariantForm({ 
        price: v.price ?? "", 
        stock: v.stock ?? "",
        selectedAttributes: attrMap
      });
    } else {
      console.warn("No attributes fetched, cannot enable edit mode");
      alert("Failed to load attributes. Please try again.");
    }
  };

  const cancelVariantEdit = () => {
    setEditingVariantId(null);
    setVariantForm({ price: "", stock: "", selectedAttributes: {} });
  };

  const handleAttributeChange = (attributeName, value) => {
    setVariantForm(prev => ({
      ...prev,
      selectedAttributes: { ...prev.selectedAttributes, [attributeName]: value }
    }));
  };

  const saveVariantEdit = async () => {
    if (!editingVariantId) return;
    
    // Convert selectedAttributes to attribute_id/value_id pairs
    const attributePairs = [];
    const findAttributeByName = (name) => attributes.find(a => a.name === name);
    const findValueId = (attributeId, valueName) => {
      return allAttributeValues.find(v => v.attribute_id === attributeId && v.value === valueName)?._id;
    };

    for (const [attrName, valueName] of Object.entries(variantForm.selectedAttributes)) {
      if (valueName) {
        const attr = findAttributeByName(attrName);
        if (attr) {
          const valueId = findValueId(attr._id, valueName);
          if (valueId) {
            attributePairs.push({ attribute_id: attr._id, value_id: valueId });
          }
        }
      }
    }

    const fd = new FormData();
    if (variantForm.price !== undefined && variantForm.price !== null) fd.append("price", variantForm.price);
    if (variantForm.stock !== undefined && variantForm.stock !== null) fd.append("stock", variantForm.stock);
    if (attributePairs.length > 0) {
      fd.append("attribute_values", JSON.stringify(attributePairs));
    }
    
    try {
      await axios.put(`${BASE_URL}/Variant/update/${editingVariantId}`, fd, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });
      await fetchVariants();
      cancelVariantEdit();
    } catch (e) {
      console.error("Variant update error:", e);
      alert("Failed to update variant");
    }
  };

  // Variant update/delete (stub, can be expanded easily)
  const handleVariantDelete = async (variantId) => {
    if (!window.confirm("Delete this variant?")) return;
    try {
      await axios.delete(`${BASE_URL}/Variant/delete/${variantId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchVariants();
    } catch {
      alert("Failed to delete variant");
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto py-10 px-4">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : !product ? (
          <div className="text-center">Product not found.</div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8">
            {/* Product Images */}
            <div className="mb-6">
              <div className="flex gap-2 mb-2">
                {(editForm.images || []).map((img, idx) => (
                  <div key={idx} className="relative group">
                    {/* If image is backend file, prefix as needed or fix src accordingly */}
                    <img
                      src={img.startsWith("http") ? img : `http://127.0.0.1:8000/${img}`}
                      alt={`product-img-${idx}`}
                      className="w-24 h-24 object-cover rounded border"
                    />
                    {editMode && (
                      <button
                        onClick={() => handleDeleteImage(img)}
                        className="absolute top-1 right-1 p-1 bg-white/80 text-red-600 rounded-full opacity-0 group-hover:opacity-100 border"
                        title="Remove image"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* (optional) file input for upload can go here */}
            </div>
            {/* Product fields (editable in editMode) */}
            {(
              editMode ? (
                <>
                  <input
                    name="product_name"
                    value={editForm.product_name}
                    onChange={handleInputChange}
                    className="mb-2 w-full border rounded p-2"
                  />
                  <textarea
                    name="description"
                    value={editForm.description ?? ""}
                    onChange={handleInputChange}
                    className="mb-2 w-full border rounded p-2"
                  />
                  <input
                    name="price"
                    type="number"
                    value={editForm.price}
                    onChange={handleInputChange}
                    className="mb-2 w-1/2 border rounded p-2"
                  />
                  <input
                    name="stock"
                    type="number"
                    value={editForm.stock}
                    onChange={handleInputChange}
                    className="mb-2 w-1/2 border rounded p-2"
                  />
                  <input
                    name="brand"
                    value={editForm.brand || ""}
                    onChange={handleInputChange}
                    placeholder="Brand (optional)"
                    className="mb-2 w-1/2 border rounded p-2"
                  />
                  {/* ...additional fields... */}
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-4">{product.product_name}</h1>
                  <p className="mb-2 text-lg">{product.description}</p>
                  <div className="mb-2">Brand: {product.brand}</div>
                  <div className="mb-2">Condition: {product.product_condition}</div>
                </>
              )
            )}

            {/* Variants section */}
            <div className="mt-8">
              <h2 className="font-bold text-2xl mb-4">Variants</h2>
              {variants.length === 0 && <div>No variants.</div>}
              {variants.length > 0 && (
                <table className="min-w-full border text-left mb-6">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4">SKU</th>
                      <th className="py-2 px-4">Price</th>
                      <th className="py-2 px-4">Stock</th>
                      <th className="py-2 px-4">Attributes</th>
                      <th className="py-2 px-4">Images</th>
                      <th className="py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id} className="border-t">
                        <td className="py-2 px-4">{variant.sku}</td>
                        <td className="py-2 px-4">
                          {editingVariantId === (variant.id || variant._id) ? (
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-24"
                              value={variantForm.price}
                              onChange={e => setVariantForm(f => ({ ...f, price: e.target.value }))}
                            />
                          ) : (
                            <>${variant.price}</>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {editingVariantId === (variant.id || variant._id) ? (
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-20"
                              value={variantForm.stock}
                              onChange={e => setVariantForm(f => ({ ...f, stock: e.target.value }))}
                            />
                          ) : (
                            <>{variant.stock}</>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          {editingVariantId === (variant.id || variant._id) ? (
                            <div className="space-y-2">
                              {(() => {
                                // Debug: Log current state
                                console.log("Rendering attributes dropdown, attributes.length:", attributes?.length || 0);
                                console.log("attributes array:", attributes);
                                
                                if (attributes && attributes.length > 0) {
                                  return attributes.map((attr) => {
                                    const attrValues = attr.values || [];
                                    const currentValue = variantForm.selectedAttributes[attr.name] || "";
                                    if (!attr.name) {
                                      console.warn("Attribute without name:", attr);
                                      return null;
                                    }
                                    return (
                                      <div key={attr._id || attr.name} className="flex items-center gap-2">
                                        <label className="text-sm font-medium w-24">{attr.name}:</label>
                                        <select
                                          className="border rounded px-2 py-1 text-sm flex-1"
                                          value={currentValue}
                                          onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                                        >
                                          <option value="">Select {attr.name}</option>
                                          {attrValues.length > 0 ? (
                                            attrValues.map((val) => (
                                              <option key={val} value={val}>{val}</option>
                                            ))
                                          ) : (
                                            <option disabled>No values available</option>
                                          )}
                                        </select>
                                      </div>
                                    );
                                  });
                                } else {
                                  return (
                                    <div className="text-gray-500 text-sm">
                                      {loadingAttributes ? (
                                        "Loading attributes..."
                                      ) : (
                                        <>
                                          No attributes loaded ({attributes?.length || 0} found)
                                          <button 
                                            onClick={async () => {
                                              if (product) {
                                                await fetchAttributes(product, allAttributeValues, variants);
                                              }
                                            }}
                                            className="ml-2 text-blue-600 underline text-xs hover:text-blue-800"
                                          >
                                            Retry
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          ) : (
                            <div>
                              {(variant.attributes || []).map((attr, idx) => (
                                <div key={idx} className="mb-1">
                                  <span className="font-semibold">{attr.attribute_name}:</span>{" "}
                                  <span>{attr.value_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {(variant.images || []).map((img, idx) => (
                              <img
                                key={idx}
                                src={img.startsWith("http") ? img : `http://127.0.0.1:8000/${img}`}
                                alt=""
                                className="w-10 h-10 rounded border"
                              />
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          {editingVariantId === (variant.id || variant._id) ? (
                            <>
                              <button onClick={saveVariantEdit} className="text-green-700 mr-2 hover:underline">Save</button>
                              <button onClick={cancelVariantEdit} className="text-gray-700 hover:underline">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="text-blue-700 mr-2 hover:underline" onClick={() => startVariantEdit(variant)}>Edit</button>
                              <button
                                className="text-red-700 hover:underline"
                                onClick={() => handleVariantDelete(variant.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Removed earlier: All Attributes & Values legend and Other Products With Variants table */}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              {editMode ? (
                <>
                  <button
                    onClick={handleUpdate}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                  <button onClick={() => setEditMode(false)} className="px-6 py-2 border rounded">Cancel</button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => navigate(-1)} className="px-6 py-2 ml-auto border rounded">Back</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
