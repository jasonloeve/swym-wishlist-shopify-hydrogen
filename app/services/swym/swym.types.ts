export interface SwymConfig {
  regid: string;
  sessionid: string;
}

export interface SwymResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: boolean;
  message?: string;
}

export interface SwymListItem {
  epi: number;  // variant ID
  empi: number; // product ID
  du: string;   // product URL
  iu?: string;  // image URL
  dt?: string;  // title
  pr?: number;  // price
}

export interface SwymList {
  lid: string;
  lname: string;
  listcontents: SwymListItem[];
  cnt?: number; // item count
}

export interface SwymGenerateRegidResponse {
  regid: string;
  sessionid: string;
}

export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

export interface SwymApiError {
  error: true;
  message: string;
  data?: null;
}

export type SwymAction = 'fetchLists' | 'createList' | 'deleteList' | 'fetchListWithContents' | 'updateList';

/**
 * Shopify Global ID (GID) type
 * Example: "gid://shopify/Product/123456789"
 */
export type ShopifyGID = string;
