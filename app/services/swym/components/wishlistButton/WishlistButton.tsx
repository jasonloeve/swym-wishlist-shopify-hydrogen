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
import {extractProductId} from "~/services/swym/swym.utils";

interface WishlistIconProps {
  state: 'enabled' | 'disabled';
}

function WishlistIcon({state}: WishlistIconProps) {
  const className = [
    styles.wishlistIcon,
    state === 'enabled' && styles.wishlistEnabled,
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
  productId: number;
  variantId: number;
  productUrl: string;
}

export function WishlistButton({productId, variantId, productUrl}: WishlistButtonProps) {
  const {
    swymConfig,
    swymWishlists,
    swymWishlistId,
    updateSwymWishlists,
    isInitialized,
  } = useWishlistContext();

  const [wishlisted, setWishlisted] = useState<boolean>(false);

  // Process product ids from standard Shopify to id only
  const processProductId = extractProductId(productId);
  const processVariantId = extractProductId(variantId)

  // Swyn request requires absolute url origin + handle
  // @NOTE - Build in functionality to get or build origin in root to be used here.
  const absoluteUrl = `http://localhost:3000/products/${productUrl}`

  // Check if product is in wishlist
  const isProductInWishlist = useMemo(() => {
    if (!swymWishlists || swymWishlists.length === 0) return false;

    return swymWishlists.some((list) =>
      list.listcontents?.some(
        (item) =>
          item.empi === Number(processProductId) &&
          item.epi === Number(processVariantId)
      )
    );
  }, [swymWishlists, processProductId, processVariantId]);

  useEffect(() => {
    setWishlisted(isProductInWishlist);
  }, [isProductInWishlist]);

  const updateButtonState = useCallback(async () => {
    if (!swymConfig) return;

    const listData = await fetchLists(swymConfig);

    if (listData?.ok && listData.data) {
      updateSwymWishlists(listData.data);
    }
  }, [swymConfig, updateSwymWishlists]);

  const handleClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isInitialized || !swymConfig || !swymWishlistId) {
      console.warn('Wishlist not initialized yet');
      return;
    }

    // @NOTE - Set a loading state to true at this point.

    try {
      const result = wishlisted
        ? await removeFromWishlist(processProductId, processVariantId, productUrl, swymWishlistId, swymConfig)
        : await addToWishlist(processProductId, processVariantId, productUrl, swymWishlistId, swymConfig);

      if (result?.ok) {
        await updateButtonState();
      } else {
        console.error('Wishlist action failed:', result?.message);
      }
    } catch (err) {
      console.error('Wishlist action failed:', err);
      // @NOTE - Phase 2 - Consider showing toast notification to user
    } finally {
      // @NOTE - Set loading state to false at this point.
      console.debug('Completed')
    }
  }, [
    isInitialized,
    swymConfig,
    swymWishlistId,
    wishlisted,
    productId,
    variantId,
    productUrl,
    updateButtonState,
  ]);

  if (!isInitialized) {
    return null; // Or return a skeleton/placeholder
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={styles.wishlistButton}
    >
      <WishlistIcon state={wishlisted ? 'enabled' : 'disabled'} />
    </button>
  );
}
