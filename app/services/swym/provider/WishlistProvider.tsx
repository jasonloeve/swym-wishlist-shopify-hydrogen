import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import {WishlistContext} from './WishlistContext';
import type {SwymConfig, SwymList} from '~/services/swym/swym.types';

const LOCAL_STORAGE_CONFIG = 'swym-data';
const LOCAL_STORAGE_WISHLISTS = 'swym-list-data';
const LOCAL_STORAGE_SELECTED_WISHLIST_ID = 'swym-list-id';

// Helper functions for localStorage
const getStorageItem = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return fallback;
  }
};

const setStorageItem = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage "${key}":`, error);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({children}: WishlistProviderProps) => {
  const [swymConfig, setSwymConfig] = useState<SwymConfig | null>(() =>
    getStorageItem<SwymConfig | null>(LOCAL_STORAGE_CONFIG, null)
  );

  const [swymWishlists, setSwymWishlists] = useState<SwymList[]>(() =>
    getStorageItem<SwymList[]>(LOCAL_STORAGE_WISHLISTS, [])
  );

  const [swymWishlistId, setSwymWishlistId] = useState<string>(() =>
    getStorageItem<string>(LOCAL_STORAGE_SELECTED_WISHLIST_ID, '')
  );

  const [isInitialized, setIsInitialized] = useState(false);

  // Sync to localStorage when state changes
  useEffect(() => {
    setStorageItem(LOCAL_STORAGE_CONFIG, swymConfig);
  }, [swymConfig]);

  useEffect(() => {
    setStorageItem(LOCAL_STORAGE_WISHLISTS, swymWishlists);
  }, [swymWishlists]);

  useEffect(() => {
    setStorageItem(LOCAL_STORAGE_SELECTED_WISHLIST_ID, swymWishlistId);
  }, [swymWishlistId]);

  // Mark as initialized once we have config
  useEffect(() => {
    if (swymConfig && !isInitialized) {
      setIsInitialized(true);
    }
  }, [swymConfig, isInitialized]);

  const updateSwymConfig = useCallback((newConfig: SwymConfig | null) => {
    setSwymConfig(newConfig);
  }, []);

  const updateSwymWishlists = useCallback((newWishlists: SwymList[]) => {
    setSwymWishlists(newWishlists);
  }, []);

  const updateSwymWishlistId = useCallback((newWishlistId: string) => {
    setSwymWishlistId(newWishlistId);
  }, []);

  const resetWishlistState = useCallback(() => {
    removeStorageItem(LOCAL_STORAGE_CONFIG);
    removeStorageItem(LOCAL_STORAGE_WISHLISTS);
    removeStorageItem(LOCAL_STORAGE_SELECTED_WISHLIST_ID);

    setSwymConfig(null);
    setSwymWishlists([]);
    setSwymWishlistId('');
    setIsInitialized(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      swymConfig,
      updateSwymConfig,
      swymWishlists,
      updateSwymWishlists,
      swymWishlistId,
      updateSwymWishlistId,
      resetWishlistState,
      isInitialized,
    }),
    [
      swymConfig,
      updateSwymConfig,
      swymWishlists,
      updateSwymWishlists,
      swymWishlistId,
      updateSwymWishlistId,
      resetWishlistState,
      isInitialized,
    ]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};