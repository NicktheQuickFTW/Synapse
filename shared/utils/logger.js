/**
 * Simple logger module
 * 
 * Provides basic logging functionality
 */

/**
 * Log an error message
 * @param {string} message - The error message
 * @param {Object} data - Additional data for the error
 */
exports.error = (message, data = {}) => {
  console.error(`ERROR: ${message}`, data);
};

/**
 * Log an info message
 * @param {string} message - The info message
 * @param {Object} data - Additional data for the info
 */
exports.info = (message, data = {}) => {
  console.log(`INFO: ${message}`, data);
};

/**
 * Log a warning message
 * @param {string} message - The warning message
 * @param {Object} data - Additional data for the warning
 */
exports.warn = (message, data = {}) => {
  console.warn(`WARN: ${message}`, data);
};

/**
 * Log a debug message
 * @param {string} message - The debug message
 * @param {Object} data - Additional data for the debug
 */
exports.debug = (message, data = {}) => {
  console.debug(`DEBUG: ${message}`, data);
}; 