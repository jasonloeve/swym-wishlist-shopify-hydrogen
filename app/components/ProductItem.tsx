import {Fragment} from 'react';
import {Link} from 'react-router';
import {flattenConnection, Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {WishlistButton} from "~/services/swym/components/wishlistButton/WishlistButton";

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;

  // @NOTE - Need to investigate if there are any new Hydrogen methods when dealing with variants
  const variants = flattenConnection(product.variants);

  return (
    <Fragment key={product.id}>
      <Link
        className="product-item"
        prefetch="intent"
        to={variantUrl}
      >
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        <h4>{product.title}</h4>
        <small>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
      </Link>
      {/* @NOTE - Rough usage, when switching to built in base hydrogen functionality we may only need to pass through `productId` & productUrl */}
      <WishlistButton
        productId={product.id}
        variantId={variants[0].id} //!!! @NOTE -Currently note safe, investigate a better way of dealing with variants
        productUrl={variantUrl}
      />
    </Fragment>
  );
}
