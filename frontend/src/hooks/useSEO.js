import { useEffect } from 'react';

export default function useSEO({ title, description, keywords }) {
  useEffect(() => {
    // Title
    const appTitle = 'ToastKart';
    document.title = title ? `${title} | ${appTitle}` : appTitle;

    // Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute(
      'content',
      description || 'Manage your multi-store e-commerce operations, inventory, customers, and orders with Shopify power.'
    );

    // Meta Keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }
  }, [title, description, keywords]);
}
