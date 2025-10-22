import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import {WishlistContext} from './WishlistContext';
import type {SwymConfig, SwymList} from '~/services/swym/swym.types';
import {STORAGE_KEYS} from '~/services/swym/swym.constants';

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
    getStorageItem<SwymConfig | null>(STORAGE_KEYS.CONFIG, null)
  );

  const [availableWishlists, setAvailableWishlists] = useState<SwymList[]>(() =>
    getStorageItem<SwymList[]>(STORAGE_KEYS.WISHLISTS, [])
  );

  const [selectedWishlistId, setSelectedWishlistId] = useState<string>(() =>
    getStorageItem<string>(STORAGE_KEYS.SELECTED_WISHLIST_ID, '')
  );

  const [isInitialized, setIsInitialized] = useState(false);

  // Sync to localStorage when state changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.CONFIG, swymConfig);
  }, [swymConfig]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.WISHLISTS, availableWishlists);
  }, [availableWishlists]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.SELECTED_WISHLIST_ID, selectedWishlistId);
  }, [selectedWishlistId]);

  // Mark as initialized once we have config
  useEffect(() => {
    if (swymConfig && !isInitialized) {
      setIsInitialized(true);
    }
  }, [swymConfig, isInitialized]);

  const updateSwymConfig = useCallback((newConfig: SwymConfig | null) => {
    setSwymConfig(newConfig);
  }, []);

  const updateAvailableWishlists = useCallback((newWishlists: SwymList[]) => {
    setAvailableWishlists(newWishlists);
  }, []);

  const updateSelectedWishlistId = useCallback((newWishlistId: string) => {
    setSelectedWishlistId(newWishlistId);
  }, []);

  const resetWishlistState = useCallback(() => {
    removeStorageItem(STORAGE_KEYS.CONFIG);
    removeStorageItem(STORAGE_KEYS.WISHLISTS);
    removeStorageItem(STORAGE_KEYS.SELECTED_WISHLIST_ID);

    setSwymConfig(null);
    setAvailableWishlists([]);
    setSelectedWishlistId('');
    setIsInitialized(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      swymConfig,
      updateSwymConfig,
      availableWishlists,
      updateAvailableWishlists,
      selectedWishlistId,
      updateSelectedWishlistId,
      resetWishlistState,
      isInitialized,
    }),
    [
      swymConfig,
      updateSwymConfig,
      availableWishlists,
      updateAvailableWishlists,
      selectedWishlistId,
      updateSelectedWishlistId,
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