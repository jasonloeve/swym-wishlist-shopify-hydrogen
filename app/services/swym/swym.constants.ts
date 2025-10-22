/**
 * @file swym.constants.ts
 *
 * @description
 * Shared constants for Swym wishlist integration.
 * These values are safe for both client and server use.
 */

/**
 * LocalStorage keys for persisting Swym data
 */
export const STORAGE_KEYS = {
  CONFIG: 'swym-data',
  WISHLISTS: 'swym-list-data',
  SELECTED_WISHLIST_ID: 'swym-list-id',
} as const;

/**
 * Default values for Swym configuration
 */
export const SWYM_DEFAULTS = {
  WISHLIST_NAME: 'My Wishlist',
  APP_ID: 'Wishlist',
} as const;

/**
 * Swym API action types
 * Used for routing actions in the consolidated /api/swym endpoint
 */
export const SWYM_ACTIONS = {
  FETCH_LISTS: 'fetchLists',
  CREATE_LIST: 'createList',
  DELETE_LIST: 'deleteList',
  FETCH_LIST_WITH_CONTENTS: 'fetchListWithContents',
  UPDATE_LIST: 'updateList',
} as const;
