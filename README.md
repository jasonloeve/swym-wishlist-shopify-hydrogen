# Swym Wishlist Integration - Technical Documentation

### *** Note - Currently based operations / functionality - Phase 1 ***

## Overview

This document outlines the Swym Wishlist integration built for Shopify Hydrogen 2025.7.x. The integration enables customers to create, manage, and interact with wishlists using the Swym REST API v3.

**Tech Stack:**
- Shopify Hydrogen 2025.7.x
- React 18.3.1
- React Router 7.9.2
- Swym REST API v3
- TypeScript

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Application                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            WishlistProvider (Context)                  │ │
│  │  - Session Management (regid/sessionid)                │ │
│  │  - Wishlist State (lists, active list)                 │ │
│  │  - LocalStorage Persistence                            │ │
│  └────────────────────────────────────────────────────────┘ │
│           │                                                 │
│           ├──> WishlistButton (Product Pages/Cards)         │
│           ├──> Wishlist (Account Page)                      │
│           └──> useSwymInit (Initialization Hook)            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Remix Routes)                   │
│  ├─ /api/generateRegid - Session initialization             │
│  └─ /api/validateSyncRegid - Guest-to-user sync             │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Swym Service Layer                        │
│  ├─ swym.ts - API Functions                                 │
│  ├─ swym.types.ts - TypeScript Interfaces                   │
│  ├─ swym.config.ts - Configuration                          │
│  └─ swym.utils.ts - Helper Functions                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Swym REST API v3 (External)                    │
│  - User Authentication & Session Management                 │
│  - List Management (CRUD)                                   │
│  - Product Management (Add/Remove)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
app/services/swym/
├── components/
│   ├── wishlist/
│   │   ├── Wishlist.tsx              # Main wishlist display component
│   │   ├── EmptyWishlist.tsx         # Empty state component
│   │   └── Wishlist.module.css       # Wishlist styles
│   └── wishlistButton/
│       ├── WishlistButton.tsx        # Add/remove wishlist button
│       └── WishlistButton.module.css # Button styles
├── hooks/
│   ├── index.ts                      # Hook exports
│   └── useSwymInit.ts                # Initialization hook
├── provider/
│   ├── index.ts                      # Provider exports
│   ├── WishlistContext.tsx           # React context definition
│   └── WishlistProvider.tsx          # Context provider with state
├── swym.ts                           # Core API functions
├── swym.types.ts                     # TypeScript type definitions
├── swym.config.ts                    # Configuration & credentials
└── swym.utils.ts                     # Utility functions

app/routes/
├── api.generateRegid.tsx             # Session generation endpoint
├── api.validateSyncRegid.tsx         # Guest-to-user sync endpoint
└── account.wishlist.tsx              # Wishlist page route
```

---

## Core Components

### 1. State Management (`WishlistProvider`)

**Location:** `app/services/swym/provider/WishlistProvider.tsx`

**Purpose:** Centralized state management for Swym wishlist functionality using React Context API.

**Key Features:**
- Session credentials management (`regid`, `sessionid`)
- Wishlist data caching
- LocalStorage persistence
- Initialization state tracking

**State Structure:**
```typescript
{
  swymConfig: {
    regid: string,      // User session identifier
    sessionid: string   // Current session ID
  },
  swymWishlists: SwymList[],      // All user wishlists
  swymWishlistId: string,         // Currently active wishlist
  isInitialized: boolean          // Initialization status
}
```

**LocalStorage Keys:**
- `swym-data` - Session credentials
- `swym-list-data` - Wishlist data
- `swym-list-id` - Active wishlist ID

---

### 2. Initialization Hook (`useSwymInit`)

**Location:** `app/services/swym/hooks/useSwymInit.ts`

**Purpose:** Orchestrates the Swym initialization sequence.

**Initialization Flow:**
```
1. Check for existing session (swymConfig in localStorage)
   ├─ If exists: Use cached credentials
   └─ If missing: Generate new regid/sessionid via API

2. Once credentials exist, check for wishlists
   ├─ Fetch existing wishlists
   │  ├─ If found: Load first list as active
   │  └─ If empty: Create default "My Wishlist"

3. Mark as initialized
```

**Key Implementation Details:**
- Uses `useRef` to prevent duplicate initialization attempts
- Runs only once per session using dependency array
- Automatically creates default wishlist for new users

---

### 3. Wishlist Button (`WishlistButton`)

**Location:** `app/services/swym/components/wishlistButton/WishlistButton.tsx`

**Purpose:** Interactive button for adding/removing products from wishlist.

**Features:**
- Real-time wishlist state (filled/unfilled heart icon)
- Optimistic UI updates
- Product ID extraction from Shopify GID format
- Click handler with error boundaries

**Implementation Notes:**
- Extracts numeric IDs from Shopify's GID format (`gid://shopify/Product/123` → `123`)
- Requires absolute URL for product (currently hardcoded to localhost)
- State derived from `useMemo` to prevent unnecessary re-renders
- Prevents event bubbling with `stopPropagation()`

