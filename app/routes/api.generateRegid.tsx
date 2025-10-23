import type {Route} from './+types/api.generateRegid';
import {encodeBasicAuth} from '~/services/swym/swym.utils';
import {getSwymConfig} from '~/services/swym/swym.config.server';
import {SWYM_DEFAULTS} from '~/services/swym/swym.constants';
import type {DeviceType} from '~/services/swym/swym.types';

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
    const appId = body?.appId || SWYM_DEFAULTS.APP_ID;

    // Get Swym configuration from context.env
    const config = getSwymConfig(context.env); // @TODO - This will through a 500 if env hasn't been added to storefront settings before this is deployed, need to look at returning null if no config

    const authHeader = encodeBasicAuth(
      config.PID,
      config.REST_API_KEY,
    );

    const endpointUrl = `${config.ENDPOINT}/storeadmin/v3/user/generate-regid?appId=${appId}`;

    const formParams = new URLSearchParams();
    formParams.append('useragenttype', deviceType);

    // Try to get customer email if logged in
    let customerEmail: string | undefined;

    try {
      const customer = await context.customerAccount.get();
      customerEmail = customer?.email;
    } catch (error) {
      // Customer not logged in or account API unavailable
      // This is expected for guest users
    }

    // Use customer email if available, otherwise generate UUID for guest
    if (customerEmail) {
      formParams.append('useremail', customerEmail);
    } else {
      formParams.append('uuid', crypto.randomUUID());
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
