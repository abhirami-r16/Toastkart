export const normalizeProductImage = (rawUrl, productName = "", size = 800) => {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    // If no image is provided at all, return a generic placeholder
    return "https://via.placeholder.com/800x1000?text=No+Image";
  }
  return rawUrl.trim();
};
