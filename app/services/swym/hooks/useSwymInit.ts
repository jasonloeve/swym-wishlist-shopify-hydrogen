import {useEffect, useRef} from 'react';
import {useWishlistContext} from '~/services/swym/provider';
import {callGenerateRegidApi, createList, fetchLists} from '~/services/swym/swym';

/**
 * Hook to initialize Swym wishlist functionality
 * Handles the complete initialization sequence:
 * 1. Generate regid/sessionid if not present
 * 2. Create default wishlist if none exists
 * 3. Fetch and sync wishlist data
 */
export const useSwymInit = () => {
  const {
    swymConfig,
    updateSwymConfig,
    selectedWishlistId,
    updateSelectedWishlistId,
    updateAvailableWishlists,
    isInitialized,
  } = useWishlistContext();

  const initializationAttempted = useRef(false);

  // Step 1: Initialize Swym config (regid/sessionid)
  useEffect(() => {
    if (swymConfig || initializationAttempted.current) return;

    initializationAttempted.current = true;

    const initializeSwymConfig = async () => {
      try {
        const response = await callGenerateRegidApi({});

        if (response.data) {
          updateSwymConfig({
            regid: response.data.regid,
            sessionid: response.data.sessionid,
          });
        } else {
          console.error('Failed to generate Swym regid:', response.error);
        }
      } catch (error) {
        console.error('Error initializing Swym config:', error);
      }
    };

    void initializeSwymConfig();
  }, [swymConfig, updateSwymConfig]);

  // Step 2: Fetch or create wishlist
  useEffect(() => {
    if (!swymConfig || isInitialized) return;

    const initializeWishlist = async () => {
      try {
        // Fetch existing lists
        const listsResponse = await fetchLists(swymConfig);

        if (listsResponse.ok && listsResponse.data && listsResponse.data.length > 0) {
          // Use existing wishlist
          const firstList = listsResponse.data[0];
          updateSelectedWishlistId(firstList.lid);
          updateAvailableWishlists(listsResponse.data);
        } else {
          // Create new default wishlist if none exists
          const createResponse = await createList('My Wishlist', swymConfig);

          if (createResponse.ok && createResponse.data) {
            updateSelectedWishlistId(createResponse.data.lid);
            // Fetch again to get the full list with contents
            const refreshedLists = await fetchLists(swymConfig);
            if (refreshedLists.ok && refreshedLists.data) {
              updateAvailableWishlists(refreshedLists.data);
            }
          } else {
            console.error('Failed to create wishlist:', createResponse.message);
          }
        }
      } catch (error) {
        console.error('Error initializing wishlist:', error);
      }
    };

    void initializeWishlist();
  }, [swymConfig, isInitialized, updateSelectedWishlistId, updateAvailableWishlists]);

  return {
    isInitialized,
    swymConfig,
    selectedWishlistId,
  };
};
