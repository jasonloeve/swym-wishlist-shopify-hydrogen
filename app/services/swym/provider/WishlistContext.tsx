import {createContext, useContext} from 'react';
import type { SwymConfig, SwymList } from '~/services/swym/swym.types';

export interface WishlistContextValue {
  swymConfig: SwymConfig | null;
  updateSwymConfig: (value: SwymConfig | null) => void;
  swymWishlists: SwymList[];
  updateSwymWishlists: (value: SwymList[]) => void;
  swymWishlistId: string;
  updateSwymWishlistId: (value: string) => void;
  resetWishlistState: () => void;
  isInitialized: boolean;
}

const defaultContextValue: WishlistContextValue = {
  swymConfig: null,
  updateSwymConfig: () => {},
  swymWishlists: [],
  updateSwymWishlists: () => {},
  swymWishlistId: '',
  updateSwymWishlistId: () => {},
  resetWishlistState: () => {},
  isInitialized: false,
};

export const WishlistContext = createContext<WishlistContextValue>(defaultContextValue);

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error(
      'useWishlistContext must be used within a WishlistProvider',
    );
  }
  return context;
};