**Props:**
```typescript
interface WishlistButtonProps {
  productId: number;    // Shopify product ID
  variantId: number;    // Shopify variant ID
  productUrl: string;   // Product handle/URL
}
```

---

### 4. Wishlist Display (`Wishlist`)

**Location:** `app/services/swym/components/wishlist/Wishlist.tsx`

**Purpose:** Full wishlist page display showing all saved products.

**Features:**
- Fetches wishlist contents from Swym
- Loads corresponding Shopify product data
- Empty state handling
- Product count display

**Data Flow:**
```
1. Get active wishlist ID from context
2. Fetch list contents from Swym API
3. Extract product IDs (empi) from items
4. Query Shopify for product details
5. Render product cards
```

---

## API Layer

### 1. Generate Regid Endpoint

**Route:** `POST /api/generateRegid`

**Location:** `app/routes/api.generateRegid.tsx`

**Purpose:** Generates a new Swym session for guest or authenticated users.

**Request Body:**
```typescript
{
  useragenttype?: 'mobile' | 'desktop' | 'tablet' | 'unknown',
  appId?: string  // Default: 'Wishlist'
}
```

**Response:**
```typescript
{
  swymResponse: {
    regid: string,
    sessionid: string
  }
}
```

**Authentication Flow:**
1. Extract device type from request
2. Check for logged-in customer (via session token)
3. If authenticated: Send `useremail` to Swym
4. If guest: Generate and send UUID
5. Call Swym `/storeadmin/v3/user/generate-regid` with Basic Auth
6. Return session credentials

**Security:**
- Uses Basic Authentication (PID:API_KEY)
- Credentials never exposed to client
- Server-side only execution

---

### 2. Validate & Sync Regid Endpoint

**Route:** `POST /api/validateSyncRegid`

**Location:** `app/routes/api.validateSyncRegid.tsx`

**Purpose:** Syncs a guest wishlist with a logged-in user account.

**Use Case:**
When a guest user creates a wishlist and later logs in, their guest wishlist is merged with their account.

**Request Body:**
```typescript
{
  regid: string,        // Guest regid to sync
  useragenttype?: DeviceType
}
```

**Requirements:**
- User must be logged in (requires valid customer session)
- Guest regid must be provided

**Swym API Call:**
```
POST /storeadmin/v3/user/guest-validate-sync
Body: {
  useragenttype,
  regid (guest),
  useremail (logged-in user)
}
```

---

## Service Layer (`swym.ts`)

### Core API Functions

#### 1. `callGenerateRegidApi()`
**Purpose:** Client-side wrapper for session generation

**Parameters:**
```typescript
{
  appId?: string,           // Default: 'Wishlist'
  useragenttype?: DeviceType
}
```

**Returns:** `{ data?: SwymGenerateRegidResponse, error?: string }`

---

#### 2. `callValidateSyncRegidApi()`
**Purpose:** Client-side wrapper for guest-to-user sync

**Parameters:**
```typescript
{
  regid: string,
  useragenttype?: DeviceType
}
```

---

#### 3. `fetchLists()`
**Purpose:** Retrieve all wishlists for current user

**API Endpoint:** `/api/v3/lists/fetch-lists`

**Parameters:**
```typescript
swymConfig: {
  regid: string,
  sessionid: string
}
```

**Returns:** `SwymResponse<SwymList[]>`

---

#### 4. `createList()`
**Purpose:** Create a new wishlist

**API Endpoint:** `/api/v3/lists/create`

**Parameters:**
```typescript
listName: string,          // Min 3 chars, unique per user
swymConfig: SwymConfig
```

**Default Name:** "My Wishlist"

---

#### 5. `fetchListWithContents()`
**Purpose:** Get a specific wishlist with all items

**API Endpoint:** `/api/v3/lists/fetch-list-with-contents`

**Parameters:**
```typescript
lid: string,               // List ID
swymConfig: SwymConfig
```

**Response Structure:**
```typescript
{
  lid: string,
  lname: string,
  listcontents: [
    {
      epi: number,    // variant ID
      empi: number,   // product ID
      du: string,     // product URL
      iu?: string,    // image URL
      dt?: string,    // title
      pr?: number     // price
    }
  ],
  cnt?: number
}
```

---

#### 6. `addToWishlist()`
**Purpose:** Add a product variant to wishlist

**Implementation:** Calls `updateList()` with `a` (add) parameter

