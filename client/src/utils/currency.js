// Currency formatting utilities

/**
 * Format price with proper currency symbol and locale
 * @param {number} price - The price to format
 * @param {string} currency - The currency code (default: 'BDT')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = 'BDT') => {
  if (price === 0 || price === null || price === undefined) return 'Free';
  if (isNaN(price)) return 'Price not available';
  
  // Handle BDT currency with ৳ symbol
  if (currency === 'BDT') {
    return `৳${price.toLocaleString('en-BD')}`;
  }
  
  // Handle other currencies
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency} ${price.toLocaleString()}`;
  }
};

/**
 * Format currency for input fields (without symbol)
 * @param {number} price - The price to format
 * @returns {string} Formatted price string without currency symbol
 */
export const formatPriceInput = (price) => {
  if (price === 0 || price === null || price === undefined) return '0';
  if (isNaN(price)) return '';
  
  return price.toLocaleString('en-BD');
};

/**
 * Parse price from formatted string
 * @param {string} formattedPrice - The formatted price string
 * @returns {number} Parsed price as number
 */
export const parsePrice = (formattedPrice) => {
  if (!formattedPrice || formattedPrice === 'Free') return 0;
  
  // Remove currency symbols and commas
  const cleaned = formattedPrice.replace(/[৳$€£¥,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Get currency symbol for a given currency code
 * @param {string} currency - The currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = 'BDT') => {
  const symbols = {
    BDT: '৳',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
  };
  
  return symbols[currency] || currency;
};

// Default export
export default {
  formatPrice,
  formatPriceInput,
  parsePrice,
  getCurrencySymbol,
};
