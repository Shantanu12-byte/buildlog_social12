const filter = require('leo-profanity');

/**
 * BuildLog Content Filter Utility
 * Zero-Cost, local profanity filtering using leo-profanity.
 * Singleton pattern ensures high performance by initializing once.
 */

// Initialize with custom block list (Indian regional slang)
// Adding common regional bad words to the standard list
const CUSTOM_BLOCK_LIST = [
  'chutiya', 'bhenchod', 'madarchod', 'behenchod', 
  'gaand', 'lauda', 'loda', 'harami', 'kaminey', 
  'saala', 'saali', 'kamina', 'randi', 'bhosadi',
  'bhosadike', 'maderchod', 'bc', 'mc'
];

filter.add(CUSTOM_BLOCK_LIST);

/**
 * Sanitizes input text by replacing profane words with asterisks.
 * @param {string} input - The raw text to filter.
 * @returns {string} - The sanitized text.
 */
function cleanText(input) {
  if (!input || typeof input !== 'string') return input;
  return filter.clean(input);
}

/**
 * Checks if the input text contains any filtered words.
 * @param {string} input - The text to check.
 * @returns {boolean} - True if filtering would occur.
 */
function isFiltered(input) {
  if (!input || typeof input !== 'string') return false;
  return filter.check(input);
}

module.exports = {
  cleanText,
  isFiltered
};