**Parameters:**
```typescript
productId: number,
variantId: number,
productUrl: string,
listId: string,
swymConfig: SwymConfig
```

---

#### 7. `removeFromWishlist()`
**Purpose:** Remove a product variant from wishlist

**API Endpoint:** `/api/v3/lists/update-ctx`

**Parameters:**
```typescript
productId: number,
variantId: number,
productUrl: string,
lid: string,
swymConfig: SwymConfig
```

**Body Format:**
```typescript
{
  regid,
  sessionid,
  lid,
  d: `[{ "epi":${variantId},"empi":${productId},"du":"${productUrl}"}]`
}
```

Note: Uses `d` (delete) parameter vs `a` (add)

---

#### 8. `deleteList()`
**Purpose:** Delete an entire wishlist

**API Endpoint:** `/api/v3/lists/delete-list`

**Parameters:**
```typescript
lid: string,
swymConfig: SwymConfig
```

---

## Type Definitions

### Core Types (`swym.types.ts`)

```typescript
// Session configuration
interface SwymConfig {
  regid: string;
  sessionid: string;
}

// API response wrapper
interface SwymResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: boolean;
  message?: string;
}

// Wishlist item (product in list)
interface SwymListItem {
  epi: number;    // variant ID
  empi: number;   // product ID
  du: string;     // product URL
  iu?: string;    // image URL
  dt?: string;    // title
  pr?: number;    // price
}

// Wishlist (list entity)
interface SwymList {
  lid: string;
  lname: string;
  listcontents: SwymListItem[];
  cnt?: number;
}

// Session generation response
interface SwymGenerateRegidResponse {
  regid: string;
  sessionid: string;
}

// Device type
type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'unknown';

// Error response
interface SwymApiError {
  error: true;
  message: string;
  data?: null;
}
```

---

## Utility Functions (`swym.utils.ts`)

### 1. `encodeBasicAuth(username, password)`
**Purpose:** Generate Basic Auth header for Swym API calls

**Returns:** `"Basic <base64(username:password)>"`

**Implementation:**
- Uses `btoa()` for browser environments
- Uses `TextEncoder` + Web API for Edge/server runtimes
- Cross-runtime compatible (Cloudflare Workers, Deno, etc.)

---

### 2. `detectDeviceType(userAgent)`
**Purpose:** Determine device type from User-Agent string

**Returns:** `'mobile' | 'desktop' | 'tablet' | 'unknown'`

**Detection Rules:**
- Mobile: `/mobile|iphone|ipod|android.*mobile|blackberry|phone/`
- Tablet: `/ipad|android(?!.*mobile)|tablet/`
- Desktop: `/windows|macintosh|linux/`

---

### 3. `detectClientDeviceType()`
**Purpose:** Client-side device detection using `navigator.userAgent`

**Returns:** DeviceType

---

### 4. `extractProductId(rawProductId)`
**Purpose:** Extract numeric ID from Shopify GID format

**Example:**
```typescript
extractProductId('gid://shopify/Product/12345678')
// Returns: '12345678'
```

**Implementation:** Extracts substring after last `/`

---

## Configuration (`swym.config.ts`)

```typescript
const SWYM_CONFIG = {
  REST_API_KEY: 'YOUR_API_KEY',
  ENDPOINT: 'https://swymstore-v3pro-01.swymrelay.com',
  PID: 'YOUR_PID',
};
```

**Security Notes:**
- !!! Currently hardcoded (should be moved to environment variables) !!!
- API key and PID should only be used server-side
- Never expose these credentials to the browser

**Recommended Migration:**
```typescript
const SWYM_CONFIG = {
  REST_API_KEY: process.env.SWYM_REST_API_KEY,
  ENDPOINT: process.env.SWYM_ENDPOINT,
  PID: process.env.SWYM_PID,
};
```

---

## Integration Points

### 1. Application Root (`root.tsx`)

**Integration:**
```typescript
export default function App() {
  return (
    <Analytics.Provider>
      <WishlistProvider>  {/* Wraps entire app */}
        <PageLayout>
          <Outlet />
        </PageLayout>
      </WishlistProvider>
    </Analytics.Provider>
  );
}
```

**Purpose:** Provides wishlist context to all child routes and components.

---

### 2. Product Pages

**Usage:**
```typescript
import { WishlistButton } from '~/services/swym/components/wishlistButton/WishlistButton';

<WishlistButton
  productId={product.id}
  variantId={selectedVariant.id}
  productUrl={product.handle}
/>
```

---

### 3. Account Wishlist Page

**Route:** `/account/wishlist`

**File:** `app/routes/account.wishlist.tsx`

**Features:**
- Requires authentication (customer account)
- Displays `<Wishlist />` component
- Auto-fetches wishlist contents on mount

---

## Error Handling

