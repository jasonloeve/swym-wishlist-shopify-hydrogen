import type {Route} from './+types/api.generateRegid';
import {v4 as uuidv4} from 'uuid';
import {getCustomerData} from '~/services/shopify';
import {encodeBasicAuth} from '~/services/swym/swym.utils';
import SWYM_CONFIG from '~/services/swym/swym.config';
import {DeviceType} from '~/services/swym/swym.types';

interface GenerateRegidRequestBody {
  useragenttype?: DeviceType;
  appId?: string;
}

interface SwymGenerateRegidApiResponse {
  regid: string;
  sessionid: string;
}

interface ErrorResponse {
  error: true;
  message: string;
  swymResponse?: null;
}

interface SuccessResponse {
  swymResponse: SwymGenerateRegidApiResponse;
}

export async function action({context, request}: Route.ActionArgs) {
  try {
    const body = (await request.json()) as GenerateRegidRequestBody;
    const deviceType = body?.useragenttype || 'unknown';
    const appId = body?.appId || 'Wishlist';

    const authHeader = encodeBasicAuth(
      SWYM_CONFIG.PID,
      SWYM_CONFIG.REST_API_KEY,
    );
    const endpointUrl = `${SWYM_CONFIG.ENDPOINT}/storeadmin/v3/user/generate-regid?appId=${appId}`;

    const formParams = new URLSearchParams();
    formParams.append('useragenttype', deviceType);

    // Try to get customer email if logged in
    // @TODO - Method needs to be refactored to work in default Hydrogen base using new customer accounts.
    let customerEmail: string | undefined;
    const customerAccessToken = await context.session.get('customerAccessToken');

    if (customerAccessToken) {
      try {
        const customer = await getCustomerData(context, customerAccessToken);
        customerEmail = customer?.email;
      } catch (error) {
        console.warn('Failed to fetch customer data:', error);
      }
    }

    // Use customer email if available, otherwise generate UUID for guest
    const hasValidEmail = customerEmail && customerEmail !== 'undefined';

    if (hasValidEmail) {
      formParams.append('useremail', customerEmail);
    } else {
      formParams.append('uuid', uuidv4());
    }

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

      return Response.json({...bodySuccess}, {status: 200});
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
    console.error('Unhandled exception in generateRegid:', error);

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
