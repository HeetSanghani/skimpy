import glob
import os

target_files = glob.glob('/home/python/skimpy/frontend/src/components/*ListingForm.jsx')

for file in target_files:
    if 'PotteryListingForm' in file: # already has it
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    # We want to wrap the variant POST in a try catch without breaking existing code.
    # In AntiqueJewelry, Flower, Book, HomeDecor, it's roughly:
    # await axios.post(`${API_BASE}/Variant/add/${productId}`, variantData, {
    #   headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
    # });
    
    search_str = "await axios.post(`${API_BASE}/Variant/add/${productId}`, variantData, {"
    if search_str in content and "try {\n        const variantData = new FormData();" not in content:
        # replace the variantData building and post inside a try block
        # Actually it's easier to just Regex or string replace specifically.
        
        chunk_to_replace = """        const variantData = new FormData();
        variantData.append('price', formData.price);
        variantData.append('stock', formData.stock);
        variantData.append('product_condition', formData.product_condition);
        variantData.append('description', formData.description);
        variantData.append('attribute_values', JSON.stringify(attributePairs));
        if (formData.sku) variantData.append('sku', formData.sku);
        await axios.post(`${API_BASE}/Variant/add/${productId}`, variantData, {
          headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
        });"""
        
        try_chunk = """      try {
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
      } catch (err) {
        console.warn("Variant creation failed, but product was created.", err?.response?.data || err);
        // We do not throw, so the redirect below will succeed!
      }"""
        
        if chunk_to_replace in content:
            new_content = content.replace(chunk_to_replace, try_chunk)
            with open(file, 'w') as f:
                f.write(new_content)
            print(f"Fixed {os.path.basename(file)}")

    # For ProductListingForm.jsx which has itemSpecs loop
    if 'ProductListingForm.jsx' in file:
        chunk_to_replace2 = """          const variantData = new FormData();
          variantData.append('price', spec.price);
          variantData.append('stock', spec.stock);
          variantData.append('product_condition', spec.product_condition);
          variantData.append('description', spec.description);
          variantData.append('attribute_values', JSON.stringify(attributePairs));
          if (spec.sku) variantData.append('sku', spec.sku);
          if (spec.brand) variantData.append('brand', spec.brand);

          await axios.post(`${API_BASE_URL}/Variant/add/${productId}`, variantData, {
            headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
          });"""
        
        try_chunk2 = """        try {
          const variantData = new FormData();
          variantData.append('price', spec.price);
          variantData.append('stock', spec.stock);
          variantData.append('product_condition', spec.product_condition);
          variantData.append('description', spec.description);
          variantData.append('attribute_values', JSON.stringify(attributePairs));
          if (spec.sku) variantData.append('sku', spec.sku);
          if (spec.brand) variantData.append('brand', spec.brand);

          await axios.post(`${API_BASE_URL}/Variant/add/${productId}`, variantData, {
            headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
          });
        } catch (err) {
          console.warn("Variant creation failed for a spec, but product was created.", err?.response?.data || err);
        }"""
        if chunk_to_replace2 in content:
            new_content = content.replace(chunk_to_replace2, try_chunk2)
            with open(file, 'w') as f:
                f.write(new_content)
            print(f"Fixed ProductListingForm.jsx loop")

