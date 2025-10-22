/**
 * @file swym.config.server.ts
 *
 * @description
 * Server-side Swym configuration that uses environment variables from context.env
 *
 * @important
 * This file should ONLY be imported in server contexts:
 * - API routes (app/routes/api.*.tsx)
 * - Server-side loaders and actions
 *
 * DO NOT import this file in client components or hooks that run in the browser.
 *
 * @env SWYM_API_KEY     - Swym REST API Key (server-side only)
 * @env SWYM_ENDPOINT    - Swym base endpoint URL
 * @env SWYM_PID         - Swym PID for your Shopify store
 *
 * @docs https://developers.getswym.com/docs/rest-api-lists-getting-started
 */

export interface SwymServerConfig {
  REST_API_KEY: string;
  ENDPOINT: string;
  PID: string;
}

/**
 * Get Swym configuration from Hydrogen's context.env
 *
 * @param env - The env object from context (context.env)
 * @returns SwymServerConfig with validated environment variables
 */
export function getSwymConfig(env: Env): SwymServerConfig {
  const config = {
    REST_API_KEY: env.SWYM_API_KEY || '',
    ENDPOINT: env.SWYM_ENDPOINT || '',
    PID: env.SWYM_PID || '',
  };

  // Validate required environment variables
  if (!config.REST_API_KEY) {
    console.error('Missing required environment variable: SWYM_API_KEY');
  }

  if (!config.ENDPOINT) {
    console.error('Missing required environment variable: SWYM_ENDPOINT');
  }

  if (!config.PID) {
    console.error('Missing required environment variable: SWYM_PID');
  }

  return config;
}
