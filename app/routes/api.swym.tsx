import type {Route} from './+types/api.swym';
import {
  fetchListsServer,
  createListServer,
  deleteListServer,
  fetchListWithContentsServer,
  updateListServer,
} from '~/services/swym/swym.server';
import {getSwymConfig} from '~/services/swym/swym.config.server';
import {SWYM_ACTIONS} from '~/services/swym/swym.constants';
import type {SwymAction} from '~/services/swym/swym.types';

interface SwymRequestBody {
  action: SwymAction;
  regid: string;
  sessionid: string;
  // Optional parameters depending on action
  listName?: string;
  lid?: string;
  productId?: number;
  variantId?: number;
  productUrl?: string;
  updateAction?: 'add' | 'remove';
}

/**
 * Consolidated Swym API Route
 *
 * Handles all Swym wishlist operations through a single endpoint
 * using action-based routing similar to cart operations.
 *
 * @example
 * ```ts
 * fetch('/api/swym', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     action: 'fetchLists',
 *     regid: '...',
 *     sessionid: '...'
 *   })
 * })
 * ```
 */
export async function action({request, context}: Route.ActionArgs) {
  try {
    const body = (await request.json()) as SwymRequestBody;
    const {action, regid, sessionid} = body;

    // Get Swym configuration from context.env
    const config = getSwymConfig(context.env);

    // Validate required fields
    if (!action) {
      return Response.json(
        {error: true, message: 'No action provided'},
        {status: 400},
      );
    }

    if (!regid || !sessionid) {
      return Response.json(
        {error: true, message: 'Missing regid or sessionid'},
        {status: 400},
      );
    }

    let result;

    switch (action) {
      case SWYM_ACTIONS.FETCH_LISTS:
        result = await fetchListsServer(regid, sessionid, config);
        break;

      case SWYM_ACTIONS.CREATE_LIST:
        if (!body.listName) {
          return Response.json(
            {error: true, message: 'Missing listName'},
            {status: 400},
          );
        }
        result = await createListServer(body.listName, regid, sessionid, config);
        break;

      case SWYM_ACTIONS.DELETE_LIST:
        if (!body.lid) {
          return Response.json(
            {error: true, message: 'Missing lid (list ID)'},
            {status: 400},
          );
        }
        result = await deleteListServer(body.lid, regid, sessionid, config);
        break;

      case SWYM_ACTIONS.FETCH_LIST_WITH_CONTENTS:
        if (!body.lid) {
          return Response.json(
            {error: true, message: 'Missing lid (list ID)'},
            {status: 400},
          );
        }
        result = await fetchListWithContentsServer(body.lid, regid, sessionid, config);
        break;

      case SWYM_ACTIONS.UPDATE_LIST:
        if (!body.lid || !body.productId || !body.variantId || !body.productUrl || !body.updateAction) {
          return Response.json(
            {error: true, message: 'Missing required parameters for updateList'},
            {status: 400},
          );
        }
        result = await updateListServer(
          body.productId,
          body.variantId,
          body.productUrl,
          body.lid,
          regid,
          sessionid,
          body.updateAction,
          config,
        );
        break;

      default:
        return Response.json(
          {error: true, message: `Unknown action: ${action}`},
          {status: 400},
        );
    }

    return Response.json(
      {
        ok: result.ok,
        status: result.status,
        data: result.data,
        error: result.error,
        message: result.message,
      },
      {status: result.status},
    );
  } catch (error) {
    console.error('Error in Swym API route:', error);
    return Response.json(
      {error: true, message: 'Internal server error'},
      {status: 500},
    );
  }
}
