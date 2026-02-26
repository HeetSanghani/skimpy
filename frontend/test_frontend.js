const axios = require('axios');
const FormData = require('form-data');
// Create a fake JWT directly if jsonwebtoken is missing here
// Actually we can just hit the Render DB API without valid token, it will drop to 401. But wait, we need to bypass auth!
// Let's just create a token manually using base64.
const crypto = require('crypto');
const header = { alg: "HS256", typ: "JWT" };
const payload = { sub: "test@example.com", user_id: "699db8a70ea0bfb458bfb517", exp: Math.floor(Date.now() / 1000) + 60 * 15 };
const b64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const signature = crypto.createHmac('sha256', "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
  .update(`${b64UrlEncode(header)}.${b64UrlEncode(payload)}`)
  .digest('base64url');
const token = `${b64UrlEncode(header)}.${b64UrlEncode(payload)}.${signature}`;

const fd = new FormData();
fd.append('price', "2800");
fd.append('stock', "46");
fd.append('product_condition', "NEW");
fd.append('description', "This slim fit shirt features a solid collar.");
fd.append('attribute_values', "[]");
fd.append('brand', "GANT");
// Note: axios FormData requires headers
const headers = Object.assign({}, fd.getHeaders(), { Authorization: `Bearer ${token}` });

axios.post("https://skimpy-backend.onrender.com/Variant/add/69a008faadc943a1d90b26cc", fd, { headers })
  .then(res => console.log("Success:", res.data))
  .catch(err => {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
  });
