export function resolveStoreTheme(storeData) {
  if (!storeData) return 'theme-default';

  const category = String(storeData.category || '')
    .trim()
    .toLowerCase();

  const themeMap = {
    'fashion & apparel': 'theme-eflyer',
    'jewelry': 'theme-jewelry',
    'jewellery': 'theme-jewelry',
    'home & living': 'theme-home',
    'beauty': 'theme-beauty',
    'beauty & cosmetics': 'theme-beauty',
    'electronics': 'theme-electronics',
    'footwear': 'theme-footwear',
    'grocery': 'theme-grocery',
    'grocery & food': 'theme-grocery',
    'gift': 'theme-gift',
    'gift store': 'theme-gift',
  };

  return themeMap[category] || 'theme-default';
}