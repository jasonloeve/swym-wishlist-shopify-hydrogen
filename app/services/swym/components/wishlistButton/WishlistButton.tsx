import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  fetchLists,
  addToWishlist,
  removeFromWishlist,
} from '~/services/swym/swym';
import {useWishlistContext} from '~/services/swym/provider';
import styles from './WishlistButton.module.css';
import {extractProductId} from '~/services/swym/swym.utils';
import {useRouteLoaderData} from 'react-router';
import type {ShopifyGID} from '~/services/swym/swym.types';

interface WishlistIconProps {
  state: 'enabled' | 'disabled';
  isLoading?: boolean;
}

function WishlistIcon({state, isLoading}: WishlistIconProps) {
  const className = [
    styles.wishlistIcon,
    state === 'enabled' && styles.wishlistEnabled,
    isLoading && styles.wishlistLoading,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <svg
        width={32}
        height={32}
        viewBox="0 0 36 36"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.9995 28.4866L13.615 23.9866L9.26505 19.4866C6.91165 16.9996 6.91165 13.1071 9.26505 10.6201C10.4174 9.51262 11.9782 8.93387 13.5741 9.02234C15.1699 9.11081 16.6572 9.85854 17.68 11.0866L17.9995 11.4001L18.316 11.0731C19.3389 9.84504 20.8262 9.09731 22.422 9.00884C24.0179 8.92037 25.5787 9.49912 26.731 10.6066C29.0844 13.0936 29.0844 16.9861 26.731 19.4731L22.381 23.9731L17.9995 28.4866Z"
          stroke="black"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface WishlistButtonProps {
  productId: ShopifyGID;
  variantId: ShopifyGID;
  productUrl: string;
}

export function WishlistButton({productId, variantId, productUrl}: WishlistButtonProps) {
  // @NOTE - Swym requires absolute product URL (origin + path + handle)
  const {origin} = useRouteLoaderData('root');
  const absoluteProductUrl = `${origin}${productUrl}`;

  const {
    swymConfig,
    availableWishlists,
    selectedWishlistId,
    updateAvailableWishlists,
    isInitialized,
  } = useWishlistContext();

  const [wishlisted, setWishlisted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Convert Shopify GIDs to numeric IDs for Swym api requirements
  const swymProductId = extractProductId(productId);
  const swymVariantId = extractProductId(variantId);

  // Check if product is in wishlist
  const isProductInWishlist = useMemo(() => {
    if (!availableWishlists || availableWishlists.length === 0) return false;

    return availableWishlists.some((list) =>

      // @TODO - Check empty
      list.listcontents?.some(
        (item) =>
          item.empi === Number(swymProductId) &&
          item.epi === Number(swymVariantId)
      )
    );
  }, [availableWishlists, swymProductId, swymVariantId]);

  useEffect(() => {
    setWishlisted(isProductInWishlist);
  }, [isProductInWishlist]);

  const updateButtonState = useCallback(async () => {
    if (!swymConfig) return;

    const listData = await fetchLists(swymConfig);

    if (listData?.ok && listData.data) {
      updateAvailableWishlists(listData.data);
    }
  }, [swymConfig, updateAvailableWishlists]);

  const handleClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isInitialized || !swymConfig || !selectedWishlistId) {
      console.warn('Wishlist not initialized yet');
      return;
    }

    if (isLoading) return; // Prevent duplicate clicks

    setIsLoading(true);

    try {
      const result = wishlisted
        ? await removeFromWishlist(Number(swymProductId), Number(swymVariantId), absoluteProductUrl, selectedWishlistId, swymConfig)
        : await addToWishlist(Number(swymProductId), Number(swymVariantId), absoluteProductUrl, selectedWishlistId, swymConfig);

      if (result?.ok) {
        await updateButtonState();
      } else {
        console.error('Wishlist action failed:', result?.message);
      }
    } catch (err) {
      console.error('Wishlist action failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    isInitialized,
    swymConfig,
    selectedWishlistId,
    wishlisted,
    isLoading,
    swymProductId,
    swymVariantId,
    absoluteProductUrl, // @NOTE - Confirm this deps
    updateButtonState,
  ]);

  if (!isInitialized) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick} // @NOTE - Investigate misuse
      disabled={isLoading}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-busy={isLoading}
      className={styles.wishlistButton}
    >
      <WishlistIcon state={wishlisted ? 'enabled' : 'disabled'} isLoading={isLoading} />
    </button>
  );
}
