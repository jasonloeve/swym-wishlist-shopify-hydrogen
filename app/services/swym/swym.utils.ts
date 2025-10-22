/**
 * Encodes a username and password into a Base64-encoded Basic Authentication header value.
 * Compatible with modern runtimes including Hydrogen 2+, Edge (e.g., Cloudflare Workers), and browsers.
 *
 * @param username - The Basic Auth username
 * @param password - The Basic Auth password
 * @returns A string in the format: "Basic <base64(username:password)>"
 */
export function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const encoded = base64Encode(credentials);
  return `Basic ${encoded}`;
}

/**
 * Encodes a string to Base64 using Web APIs for cross-runtime compatibility.
 * Uses `btoa` in browsers, and `TextEncoder` for Edge/server environments.
 *
 * @param input - The raw string to encode (e.g., "user:pass")
 * @returns A Base64-encoded string
 * @throws Error if no encoding method is available in the current environment
 */
function base64Encode(input: string): string {
  if (typeof btoa === 'function') {
    // Browser or Web API-compatible runtime
    return btoa(input);
  }

  // Edge/Server (TextEncoder + Uint8Array + Web API)
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);

  if (typeof globalThis.atob === 'undefined' && typeof globalThis.btoa === 'undefined') {
    // Use from web-standards-compatible globalThis (e.g., Cloudflare Workers, Deno)
    return globalThis.btoa(String.fromCharCode(...bytes));
  }

  // Fallback
  throw new Error('No method available for Base64 encoding');
}

/**
 * Detects the device type (mobile or desktop) from a user-agent string.
 *
 * @param userAgent - The raw User-Agent string from the request header
 * @returns 'mobile' | 'desktop' | 'tablet' | 'unknown'
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
  const ua = userAgent.toLowerCase();

  if (/mobile|iphone|ipod|android.*mobile|blackberry|phone/.test(ua)) {
    return 'mobile';
  }

  if (/ipad|android(?!.*mobile)|tablet/.test(ua)) {
    return 'tablet';
  }

  if (/windows|macintosh|linux/.test(ua)) {
    return 'desktop';
  }

  return 'unknown';
}

export function detectClientDeviceType(): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  return detectDeviceType(navigator.userAgent);
}

/**
 * Extracts the product ID from a Shopify product ID string.
 * @param rawProductId The Shopify product ID string.
 * @returns The extracted product ID or an empty string if not found.
 */
export function extractProductId(rawProductId: string | undefined): string {
  return rawProductId
    ? rawProductId.slice(rawProductId.lastIndexOf('/') + 1)
    : '';
}
