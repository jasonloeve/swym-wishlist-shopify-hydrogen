// @NOTE - This is theory, minor adjustments may be needed, to be tested with the new customer accounts signin flow
import {useEffect, useRef} from 'react';
import {useWishlistContext} from '~/services/swym/provider';
import {detectClientDeviceType} from '~/services/swym/swym.utils';

interface Customer {
  email: string;
  id?: string;
}

/**
 * Hook to sync guest wishlist to customer account after login
 *
 * @description
 * Detects when a user transitions from guest to logged-in customer
 * and syncs their guest wishlist to their customer account via Swym API.
 * This ensures wishlist items are preserved across the login flow.
 *
 * Only runs once per login session to avoid duplicate syncs.
 *
 * @param customer - Customer object from Shopify Customer Account API (null if guest)
 *
 * @example
 * ```tsx
 * // In root.tsx or layout component
 * export function Layout({children}) {
 *   const {customer} = useLoaderData();
 *   useSyncWishlistOnLogin(customer);
 *   return children;
 * }
 * ```
 */
export const useSyncWishlistOnLogin = (customer: Customer | null) => {
  const {swymConfig, updateSwymConfig, isInitialized} = useWishlistContext();
  const hasProcessedLogin = useRef(false);

  useEffect(() => {
    // Don't run if not initialized or already processed this session
    if (!isInitialized || hasProcessedLogin.current) return;

    const isLoggedIn = !!customer?.email;
    const hasGuestRegid = !!swymConfig?.regid;

    // User just logged in with an existing guest wishlist - sync it
    if (isLoggedIn && hasGuestRegid) {
      syncGuestToCustomer(customer.email);
      hasProcessedLogin.current = true;
    }
  }, [customer, swymConfig, isInitialized]);

  /**
   * Syncs guest regid to customer account
   * Calls the syncGuestRegid API endpoint with guest regid and customer email
   */
  const syncGuestToCustomer = async (email: string) => {
    try {
      const response = await fetch('/api/syncGuestRegid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regid: swymConfig?.regid,
          useragenttype: detectClientDeviceType(),
        }),
      });

      const result = await response.json();

      if (result?.swymResponse?.regid && result?.swymResponse?.sessionid) {
        // Update context with new customer-linked regid
        updateSwymConfig({
          regid: result.swymResponse.regid,
          sessionid: result.swymResponse.sessionid,
        });
      } else {
        console.warn('Swym sync failed:', result?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to sync guest wishlist to customer:', error);
    }
  };
};
