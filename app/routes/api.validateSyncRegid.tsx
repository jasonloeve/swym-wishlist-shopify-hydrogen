import type {Route} from './+types/api.validateSyncRegid';
import {v4 as uuidv4} from 'uuid';
import {getCustomerData} from '~/services/shopify';
import {encodeBasicAuth} from '~/services/swym/swym.utils';
import SWYM_CONFIG from '~/services/swym/swym.config';
import {DeviceType} from '~/services/swym/swym.types';

interface ValidateSyncRegidRequestBody {
  useragenttype?: DeviceType;
  regid: string;
}

interface SwymValidateSyncApiResponse {
  regid: string;
  sessionid: string;
}

interface ErrorResponse {
  error: true;
  message: string;
  swymResponse?: null;
}

interface SuccessResponse {
  swymResponse: SwymValidateSyncApiResponse;
}

/**
 * API Route: Validate and sync guest wishlist with logged-in user
 *
 * This endpoint validates a guest regid and syncs it with a logged-in user's account.
 * This is used when a guest user who created a wishlist logs in - their guest wishlist
 * will be merged with their account.
 *
 * @param {string} regid - The guest regid to validate and sync
 * @param {DeviceType} useragenttype - Device type (mobile/desktop/tablet/unknown)
 * @returns {SuccessResponse | ErrorResponse}
 */
export async function action({context, request}: Route.ActionArgs) {
  try {
    const body = (await request.json()) as ValidateSyncRegidRequestBody;
    const deviceType = body?.useragenttype || 'unknown';
    const guestRegid = body?.regid;

    // Validate required parameters
    if (!guestRegid) {
      const bodyError: ErrorResponse = {
        error: true,
        message: 'Missing required parameter: regid',
        swymResponse: null,
      };

      return Response.json(
        {...bodyError},
        {status: 400},
      );
    }

    // Get logged-in customer email
    // @TODO - Method needs to be refactored to work in default Hydrogen base using new customer accounts.
    let useremail: string | undefined;
    const token = await context.session.get('customerAccessToken');

    if (token) {
      try {
        // @NOTE - Refactor - Moving to new customer accounts this Shopify getting data method may have to change to align.
        const customer = await getCustomerData(context, token);
        useremail = customer?.email;
      } catch (error) {
        console.warn('Failed to fetch customer data:', error);
      }
    }

    const hasValidEmail = useremail && useremail !== 'undefined';

    if (!hasValidEmail) {
      const bodyError: ErrorResponse = {
        error: true,
        message: 'User must be logged in with valid email to sync guest wishlist',
        swymResponse: null,
      };

      return Response.json(
        {...bodyError},
        {status: 401},
      );
    }

    // Prepare request to Swym
    const formParams = new URLSearchParams();
    formParams.append('useragenttype', deviceType);
    formParams.append('regid', guestRegid);
    formParams.append('useremail', useremail);

    const authHeader = encodeBasicAuth(
      SWYM_CONFIG.PID,
      SWYM_CONFIG.REST_API_KEY,
    );
    const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/storeadmin/v3/user/guest-validate-sync`;

    // Call Swym API
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader,
      },
      body: formParams,
    });

    const swymResponse = await response.json();

    if (response.ok) {
      const bodySuccess: SuccessResponse = {swymResponse};

      return Response.json(
        {...bodySuccess},
        {status: 200},
      );
    }

    console.error('Swym error response:', swymResponse);

    const bodyError: ErrorResponse = {
      error: true,
      message: swymResponse?.message || 'Swym request failed',
      swymResponse: null,
    };

    return Response.json(
      {...bodyError},
      {
        status:
          response.status >= 400 && response.status < 500
            ? response.status
            : 502,
      },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unhandled exception in validateSyncRegid:', error);

    const bodyError: ErrorResponse = {
      error: true,
      message: errorMessage,
      swymResponse: null,
    };

    return Response.json(
      {...bodyError},
      {status: 500},
    );
  }
}