### API Layer
- Try-catch blocks around all fetch calls
- Structured error responses with `{ error: true, message: string }`
- HTTP status code mapping (400 for client errors, 500 for server errors)
- Console logging for debugging

### Component Layer
- Graceful degradation (returns `null` if not initialized)
- Console warnings for missing configuration
- Error boundaries not yet implemented (Phase 2 consideration)

### Service Layer
- All functions return `SwymResponse<T>` with `ok` boolean flag
- Error messages captured and returned instead of throwing
- Fallback values for missing data

---

## Data Persistence

### LocalStorage Strategy

**Keys:**
- `swym-data` → Session credentials (regid, sessionid)
- `swym-list-data` → Cached wishlist data
- `swym-list-id` → Currently active wishlist

**Sync Logic:**
- State changes automatically saved via `useEffect` hooks
- Initial state hydrated from localStorage on mount
- SSR-safe (checks `typeof window !== 'undefined'`)

**Invalidation:**
- `resetWishlistState()` clears all localStorage keys
- No automatic expiration (session persists across browser sessions)

---

## Performance Considerations

### 1. Memoization
- `isProductInWishlist` uses `useMemo` to prevent recalculation
- Context value memoized to prevent unnecessary re-renders

### 2. Lazy Loading
- Wishlist contents fetched only when viewing wishlist page
- Product data fetched separately from Swym metadata

### 3. Optimization Opportunities
- Add React Query / SWR for API caching
- Implement optimistic updates
- Debounce rapid add/remove actions
- Prefetch wishlist on hover over wishlist icon

---

## Known Limitations & TODOs

### Current Limitations

1. **Hardcoded Localhost URL**
   - `WishlistButton.tsx:68` hardcodes `http://localhost:3000`
   - Needs dynamic origin detection

2. **Environment Variables**
   - Credentials in `swym.config.ts` should use `.env`

3. **Customer Account Integration**
   - Comments indicate migration needed for new Shopify Customer Accounts API
   - Current implementation may use deprecated methods

4. **No Loading States**
   - Buttons lack loading indicators during API calls
   - Comments reference future implementation

5. **Product Card Not Implemented**
   - `Wishlist.tsx:68-75` has placeholder for product cards

6. **No Toast Notifications**
   - User feedback limited to console logs
   - Phase 2 feature noted in comments

### Planned Enhancements

1. Loading states for async operations
2. Toast notifications for user feedback
3. Multi-list support (UI for switching between lists)
4. Product card implementation in wishlist view
5. Share wishlist functionality
6. Email wishlist feature
7. Add-to-cart from wishlist

---

## Testing Recommendations

### Unit Tests
- Service functions (swym.ts)
- Utility functions (extractProductId, device detection)
- Context provider state management

### Integration Tests
- API routes (generateRegid, validateSyncRegid)
- Wishlist initialization flow
- Add/remove product flow

### E2E Tests
- Guest user creates wishlist → logs in → wishlist persists
- Add product from PDP → view in wishlist page
- Remove product from wishlist
- Multiple device types

---

## API Reference Summary

| Function | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| `callGenerateRegidApi` | `/api/generateRegid` | POST | Create new session |
| `callValidateSyncRegidApi` | `/api/validateSyncRegid` | POST | Sync guest to user |
| `fetchLists` | `/api/v3/lists/fetch-lists` | POST | Get all lists |
| `createList` | `/api/v3/lists/create` | POST | Create new list |
| `fetchListWithContents` | `/api/v3/lists/fetch-list-with-contents` | POST | Get list + items |
| `updateList` | `/api/v3/lists/update-ctx` | POST | Add product |
| `removeFromWishlist` | `/api/v3/lists/update-ctx` | POST | Remove product |
| `deleteList` | `/api/v3/lists/delete-list` | POST | Delete list |

---

## Deployment Checklist

- [ ] Move credentials to environment variables
- [ ] Update hardcoded localhost URLs to use `request.url` origin
- [ ] Test guest-to-user sync flow in production
- [ ] Verify Swym API rate limits and error handling
- [ ] Add monitoring/logging for Swym API errors
- [ ] Test multi-device session management
- [ ] Validate localStorage quota limits for large wishlists
- [ ] Add error boundaries for component failures
- [ ] Implement loading states
- [ ] Add user feedback (toasts/notifications)

---

## References

- **Swym API Documentation:** https://developers.getswym.com/docs/rest-api-lists-getting-started
- **Shopify Hydrogen Docs:** https://shopify.dev/docs/custom-storefronts/hydrogen
- **React Router v7:** https://reactrouter.com/
- **Swym Endpoint:** https://swymstore-v3pro-01.swymrelay.com

---

**Document Version:** 1.3
**Last Updated:** 2025-10-17
**Author:** Jason L.
