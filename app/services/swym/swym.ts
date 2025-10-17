import {detectClientDeviceType} from '~/services/swym/swym.utils';
import SWYM_CONFIG from '~/services/swym/swym.config';
import type {
  SwymConfig,
  SwymResponse,
  SwymGenerateRegidResponse,
  DeviceType,
} from '~/services/swym/swym.types';

/**
 * Generates a new Swym `regid` and `sessionid` for the current user session.
 *
 * @description
 * This function calls the Swym `/generateRegid` API route to establish or refresh
 * a unique identifier (`regid`) for the current device or logged-in customer.
 * It uses the device type (mobile/desktop/tablet) to help Swym associate the session correctly.
 * The response is required for all subsequent wishlist interactions with Swym.
 *
 * @param {Object} options - Optional configuration for the request.
 * @param {string} [options.appId='Wishlist'] - Logical app identifier (used for internal Swym tracking).
 * @param {DeviceType} [options.useragenttype] - Device type used in Swym tracking.
 *
 * @returns {Promise<{ data?: SwymGenerateRegidResponse, error?: string }>}
 * Returns a Promise containing either the generated Swym credentials or an error message.
 */
export const callGenerateRegidApi = async ({
  appId = 'Wishlist',
  useragenttype = detectClientDeviceType(),
}: {
  appId?: string;
  useragenttype?: DeviceType;
} = {}): Promise<{ data?: SwymGenerateRegidResponse; error?: string }> => {
  try {
    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({appId, useragenttype}),
    };

    const response = await fetch('/api/generateRegid', config);
    const result = await response.json();

    if (response.ok && result?.swymResponse?.regid) {
      return {data: result.swymResponse};
    } else {
      console.warn('Swym regid generation failed:', result);
      return {
        error: result?.message || 'Swym regid generation failed',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Exception while generating regid:', error);
    return {
      error: errorMessage,
    };
  }
};

export const callValidateSyncRegidApi = async ({
  regid,
  useragenttype = detectClientDeviceType(),
}: {
  regid: string;
  useragenttype?: DeviceType;
}): Promise<{ data?: SwymGenerateRegidResponse; error?: string }> => {
  try {
    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({useragenttype, regid}),
    };

    const response = await fetch('/api/validateSyncRegid', config);
    const result = await response.json();

    if (response.ok && result?.swymResponse?.regid) {
      return {data: result.swymResponse};
    } else {
      console.warn('Swym regid validation failed:', result);
      return {
        error: result?.message || 'Swym regid validation failed',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Exception while validating regid:', error);
    return {
      error: errorMessage,
    };
  }
};

/**
 * Fetches all wishlist lists created by the client via Swym.
 *
 * @description
 * This function retrieves the lists (wishlists) associated with a user's session.
 * It should only be called if multi-list support is enabled for the user.
 * Uses the Swym API and local `regid`/`sessionid` for identification.
 *
 * @param {SwymConfig} swymConfig - The Swym configuration containing regid and sessionid
 * @returns {Promise<SwymResponse<SwymList[]>>}
 * Returns a structured response containing the list data if successful, or error info if the request fails.
 */
export const fetchLists = async (
  swymConfig: SwymConfig
): Promise<SwymResponse<SwymList[]>> => {
  const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/api/v3/lists/fetch-lists?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

  const formBody = new URLSearchParams({
    regid: swymConfig.regid,
    sessionid: swymConfig.sessionid,
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  };

  try {
    const response = await fetch(endpointUrl, fetchOptions);
    const swymResponse = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: swymResponse,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unhandled exception:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
};

/**
 * Adds a product to a wishlist
 *
 * @param {number} productId - The product ID
 * @param {number} variantId - The variant ID
 * @param {string} productUrl - The product URL
 * @param {string} listId - The list ID to add to
 * @param {SwymConfig} swymConfig - The Swym configuration
 * @returns {Promise<SwymResponse>}
 */
export const addToWishlist = async (
  productId: number,
  variantId: number,
  productUrl: string,
  listId: string,
  swymConfig: SwymConfig,
): Promise<SwymResponse> => {
  try {
    if (!listId || !swymConfig) {
      return {
        ok: false,
        status: 400,
        error: true,
        message: 'Missing required parameters: listId or swymConfig',
      };
    }

    const update = await updateList(productId, variantId, productUrl, listId, swymConfig);

    return {
      ok: update.ok,
      status: update.status,
      data: update.data,
      error: update.error,
      message: update.message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error handling list update:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
};

/**
 * Fetches a single wishlist with its contents
 *
 * @param {string} lid - The list ID
 * @param {SwymConfig} swymConfig - The Swym configuration
 * @returns {Promise<SwymResponse<SwymList>>}
 */
export const fetchListWithContents = async (
  lid: string,
  swymConfig: SwymConfig
): Promise<SwymResponse<SwymList>> => {
  const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/api/v3/lists/fetch-list-with-contents?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

  const formBody = new URLSearchParams({
    regid: swymConfig.regid,
    sessionid: swymConfig.sessionid,
    lid,
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  };

  try {
    const response = await fetch(endpointUrl, fetchOptions);
    const swymResponse = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: swymResponse,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unhandled exception:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
};

/**
 * Creates a new wishlist list via the Swym API.
 *
 * @description
 * This function creates a new named wishlist for the current user session.
 * It is intended for use when multi-list support is enabled. The list name
 * must be at least 3 characters long and unique to the user.
 *
 * A default name of "My Wishlist" will be used if no name is provided.
 * Includes the user's `regid` and `sessionid` in the request for identification.
 *
 * @param {string} listName - The name of the new list (minimum 3 characters, must be unique per user).
 * @param {SwymConfig} swymConfig - The Swym configuration
 * @returns {Promise<SwymResponse<SwymList>>}
 * Returns a structured response containing the new list data if successful, or error info if the request fails.
 */
export const createList = async (
  listName: string,
  swymConfig: SwymConfig
): Promise<SwymResponse<SwymList>> => {
  const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/api/v3/lists/create?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

  const formBody = new URLSearchParams({
    regid: swymConfig.regid,
    sessionid: swymConfig.sessionid,
    lname: listName || 'My Wishlist',
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  };

  try {
    const response = await fetch(endpointUrl, fetchOptions);
    const swymResponse = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: swymResponse,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unhandled exception:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
};

/**
 * Deletes a wishlist list by its `lid` (list ID) via the Swym API.
 *
 * @description
 * This function removes a user-created wishlist from Swym based on the provided list ID.
 * It requires the user's `regid` and `sessionid` to identify the correct user scope.
 * Should be used only when multi-list support is enabled and a list is explicitly selected for deletion.
 *
 * @param {string} lid - The ID of the list to be deleted.
 * @param {SwymConfig} swymConfig - The Swym configuration
 * @returns {Promise<SwymResponse>}
 * Returns a structured response indicating whether the list was successfully deleted or if an error occurred.
 */
export const deleteList = async (
  lid: string,
  swymConfig: SwymConfig
): Promise<SwymResponse> => {
  const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/api/v3/lists/delete-list?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

  const formBody = new URLSearchParams({
    regid: swymConfig.regid,
    sessionid: swymConfig.sessionid,
    lid,
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  };

  try {
    const response = await fetch(endpointUrl, fetchOptions);
    const swymResponse = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: swymResponse,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unhandled exception:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
};

/**
 * Adds a product variant to a specified wishlist list via the Swym API.
 *
 * @description
 * This function adds a product (and its variant) to a given wishlist (identified by `lid`)
 * for the current user session. The product is associated by its numeric product and variant IDs,
 * and the PDP URL is used to enhance tracking or redirection.
 *
 * Requires the user's `regid` and `sessionid` from Swym for proper session identification.
 *
 * @param {number} productId - The numeric ID of the product.
 * @param {number} variantId - The numeric ID of the product variant.
 * @param {string} productUrl - The PDP (Product Detail Page) URL.
 * @param {string} lid - The ID of the wishlist to which the product should be added.
 * @param {SwymConfig} swymConfig - The Swym configuration
 * @returns {Promise<SwymResponse>}
 * Returns a structured response indicating success or failure of the operation.
 */
export const updateList = async (
  productId: number,
  variantId: number,
  productUrl: string,
  lid: string,
  swymConfig: SwymConfig
): Promise<SwymResponse> => {
  const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/api/v3/lists/update-ctx?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

  const formBody = new URLSearchParams({
    regid: swymConfig.regid,
    sessionid: swymConfig.sessionid,
    lid,
    a: `[{ "epi":${variantId},"empi":${productId},"du":"${productUrl}"}]`,
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  };

  try {
    const response = await fetch(endpointUrl, fetchOptions);
    const swymResponse = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: swymResponse,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unhandled exception:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
};

/**
 * Removes a product from a wishlist
 *
 * @param {number} productId - The product ID
 * @param {number} variantId - The variant ID
 * @param {string} productUrl - The product URL
 * @param {string} lid - The list ID to remove from
 * @param {SwymConfig} swymConfig - The Swym configuration
 * @returns {Promise<SwymResponse>}
 */
export const removeFromWishlist = async (
  productId: number,
  variantId: number,
  productUrl: string,
  lid: string,
  swymConfig: SwymConfig
): Promise<SwymResponse> => {
  const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/api/v3/lists/update-ctx?pid=${encodeURIComponent(SWYM_CONFIG.PID)}`;

  const formBody = new URLSearchParams({
    regid: swymConfig.regid,
    sessionid: swymConfig.sessionid,
    lid,
    d: `[{ "epi":${variantId},"empi":${productId},"du":"${productUrl}"}]`,
  });

  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  };

  try {
    const response = await fetch(endpointUrl, fetchOptions);
    const swymResponse = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data: swymResponse,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unhandled exception:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
};
