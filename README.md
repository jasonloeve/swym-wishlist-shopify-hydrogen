# Swym Wishlist Integration for Shopify Hydrogen v2025.7.x

A production-ready, fully-featured Swym wishlist integration built for **Shopify Hydrogen 2**, featuring modern authentication (Customer Account API), proper security practices, and clean architecture.

[![Hydrogen Version](https://img.shields.io/badge/Hydrogen-v2025.7.x-blue)](https://shopify.dev/docs/api/hydrogen)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6)](https://www.typescriptlang.org/)

## Features

- **Hydrogen 2 Compatible** - Works with modern Shopify Hydrogen architecture
- **Customer Account API** - Supports passwordless authentication (no deprecated tokens)
- **Guest Wishlist Support** - Automatic sync when guests log in
- **Multi-List Support** - Create and manage multiple wishlists
- **Secure** - Server-side API calls, environment-based configuration
- **TypeScript** - Full type safety throughout
- **React Context** - Clean state management with Context API
- **Custom Hooks** - Reusable logic with React hooks
- **Persistent Storage** - LocalStorage integration for offline support
- **Action-Based Routing** - Single consolidated API endpoint
- **Separation of Concerns** - Clean service layer architecture

## Prerequisites

- Shopify Hydrogen v2025.7.x
- [Swym Premium plan or higher](https://swym.it/pricing/)
- Swym API credentials (available in Swym Admin)
- Node.js 18+

## Installation

### 1. Copy the Swym Service Directory

Copy the entire `app/services/swym` directory to your Hydrogen project:

```bash
cp -r app/services/swym your-hydrogen-project/app/services/
```

### 2. Copy API Routes

Copy the API route files:

```bash
cp app/routes/api.generateRegid.tsx your-hydrogen-project/app/routes/
cp app/routes/api.syncGuestRegid.tsx your-hydrogen-project/app/routes/
cp app/routes/api.swym.tsx your-hydrogen-project/app/routes/
```

### 3. Environment Variables

Add to your `.env` file:

```env
# Swym Configuration
SWYM_API_KEY=your_swym_api_key_here
SWYM_ENDPOINT=https://swym.it
SWYM_PID=your_store_pid_here
```

> **Where to find these:**
> - Login to [Swym Admin](https://app.swym.it/)
> - Navigate to Settings → API Keys
> - Copy your REST API Key and PID

## Setup

### Step 1: Wrap Your App with WishlistProvider

In `app/root.tsx`:

```tsx
import {WishlistProvider} from '~/services/swym/provider';

export default function App() {
   return (
           <html>
           <head>
              <Meta />
              <Links />
           </head>
           <body>
           <WishlistProvider>
              <Outlet />
           </WishlistProvider>
           <Scripts />
           </body>
           </html>
   );
}
```

### Step 2: Initialize Swym in Your Layout

In your main layout component (e.g., `app/components/PageLayout.tsx`):

```tsx
import {useSwymInit} from '~/services/swym/hooks/useSwymInit';
import {useSyncWishlistOnLogin} from '~/services/swym/hooks/useSyncWishlistOnLogin';
import {useLoaderData} from '@remix-run/react';

export function PageLayout({children}) {
   const {customer} = useLoaderData<typeof loader>();

   // Initialize Swym wishlist system
   useSwymInit();

   // Sync guest wishlist when user logs in
   useSyncWishlistOnLogin(customer);

   return <>{children}</>;
}

export async function loader({context}: LoaderFunctionArgs) {
   const customer = await context.customerAccount.get();
   return {customer};
}
```

### Step 3: Add Origin to Root Loader

Swym requires absolute product URLs. Add origin to your root loader:

```tsx
// app/root.tsx
export async function loader({request}: LoaderFunctionArgs) {
   const url = new URL(request.url);
   const origin = url.origin;

   return {
      origin,
      // ... other data
   };
}
```

## Usage

### Add Wishlist Button to Products

```tsx
import {WishlistButton} from '~/services/swym/components/wishlistButton/WishlistButton';
import {useRouteLoaderData} from '@remix-run/react';

export function ProductCard({product}) {
   return (
           <div>
              <h2>{product.title}</h2>
              <img src={product.featuredImage.url} alt={product.title} />

              <WishlistButton
                      productId={product.id}
                      variantId={product.variants.nodes[0].id}
                      productHandle={product.handle}
              />
           </div>
   );
}
```

### Create a Wishlist Page

```tsx
// app/routes/account.wishlist.tsx
import {Wishlist} from '~/services/swym/components/wishlist/Wishlist';

export default function WishlistPage() {
   return (
           <div>
              <h1>My Wishlist</h1>
              <Wishlist />
           </div>
   );
}
```

### Access Wishlist State in Components

```tsx
import {useWishlistContext} from '~/services/swym/provider';

export function MyComponent() {
   const {
      swymConfig,              // User's Swym session (regid, sessionid)
      availableWishlists,      // All user's wishlists
      selectedWishlistId,      // Currently active wishlist
      isInitialized,           // Whether Swym is ready
   } = useWishlistContext();

   if (!isInitialized) {
      return <div>Loading wishlist...</div>;
   }

   return (
           <div>
              <p>You have {availableWishlists.length} wishlists</p>
           </div>
   );
}
```

## API Reference

### Components

#### `<WishlistButton>`

Add/remove products from wishlist.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `productId` | `ShopifyGID` | Yes | Shopify product GID (e.g., `gid://shopify/Product/123`) |
| `variantId` | `ShopifyGID` | Yes | Shopify variant GID (e.g., `gid://shopify/ProductVariant/456`) |
| `productHandle` | `string` | Yes | Product handle for URL generation |

**Example:**
```tsx
<WishlistButton
        productId="gid://shopify/Product/123456789"
        variantId="gid://shopify/ProductVariant/987654321"
        productHandle="cool-product"
/>
```

#### `<Wishlist>`

Full wishlist page component showing all wishlist items.

**Props:** None (uses context)

**Example:**
```tsx
<Wishlist />
```

### Hooks

#### `useSwymInit()`

Initializes the Swym wishlist system. Call once in your layout.

**Returns:**
```typescript
{
   isInitialized: boolean;
   swymConfig: SwymConfig | null;
   selectedWishlistId: string;
}
```

**Example:**
```tsx
export function Layout({children}) {
   const {isInitialized} = useSwymInit();

   if (!isInitialized) {
      return <LoadingSpinner />;
   }

   return <>{children}</>;
}
```

#### `useSyncWishlistOnLogin(customer)`

Syncs guest wishlist to customer account after login.

**Parameters:**
- `customer`: Customer object from `context.customerAccount.get()` or `null`

**Example:**
```tsx
export function Layout({children}) {
   const {customer} = useLoaderData();
   useSyncWishlistOnLogin(customer);
   return <>{children}</>;
}
```

#### `useWishlistContext()`

Access wishlist state and actions.

**Returns:**
```typescript
{
   swymConfig: SwymConfig | null;
   updateSwymConfig: (config: SwymConfig | null) => void;
   availableWishlists: SwymList[];
   updateAvailableWishlists: (lists: SwymList[]) => void;
   selectedWishlistId: string;
   updateSelectedWishlistId: (id: string) => void;
   resetWishlistState: () => void;
   isInitialized: boolean;
}
```

### Client API Functions

#### `addToWishlist(productId, variantId, productUrl, listId, swymConfig)`

Add a product to wishlist.

```typescript
import {addToWishlist} from '~/services/swym/swym';

const result = await addToWishlist(
        123456,                    // Swym product ID (numeric)
        789012,                    // Swym variant ID (numeric)
        'https://store.com/products/cool-product',
        'list-id-123',
        swymConfig
);
```

#### `removeFromWishlist(productId, variantId, productUrl, listId, swymConfig)`

Remove a product from wishlist.

#### `fetchLists(swymConfig)`

Fetch all wishlists for the current user.

```typescript
const result = await fetchLists(swymConfig);
// result.data = array of wishlist objects
```

#### `createList(listName, swymConfig)`

Create a new wishlist.

```typescript
const result = await createList('Holiday Gifts', swymConfig);
// result.data = new list object with lid (list ID)
```

#### `deleteList(lid, swymConfig)`

Delete a wishlist.

#### `fetchListWithContents(lid, swymConfig)`

Fetch a single wishlist with all its items.

## Architecture

### Directory Structure

```
app/services/swym/
├── swym.config.server.ts         # Server-only configuration (env vars)
├── swym.constants.ts             # Shared constants
├── swym.types.ts                 # TypeScript type definitions
├── swym.server.ts                # Server-side business logic
├── swym.ts                       # Client-side API wrapper
├── swym.utils.ts                 # Shared utility functions
├── components/
│   ├── wishlist/
│   │   ├── Wishlist.tsx          # Wishlist page component
│   │   └── EmptyWishlist.tsx     # Empty state component
│   └── wishlistButton/
│       └── WishlistButton.tsx    # Add/remove button component
├── hooks/
│   ├── useSwymInit.ts            # Initialization hook
│   └── useSyncWishlistOnLogin.ts # Guest-to-customer sync hook
└── provider/
    ├── WishlistProvider.tsx      # Context provider
    ├── WishlistContext.tsx       # Context definition
    └── index.ts                  # Exports

app/routes/
├── api.generateRegid.tsx         # Generate Swym session ID
├── api.syncGuestRegid.tsx        # Sync guest to customer
└── api.swym.tsx                  # Consolidated list operations
```

### Data Flow

```
User Interaction (WishlistButton)
    ↓
Client API (swym.ts)
    ↓
Internal API Route (api.swym.tsx)
    ↓
Service Layer (swym.server.ts)
    ↓
Swym REST API
```

### Key Design Decisions

1. **Action-Based Routing**: Single `/api/swym` endpoint with action parameter (similar to Hydrogen's cart.tsx)
2. **Service Layer**: Business logic separated from route handlers for testability
3. **Context API**: Global state management without external dependencies
4. **Server-Only Config**: Environment variables accessed via `context.env` (Hydrogen 2 pattern)
5. **Custom Hooks**: Reusable logic for initialization and sync

## Security

### Environment Variables

All sensitive credentials are stored in environment variables and only accessed server-side:

```typescript
// ✅ CORRECT - Server-side only
export function getSwymConfig(env: Env): SwymServerConfig {
   return {
      REST_API_KEY: env.SWYM_API_KEY,
      ENDPOINT: env.SWYM_ENDPOINT,
      PID: env.SWYM_PID,
   };
}
```

### API Route Protection

All Swym API calls go through internal routes that:
1. Validate request parameters
2. Inject server-side credentials
3. Proxy requests to Swym API

Client code **never** has access to API keys.

### Required Headers

The service layer automatically includes:
- `x-api-key`: Your Swym REST API key
- `user-agent`: Identifies the application (Shopify-Hydrogen/2.0)

## Testing

### Test Service Layer Functions

```typescript
import {fetchListsServer} from '~/services/swym/swym.server';

describe('fetchListsServer', () => {
   it('fetches lists successfully', async () => {
      const mockConfig = {
         REST_API_KEY: 'test-key',
         ENDPOINT: 'https://test.swym.it',
         PID: 'test-pid',
      };

      const result = await fetchListsServer('regid', 'sessionid', mockConfig);
      expect(result.ok).toBe(true);
   });
});
```

### Test Components

```typescript
import {render, screen} from '@testing-library/react';
import {WishlistButton} from '~/services/swym/components/wishlistButton/WishlistButton';
import {WishlistProvider} from '~/services/swym/provider';

describe('WishlistButton', () => {
   it('renders correctly', () => {
      render(
              <WishlistProvider>
                      <WishlistButton
                              productId="gid://shopify/Product/123"
      variantId="gid://shopify/ProductVariant/456"
      productHandle="test-product"
              />
              </WishlistProvider>
   );

      expect(screen.getByRole('button')).toBeInTheDocument();
   });
});
```

## Troubleshooting

### Issue: "Missing required environment variable"

**Solution:** Ensure all three environment variables are set in `.env`:
```env
SWYM_API_KEY=your_key
SWYM_ENDPOINT=https://swym.it
SWYM_PID=your_pid
```

### Issue: "Wishlist not initialized yet"

**Solution:** Make sure `useSwymInit()` is called in your layout component before using wishlist features.

### Issue: "Cannot read property 'regid' of null"

**Solution:** Check that `WishlistProvider` wraps your entire app in `root.tsx`.

### Issue: Guest wishlist not syncing on login

**Solution:** Ensure `useSyncWishlistOnLogin(customer)` is called in a component that receives the customer object from a loader.

### Issue: TypeScript errors with Shopify GIDs

**Solution:** The integration expects string GIDs (e.g., `gid://shopify/Product/123`). Use the `extractProductId` utility to convert to Swym's numeric format:

```typescript
import {extractProductId} from '~/services/swym/swym.utils';

const swymProductId = extractProductId('gid://shopify/Product/123456');
// Returns: 123456
```

## Additional Documentation

- [Swym REST API Documentation](https://developers.getswym.com/docs/rest-api-lists-getting-started)
- [Shopify Hydrogen Documentation](https://shopify.dev/docs/api/hydrogen)
- [Customer Account API](https://shopify.dev/docs/api/customer)

## Contributing

Contributions are welcome! If you find issues or have improvements:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -am 'Add improvement'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request

## License

MIT License - feel free to use in your projects.

---

**Built for the Shopify Hydrogen community**

*If you find this helpful, please star the repository!*
