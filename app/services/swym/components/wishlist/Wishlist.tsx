// @TODO - Further development needed
// Build Shopify product query
// Build this to bare bones limited styling grid
// Further functionality will be required when multi list functionality is built in
import {useEffect, useState} from 'react';
import {fetchListWithContents} from '~/services/swym/swym';
import {useWishlistContext} from "~/services/swym/provider";
import {EmptyWishlist} from './EmptyWishlist';
import styles from './Wishlist.module.css';

// @NOTE - This query api isn't included in this build, look into using Hydrogen standard query
const fetchProductsData = async (productIds: (string | number)[]) => {
  const response = await fetch(`/api/products?productIds=${productIds.join(',')}`);
  return response.json();
};

export const Wishlist = () => {
  const {
    swymConfig,
    availableWishlists,
    selectedWishlistId,
  } = useWishlistContext();

  const [products, setProducts] = useState([]);

  // Once wishlist id is set, fetch wishlist contents from Swym
  useEffect(() => {
    const fetchWishlistContents = async () => {
      if (!selectedWishlistId || !swymConfig) return;

      try {
        const wishlistContents = await fetchListWithContents(selectedWishlistId, swymConfig);

        if (!wishlistContents.ok) {
          console.error('Failed to fetch wishlist:', wishlistContents.message);
          setProducts([]);
          return;
        }

        const items = wishlistContents?.data?.listcontents || [];

        if (items.length === 0) {
          setProducts([]);
          return;
        }

        // Extract product IDs and filter out invalid values
        const productIds = items
          .map((item) => item.empi)
          .filter((id): id is number => typeof id === 'number' && id > 0);

        if (productIds.length === 0) {
          setProducts([]);
          return;
        }

        // Fetch Shopify products
        const data = await fetchProductsData(productIds);
        setProducts(data.nodes || []);

      } catch (error) {
        console.error('Error loading wishlist or products:', error);
        setProducts([]);
      }
    };

    void fetchWishlistContents();
  }, [selectedWishlistId, swymConfig]);

  return (
    <div>
      {products.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <>
          <div>
            {products.length} Products
          </div>
          <div className={styles.grid}>
            {products.map((product) => (
              <div key={product.id}>
                Product Card
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
