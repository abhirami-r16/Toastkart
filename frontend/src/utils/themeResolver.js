export function resolveStoreTheme(storeData) {
  if (!storeData) return 'theme-default';

  // Check for AI Configuration Theme
  const aiConfigs = storeData.ai_configurations || storeData.aiConfigurations;
  let useAiConfig = false;
  let aiConfigObj = null;

  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview_ai') === 'true') {
    useAiConfig = true;
    aiConfigObj = aiConfigs && aiConfigs.length > 0 ? aiConfigs[0] : null;
  } else if (aiConfigs && aiConfigs.length > 0 && aiConfigs[0].status === 'published') {
    useAiConfig = true;
    aiConfigObj = aiConfigs[0];
  }

  if (useAiConfig && aiConfigObj) {
    try {
      const parsedConfig = typeof aiConfigObj.configuration === 'string' 
        ? JSON.parse(aiConfigObj.configuration) 
        : aiConfigObj.configuration;
      
      if (parsedConfig?.style?.theme) {
        return parsedConfig.style.theme;
      }
    } catch (e) {
      console.error('Failed to parse AI configuration for theme resolution', e);
    }
  }

  // Check if store directly specifies a theme
  if (storeData.theme) {
    return storeData.theme;
  }

  const category = String(storeData.category || '')
    .trim()
    .toLowerCase();

  // Check coconut-related categories dynamically
  if (
    category.includes('coconut') ||
    category.includes('copra') ||
    category.includes('kera')
  ) {
    return 'theme-coconut';
  }

  const themeMap = {
    'fashion & apparel': 'theme-eflyer',
    'jewelry': 'theme-jewelry',
    'jewellery': 'theme-jewelry',
    'home & living': 'theme-home',
    'perfumes': 'theme-perfume',
    'perfume': 'theme-perfume',
    'beauty': 'theme-beauty',
    'beauty & cosmetics': 'theme-beauty',
    'electronics': 'theme-electronics',
    'footwear': 'theme-footwear',
    'grocery': 'theme-grocery',
    'grocery & food': 'theme-grocery',
    'groceries': 'theme-grocery',
    'gift': 'theme-gift',
    'gift store': 'theme-gift',
    'gift & novelty': 'theme-gift',
    'coconut products': 'theme-coconut',
    'coconut oil': 'theme-coconut',
    'coconut-based products': 'theme-coconut',
    'coconut manufacturing': 'theme-coconut',
    'coconut': 'theme-coconut',
  };

  return themeMap[category] || 'theme-default';
}