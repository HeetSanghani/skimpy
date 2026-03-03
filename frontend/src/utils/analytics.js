/**
 * Analytics utility — lightweight event tracking stub.
 * Ready to plug in Google Analytics 4, Mixpanel, or PostHog.
 */

const IS_PROD = import.meta.env.PROD;

/**
 * Track a custom event.
 * @param {string} event  - Event name e.g. "product_view"
 * @param {object} [data] - Event properties
 */
export function trackEvent(event, data = {}) {
  // Google Analytics 4
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, data);
  }

  // Development logging
  if (!IS_PROD) {
    console.log(`[Analytics] ${event}`, data);
  }
}

// Convenience helpers
export const Analytics = {
  productView:   (productId, productName) => trackEvent("product_view", { product_id: productId, product_name: productName }),
  addToCart:     (productId, productName, price) => trackEvent("add_to_cart", { product_id: productId, product_name: productName, value: price, currency: "INR" }),
  purchase:      (orderId, value) => trackEvent("purchase", { transaction_id: orderId, value, currency: "INR" }),
  listingCreated:(productId, categoryName) => trackEvent("listing_created", { product_id: productId, category: categoryName }),
  sellerSignup:  (userId) => trackEvent("seller_signup", { user_id: userId }),
  search:        (query, resultCount) => trackEvent("search", { search_term: query, result_count: resultCount }),
};
