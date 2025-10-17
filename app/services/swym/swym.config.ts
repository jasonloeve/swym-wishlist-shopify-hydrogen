/**
 * @file swym.config.ts
 *
 * @description
 * This file provides configuration for Swym integration.
 * All sensitive credentials are sourced from environment variables
 * to avoid hardcoding secrets in the codebase.
 *
 * @env SWYM_REST_API_KEY           - Swym REST API Key (keep server-side only)
 * @env SWYM_ENDPOINT               - Swym base endpoint URL
 * @env SWYM_PID                    - Swym PID for your Shopify store
 * @env SWYM_DEFAULT_WISHLIST_NAME - (Optional) Default wishlist name
 *
 * @note
 * Do NOT expose the REST_API_KEY or PID to the browser.
 * These should only be accessed in server-side logic (e.g., loaders or API routes).
 *
 * @DOCS : https://developers.getswym.com/docs/rest-api-lists-getting-started
 */

// @NOTICE - Do not push keys to repo.
// @TODO - Look into building out Swym configuration to work with encrypted env values.
const SWYM_CONFIG = {
  REST_API_KEY: 'FILLMEIN',
  ENDPOINT: 'FILLMEIN',
  PID: 'FILLMEIN',
};

export default SWYM_CONFIG;
