import styles from './Wishlist.module.css';

export const EmptyWishlist = () => {
  return (
    <div className={styles.empty}>
      <p>You don&apos;t have items in your list yet. Explore the store or search for an item you would like to add.</p>
    </div>
  );
};
