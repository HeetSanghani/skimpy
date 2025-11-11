import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchProductById, deleteProduct, updateProduct } from "../api/settingsApi";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Variants + Attributes
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]); // attributes shaped like { _id, name, values: [] }
  const [allAttributeValues, setAllAttributeValues] = useState([]); // items shaped { _id, attribute_id, value }
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  // Variant inline editing
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [variantForm, setVariantForm] = useState({ sku: "", price: "", stock: "", selectedAttributes: {} });

  // Product edit form
  const [editForm, setEditForm] = useState({
    product_name: "",
    description: "",
    brand: "",
    images: []
  });
  const [editMode, setEditMode] = useState(false);

  // --- Helpers ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Normalize product shape into our editForm keys
  const normalizeProductToForm = (p) => ({
    product_name: p?.product_name ?? p?.name ?? "",
    description: p?.description ?? "",
    brand: p?.brand ?? p?.manufacturer ?? "",
    images: p?.images ?? p?.images_list ?? []
  });

  // --- Fetch product, variants, attribute-values on mount / productId change ---
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    fetchProductById(productId)
      .then((data) => {
        setProduct(data);
        // initialize editForm from product but do not forcibly open editMode
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

  // Keep editForm in sync if product gets refetched while not actively editing
  useEffect(() => {
    if (!product) return;
    if (!editMode) {
      setEditForm(prev => ({ ...prev, ...normalizeProductToForm(product) }));
    }
  }, [product, editMode]);

  // Fetch variants
  const fetchVariants = async (pid = productId) => {
    try {
      const res = await axios.get(`${BASE_URL}/Variant/list/${pid}`, { headers: getAuthHeaders() });
      // Support both { variants: [...] } and direct [...variantItems...] responses
      const v = res.data?.variants ?? res.data ?? [];
      setVariants(Array.isArray(v) ? v : []);
    } catch (err) {
      console.error("fetchVariants error:", err);
      setVariants([]);
    }
  };

  // Fetch all attribute values (flat list)
  const fetchAllAttributeValues = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/AttributeValue/`, { headers: getAuthHeaders() });
      // user-provided shape: { attribute_values: [ ... ] }
      const vals = res.data?.attribute_values ?? res.data ?? [];
      setAllAttributeValues(Array.isArray(vals) ? vals : []);
    } catch (err) {
      console.error("fetchAllAttributeValues error:", err);
      setAllAttributeValues([]);
    }
  };

  // Fetch attributes for the product (uses by_category endpoint when possible)
  const fetchAttributes = async (productToUse = product, attributeValues = allAttributeValues, variantsToUse = variants) => {
    setLoadingAttributes(true);
    try {
      // Resolve category id in a few likely places
      const categoryId =
        productToUse?.category_id ??
        productToUse?.category?.id ??
        productToUse?.category?._id ??
        (productToUse?.category_id?._id) ??
        null;

      let fetchedAttributes = [];

      if (categoryId) {
        try {
          const res = await axios.get(`${BASE_URL}/Attribute/by_category/${categoryId}`, {
            headers: getAuthHeaders()
          });
          // Expected shape from you: { attributes: [ { _id, name, values: [] }, ... ] }
          fetchedAttributes = res.data?.attributes ?? res.data?.data ?? res.data ?? [];
        } catch (err) {
          // fallback to all attributes and filter by variants
          console.warn("by_category failed, will fetch all attributes and filter by variants", err);
          const resAll = await axios.get(`${BASE_URL}/Attribute/`, { headers: getAuthHeaders() });
          const allAttrs = resAll.data?.attributes ?? resAll.data ?? [];
          if (variantsToUse?.length > 0) {
            const variantAttrNames = new Set();
            variantsToUse.forEach(v => (v.attributes || []).forEach(a => variantAttrNames.add(a.attribute_name)));
            fetchedAttributes = (allAttrs || []).filter(a => variantAttrNames.has(a.name));
          } else {
            fetchedAttributes = allAttrs;
          }
        }
      } else {
        // No category: fetch all and filter by variants (if available)
        const resAll = await axios.get(`${BASE_URL}/Attribute/`, { headers: getAuthHeaders() });
        const allAttrs = resAll.data?.attributes ?? resAll.data ?? [];
        if (variantsToUse?.length > 0) {
          const variantAttrNames = new Set();
          variantsToUse.forEach(v => (v.attributes || []).forEach(a => variantAttrNames.add(a.attribute_name)));
          fetchedAttributes = (allAttrs || []).filter(a => variantAttrNames.has(a.name));
        } else {
          fetchedAttributes = allAttrs;
        }
      }

      // Merge in attribute values from attributeValues list (avoid duplicates)
      if (attributeValues && attributeValues.length > 0) {
        fetchedAttributes = (fetchedAttributes || []).map(attr => {
          const valuesFromList = attributeValues
            .filter(av => av.attribute_id === attr._id || av.attribute_id === attr.id)
            .map(av => av.value);
          const existing = attr.values ?? [];
          const merged = Array.from(new Set([...existing, ...valuesFromList]));
          return { ...attr, values: merged };
        });
      } else {
        fetchedAttributes = (fetchedAttributes || []).map(attr => ({ ...attr, values: attr.values ?? [] }));
      }

      setAttributes(Array.isArray(fetchedAttributes) ? fetchedAttributes : []);
      return fetchedAttributes;
    } catch (err) {
      console.error("fetchAttributes error:", err);
      setAttributes([]);
      return [];
    } finally {
      setLoadingAttributes(false);
    }
  };

  // --- Handlers for product edit / update / delete ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await updateProduct(productId, editForm);
      // refresh product & variants after update
      const refreshed = await fetchProductById(productId);
      setProduct(refreshed);
      setEditForm(normalizeProductToForm(refreshed));
      setEditMode(false);
      // refresh variants in case product fields affect them
      fetchVariants();
      alert("Product updated");
    } catch (err) {
      console.error("handleUpdate error:", err);
      alert("Update failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    setDeleting(true);
    try {
      await deleteProduct(productId);
      alert("Product deleted");
      navigate("/seller/dashboard?tab=listings");
    } catch (err) {
      console.error("handleDelete error:", err);
      alert("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteImage = (img) => {
    setEditForm(prev => ({ ...prev, images: (prev.images || []).filter(i => i !== img) }));
  };

  // Enter edit mode (seed form reliably)
  const enterEditMode = () => {
    setEditForm(normalizeProductToForm(product ?? {}));
    setEditMode(true);
  };

  // --- Variant edit: start / cancel / save / delete ---
  const startVariantEdit = async (v) => {
    if (!product) {
      alert("Product data not loaded yet. Please wait.");
      return;
    }

    // ensure attributes are loaded first (we'll try to fetch with current data)
    const fetchedAttrs = await fetchAttributes(product, allAttributeValues, variants);
    if (!fetchedAttrs || fetchedAttrs.length === 0) {
      alert("Failed to load attributes for variant editing.");
      return;
    }

    // map variant attributes to { attributeName: valueName }
    const attrMap = {};
    (v.attributes || []).forEach(a => {
      attrMap[a.attribute_name] = a.value_name;
    });

    setVariantForm({
      sku: v.sku ?? "",
      price: v.price ?? "",
      stock: v.stock ?? "",
      selectedAttributes: attrMap
    });
    setEditingVariantId(v.id ?? v._id);
  };

  const cancelVariantEdit = () => {
    setEditingVariantId(null);
    setVariantForm({ sku: "", price: "", stock: "", selectedAttributes: {} });
  };

  const handleAttributeChange = (attributeName, value) => {
    setVariantForm(prev => ({
      ...prev,
      selectedAttributes: { ...prev.selectedAttributes, [attributeName]: value }
    }));
  };

  const saveVariantEdit = async () => {
    if (!editingVariantId) return;

    // Convert selectedAttributes to attribute_id/value_id pairs expected by backend
    const attributePairs = [];
    const findAttributeByName = (name) => attributes.find(a => a.name === name || a._id === name);
    const findValueId = (attributeId, valueName) => {
      const v = allAttributeValues.find(av => (av.attribute_id === attributeId || av.attribute_id === attributeId) && av.value === valueName);
      return v?._id;
    };

    for (const [attrName, valueName] of Object.entries(variantForm.selectedAttributes || {})) {
      if (!valueName) continue;
      const attr = findAttributeByName(attrName);
      if (!attr) continue;
      const valueId = findValueId(attr._id, valueName);
      if (!valueId) continue;
      attributePairs.push({ attribute_id: attr._id, value_id: valueId });
    }

    try {
      const fd = new FormData();
      if (variantForm.sku !== undefined && variantForm.sku !== null) fd.append("sku", variantForm.sku);
      if (variantForm.price !== undefined && variantForm.price !== null) fd.append("price", variantForm.price);
      if (variantForm.stock !== undefined && variantForm.stock !== null) fd.append("stock", variantForm.stock);
      if (attributePairs.length > 0) fd.append("attribute_values", JSON.stringify(attributePairs));

      await axios.put(`${BASE_URL}/Variant/update/${editingVariantId}`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      await fetchVariants();
      cancelVariantEdit();
      alert("Variant updated");
    } catch (err) {
      console.error("saveVariantEdit error:", err);
      alert("Failed to update variant");
    }
  };

  const handleVariantDelete = async (variantId) => {
    if (!window.confirm("Delete this variant?")) return;
    try {
      await axios.delete(`${BASE_URL}/Variant/delete/${variantId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchVariants();
      alert("Variant deleted");
    } catch (err) {
      console.error("handleVariantDelete error:", err);
      alert("Failed to delete variant");
    }
  };

  // --- Render helpers ---
  const renderFieldIfPresent = (label, value) => (
    <div className="flex items-start mb-2">
      <label className="w-32 font-semibold">{label}:</label>
      <div>{(value !== undefined && value !== null) ? (value || "—") : null}</div>
    </div>
  );

  // --- UI ---
  return (
    <>
      <Navbar />
      <div className="w-full py-10 px-4">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : !product ? (
          <div className="text-center">Product not found.</div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8">
            {/* Images */}
            <div className="mb-6">
              <div className="flex gap-2 mb-2">
                {(editForm.images || []).map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={typeof img === "string" && img.startsWith("http") ? img : `${BASE_URL}/${img}`}
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
            </div>

            {/* Product fields */}
            {editMode ? (
              <>
                <div className="flex items-center mb-2">
                  <label className="w-32">Name:</label>
                  <input
                    name="product_name"
                    autoComplete="off"
                    value={editForm.product_name}
                    onChange={handleInputChange}
                    className="flex-1 border rounded p-2"
                  />
                </div>

                <div className="flex items-start mb-2">
                  <label className="w-32 pt-2">Description:</label>
                  <textarea
                    name="description"
                    autoComplete="off"
                    value={editForm.description ?? ""}
                    onChange={handleInputChange}
                    className="flex-1 border rounded p-2"
                  />
                </div>

                <div className="flex items-center mb-2">
                  <label className="w-32">Brand:</label>
                  <input
                    name="brand"
                    autoComplete="off"
                    value={editForm.brand || ""}
                    onChange={handleInputChange}
                    placeholder="Brand (optional)"
                    className="flex-1 border rounded p-2"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Show fields even if their value is an empty string (so user sees optional field exists) */}
                {renderFieldIfPresent("Name", product.product_name ?? product.name)}
                {renderFieldIfPresent("Description", product.description)}
                {renderFieldIfPresent("Brand", product.brand ?? product.manufacturer)}
              </>
            )}

            {/* Variants */}
            <div className="mt-8">
              <h2 className="font-bold text-2xl mb-4">Variants</h2>
              {variants.length === 0 ? (
                <div>No variants.</div>
              ) : (
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
                    {variants.map((variant) => {
                      const variantId = variant.id ?? variant._id;
                      return (
                        <tr key={variantId} className="border-t">
                          <td className="py-2 px-4">
                            {editingVariantId === variantId ? (
                              <input
                                type="text"
                                className="border rounded px-2 py-1 w-36"
                                value={variantForm.sku}
                                onChange={e => setVariantForm(f => ({ ...f, sku: e.target.value }))}
                                placeholder="SKU"
                              />
                            ) : (
                              <>{variant.sku}</>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {editingVariantId === variantId ? (
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
                            {editingVariantId === variantId ? (
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
                            {editingVariantId === variantId ? (
                              <div className="space-y-2">
                                {attributes && attributes.length > 0 ? (
                                  attributes.map(attr => {
                                    const attrValues = attr.values || [];
                                    const currentValue = variantForm.selectedAttributes[attr.name] || "";
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
                                            attrValues.map(val => <option key={val} value={val}>{val}</option>)
                                          ) : (
                                            <option disabled>No values available</option>
                                          )}
                                        </select>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-gray-500 text-sm">
                                    {loadingAttributes ? "Loading attributes..." : "No attributes loaded."}
                                    {!loadingAttributes && (
                                      <button
                                        onClick={() => fetchAttributes(product, allAttributeValues, variants)}
                                        className="ml-2 text-blue-600 underline text-xs hover:text-blue-800"
                                      >
                                        Retry
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                {(variant.attributes || []).map((a, idx) => (
                                  <div key={idx} className="mb-1">
                                    <span className="font-semibold">{a.attribute_name}:</span>{" "}
                                    <span>{a.value_name}</span>
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
                                  src={typeof img === "string" && img.startsWith("http") ? img : `${BASE_URL}/${img}`}
                                  alt=""
                                  className="w-10 h-10 rounded border"
                                />
                              ))}
                            </div>
                          </td>

                          <td className="py-2 px-4">
                            {editingVariantId === variantId ? (
                              <>
                                <button onClick={saveVariantEdit} className="text-green-700 mr-2 hover:underline">Save</button>
                                <button onClick={cancelVariantEdit} className="text-gray-700 hover:underline">Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="text-blue-700 mr-2 hover:underline" onClick={() => startVariantEdit(variant)}>Edit</button>
                                <button className="text-red-700 hover:underline" onClick={() => handleVariantDelete(variantId)}>Delete</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8 items-center">
              {editMode ? (
                <>
                  <button onClick={handleUpdate} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Changes</button>
                  <button onClick={() => { setEditMode(false); setEditForm(normalizeProductToForm(product)); }} className="px-6 py-2 border rounded">Cancel</button>
                </>
              ) : (
                <button onClick={enterEditMode} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
              )}

              <button onClick={handleDelete} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700" disabled={deleting}>
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
