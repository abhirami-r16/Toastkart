/**
 * Currency Formatting Utility for Indian Rupees (INR ₹)
 * Ensures consistent, safe, and NaN-free currency representation across Toastkart.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Safely extracts a clean numeric value from any string or number input.
 * Strips currency symbols ($, ₹, etc.), whitespace, and handles null/undefined/NaN.
 *
 * @param {any} val - The input value to parse
 * @param {number} [fallback=0] - Fallback value if parsing fails
 * @returns {number} Clean numeric float
 */
export const parseNumeric = (val, fallback = 0) => {
  if (val == null || val === '' || val === 'NaN') return fallback;
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  const cleanStr = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Formats any amount into Indian Rupees (INR ₹)
 * Examples:
 *   formatINR(213) => "₹213.00"
 *   formatINR("213.00") => "₹213.00"
 *   formatINR("$213") => "₹213.00"
 *   formatINR(null) => "₹0.00"
 *   formatINR(NaN) => "₹0.00"
 *
 * @param {any} amount - Number or string
 * @param {boolean} [hideDecimalsIfZero=false] - If true and whole integer, returns ₹213
 * @returns {string} Formatted INR currency string
 */
export const formatINR = (amount, hideDecimalsIfZero = false) => {
  const num = parseNumeric(amount, 0);
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: hideDecimalsIfZero && Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
};

export default formatINR;
