/**
 * useSEO — sets page <title> and meta tags dynamically (no external lib needed).
 * Usage:
 *   useSEO({ title: "Product Name", description: "...", image: "https://..." });
 */
import { useEffect } from "react";

const SITE_NAME = "Skimpy Marketplace";
const DEFAULT_DESCRIPTION =
  "Discover unique thrifted finds, handcrafted treasures, antiques, books, and more on Skimpy — India's curated online marketplace.";
const DEFAULT_IMAGE = "https://skimpy.vercel.app/og-default.png";
const SITE_URL = "https://skimpy.vercel.app";

function setMeta(name, content, prop = false) {
  if (!content) return;
  const attr = prop ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonical = url ? `${SITE_URL}${url}` : SITE_URL;
    const truncatedDesc = description.length > 160 ? description.slice(0, 157) + "..." : description;

    // Page title
    document.title = fullTitle;

    // Standard meta
    setMeta("description", truncatedDesc);
    setMeta("robots", "index, follow");
    setMeta("theme-color", "#6366f1");

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", truncatedDesc, true);
    setMeta("og:image", image, true);
    setMeta("og:url", canonical, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", SITE_NAME, true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", truncatedDesc);
    setMeta("twitter:image", image);

    // Canonical
    setLink("canonical", canonical);
  }, [title, description, image, url, type]);
}
