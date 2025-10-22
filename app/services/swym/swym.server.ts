/**
 * @file swym.server.ts
 *
 * @description
 * Server-side Swym API service functions.
 * These functions interact directly with the Swym API and should only be imported
 * in server contexts (API routes, loaders, actions).
 *
 * @important
 * DO NOT import this file in client components or hooks.
 */

import type {SwymServerConfig} from './swym.config.server';
import type {SwymList, SwymResponse} from './swym.types';

/**
 * Base function to call Swym API endpoints
 */
async function callSwymAPI(
  endpoint: string,
  params: Record<string, string>,
  config: SwymServerConfig
): Promise<{ok: boolean; status: number; data: any}> {
  const swymEndpoint = `${config.ENDPOINT}${endpoint}?pid=${encodeURIComponent(config.PID)}`;
  const formParams = new URLSearchParams(params);

  const response = await fetch(swymEndpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': config.REST_API_KEY,
      'user-agent': 'Shopify-Hydrogen/2.0',
    },
    body: formParams,
  });

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

/**
 * Fetch all wishlist lists for a user
 */
export async function fetchListsServer(
  regid: string,
  sessionid: string,
  config: SwymServerConfig
): Promise<SwymResponse<SwymList[]>> {
  try {
    const result = await callSwymAPI('/api/v3/lists/fetch-lists', {
      regid,
      sessionid,
    }, config);

    return {
      ok: result.ok,
      status: result.status,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching lists:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
}

/**
 * Create a new wishlist
 */
export async function createListServer(
  listName: string,
  regid: string,
  sessionid: string,
  config: SwymServerConfig
): Promise<SwymResponse<SwymList>> {
  try {
    const result = await callSwymAPI('/api/v3/lists/create', {
      regid,
      sessionid,
      lname: listName,
    }, config);

    return {
      ok: result.ok,
      status: result.status,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating list:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
}

/**
 * Delete a wishlist
 */
export async function deleteListServer(
  lid: string,
  regid: string,
  sessionid: string,
  config: SwymServerConfig
): Promise<SwymResponse> {
  try {
    const result = await callSwymAPI('/api/v3/lists/delete-list', {
      regid,
      sessionid,
      lid,
    }, config);

    return {
      ok: result.ok,
      status: result.status,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting list:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
}

/**
 * Fetch a single wishlist with its contents
 */
export async function fetchListWithContentsServer(
  lid: string,
  regid: string,
  sessionid: string,
  config: SwymServerConfig
): Promise<SwymResponse<SwymList>> {
  try {
    const result = await callSwymAPI('/api/v3/lists/fetch-list-with-contents', {
      regid,
      sessionid,
      lid,
    }, config);

    return {
      ok: result.ok,
      status: result.status,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching list with contents:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
}

/**
 * Update a wishlist (add or remove products)
 */
export async function updateListServer(
  productId: number,
  variantId: number,
  productUrl: string,
  lid: string,
  regid: string,
  sessionid: string,
  updateAction: 'add' | 'remove',
  config: SwymServerConfig
): Promise<SwymResponse> {
  try {
    const productData = `[{ "epi":${variantId},"empi":${productId},"du":"${productUrl}"}]`;

    const params: Record<string, string> = {
      regid,
      sessionid,
      lid,
    };

    // 'a' for add, 'd' for delete/remove
    params[updateAction === 'add' ? 'a' : 'd'] = productData;

    const result = await callSwymAPI('/api/v3/lists/update-ctx', params, config);

    return {
      ok: result.ok,
      status: result.status,
      data: result.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating list:', error);
    return {
      ok: false,
      status: 500,
      error: true,
      message: errorMessage,
    };
  }
}
