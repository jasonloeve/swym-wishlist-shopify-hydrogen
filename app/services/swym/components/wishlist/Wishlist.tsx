import {useEffect, useState} from 'react';
import {fetchListWithContents} from '~/services/swym/swym';
import {useWishlistContext} from "~/services/swym/provider";
import {EmptyWishlist} from './EmptyWishlist';
import styles from './Wishlist.module.css';

const fetchProductsData = async (productIds: (string | number)[]) => {
  const response = await fetch(`/api/products?productIds=${productIds.join(',')}`);
  return response.json();
};

export const Wishlist = () => {
  const {
    swymConfig,
    swymWishlists,
    swymWishlistId,
  } = useWishlistContext();

  const [products, setProducts] = useState([]);

  // Once wishlist id is set, fetch wishlist contents from Swym
  useEffect(() => {
    const fetchWishlistContents = async () => {
      if (!swymWishlistId) return;

      try {
        const wishlistContents = await fetchListWithContents(swymWishlistId, swymConfig);

        // Safely extract product IDs from wishlist contents
        const items = wishlistContents?.data?.items || [];
        const productIds = items.map((item) => item.empi).filter(Boolean); // filter out undefined/null

        if (productIds.length === 0) {
          setProducts([]);
          return;
        }

        // Fetch Shopify products
        const data = await fetchProductsData(productIds);
        setProducts(data.nodes || []);

      } catch (error) {
        console.error('Error loading wishlist or products:', error);
      }
    };

    fetchWishlistContents();
  }, [swymWishlists]);

  return (
    <div>
      <div>
        <h2>Your Wishlist</h2>
      </div>

      {products.length === 0 ? (
        <>
          <EmptyWishlist />
        </>
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
              // <ProductCard
              //   key={product.id}
              //   product={product}
              //   quickAdd
              //   productTag
              // />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
