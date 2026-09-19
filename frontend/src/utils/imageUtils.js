export const getFallbackImageByName = (name = "") => {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("sneaker") || lower.includes("shoe") || lower.includes("kicks") || lower.includes("footwear")) {
    return "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500";
  }
  if (lower.includes("watch") || lower.includes("chronograph") || lower.includes("luxury")) {
    return "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500";
  }
  if (lower.includes("tote") || lower.includes("bag") || lower.includes("leather")) {
    return "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500";
  }
  if (lower.includes("earbud") || lower.includes("headphone") || lower.includes("audio") || lower.includes("tech") || lower.includes("wireless")) {
    return "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500";
  }
  if (lower.includes("vase") || lower.includes("decor") || lower.includes("ceramic") || lower.includes("home")) {
    return "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500";
  }
  if (lower.includes("kurti") || lower.includes("kurta") || lower.includes("apparel") || lower.includes("shirt") || lower.includes("dress") || lower.includes("cloth")) {
    return "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500";
  }
  return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500";
};

export const normalizeProductImage = (rawUrl, productName = "") => {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return getFallbackImageByName(productName);
  }
  const cleanUrl = rawUrl.trim();
  if (cleanUrl.includes("source.unsplash.com") || cleanUrl.includes("unsplash.com/?")) {
    return getFallbackImageByName(productName || cleanUrl);
  }
  if (cleanUrl.includes("images.unsplash.com") && !cleanUrl.includes("w=") && !cleanUrl.includes("h=")) {
    return cleanUrl.includes("?") ? `${cleanUrl}&w=800&q=80` : `${cleanUrl}?w=800&q=80`;
  }
  return cleanUrl;
};
