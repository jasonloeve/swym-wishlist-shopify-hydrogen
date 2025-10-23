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
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
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
