// Currency Formatting Utilities for Indian Market
// Location: frontend/utils/currencyFormatter.ts

/**
 * Format currency in Indian numbering system (Lakh/Crore)
 * Examples:
 * - ₹50,000 (Fifty thousand)
 * - ₹5,00,000 (Five lakh)
 * - ₹50,00,000 (Fifty lakh)
 * - ₹5,00,00,000 (Five crore)
 */
export function formatCurrency(amount: number, includeDecimals = false): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: 0
  });

  return formatter.format(amount);
}

/**
 * Format number without currency symbol
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse currency string to number (remove ₹, commas)
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format duration in months to years and months
 * e.g., 14 months -> "1 year 2 months"
 */
export function formatDuration(months: number): string {
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}

/**
 * Abbreviate large numbers
 * e.g., 150000 -> "1.5L", 15000000 -> "1.5Cr"
 */
export function abbreviateNumber(value: number): string {
  if (value >= 10000000) { // 1 Crore
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  } else if (value >= 100000) { // 1 Lakh
    return `₹${(value / 100000).toFixed(2)}L`;
  } else if (value >= 1000) { // 1 Thousand
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}
