/**
 * FlexTime Utility Functions
 * 
 * General utility functions used throughout the FlexTime module.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Ensure a directory exists, creating it if necessary
 * 
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<boolean>} - Success status
 */
async function ensureDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`Error ensuring directory exists: ${error.message}`);
    return false;
  }
}

/**
 * Format date as YYYY-MM-DD
 * 
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get current academic year (e.g., '2023-24')
 * 
 * @returns {string} - Academic year string
 */
function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  
  if (month >= 8) { // August or later = start of new academic year
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Parse academic year string into start and end years
 * 
 * @param {string} academicYear - Academic year (e.g., '2023-24')
 * @returns {Object} - Object with startYear and endYear properties
 */
function parseAcademicYear(academicYear) {
  if (!academicYear || typeof academicYear !== 'string') {
    throw new Error('Invalid academic year format');
  }
  
  // Handle formats like '2023-24' or '2023-2024'
  const parts = academicYear.split('-');
  if (parts.length !== 2) {
    throw new Error('Invalid academic year format: expected YYYY-YY or YYYY-YYYY');
  }
  
  const startYear = parseInt(parts[0], 10);
  let endYear;
  
  if (parts[1].length === 2) {
    // Format: '2023-24'
    endYear = parseInt(`20${parts[1]}`, 10);
  } else if (parts[1].length === 4) {
    // Format: '2023-2024'
    endYear = parseInt(parts[1], 10);
  } else {
    throw new Error('Invalid academic year format: end year should be YY or YYYY');
  }
  
  return { startYear, endYear };
}

/**
 * Convert a date string to a JavaScript Date object
 * 
 * @param {string} dateString - Date string in various formats
 * @returns {Date} - JavaScript Date object
 */
function parseDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Invalid date string');
  }
  
  // Try various formats
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Could not parse date string: ${dateString}`);
  }
  
  return date;
}

/**
 * Deep clone an object
 * 
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep for a specified number of milliseconds
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>} - Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID
 * 
 * @returns {string} - Unique ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Read a JSON file
 * 
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} - Parsed JSON object
 */
async function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Write a JSON file
 * 
 * @param {string} filePath - Path to the JSON file
 * @param {Object} data - Data to write
 * @returns {Promise<boolean>} - Success status
 */
async function writeJsonFile(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    await ensureDirectory(dirPath);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}: ${error.message}`);
    return false;
  }
}

module.exports = {
  ensureDirectory,
  formatDate,
  getCurrentAcademicYear,
  parseAcademicYear,
  parseDate,
  deepClone,
  sleep,
  generateId,
  readJsonFile,
  writeJsonFile
}; 