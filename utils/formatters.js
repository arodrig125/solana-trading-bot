/**
 * Format a number with a fixed number of decimal places
 * @param {number} value Number to format
 * @param {number} decimals Number of decimal places (default: 4)
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 4) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  return value.toFixed(decimals);
}

/**
 * Format a percentage with a fixed number of decimal places
 * @param {number} value Percentage value
 * @param {number} decimals Number of decimal places (default: 2)
 * @returns {string} Formatted percentage
 */
function formatPercentage(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a timestamp in a human-readable format
 * @param {number|Date} timestamp Timestamp to format
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  } catch (error) {
    return 'Invalid date';
  }
}

module.exports = {
  formatNumber,
  formatPercentage,
  formatTimestamp
};
