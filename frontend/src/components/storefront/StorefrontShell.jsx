import { Suspense } from 'react';
import StorefrontLayout from './StorefrontLayout';
import { CartProvider } from '../../store/storefrontCart';
import { WishlistProvider } from '../../store/storefrontWishlist';
import { CompareProvider } from '../../store/storefrontCompare';
import { StorefrontI18nProvider } from '../../store/storefrontI18n';
import { ProductDetailSkeleton } from './StorefrontUi';

export default function StorefrontShell({ children }) {
  return (
    <StorefrontI18nProvider>
      <WishlistProvider>
        <CompareProvider>
          <CartProvider>
            <StorefrontLayout>
              <Suspense fallback={<ProductDetailSkeleton />}>
                {children}
              </Suspense>
            </StorefrontLayout>
          </CartProvider>
        </CompareProvider>
      </WishlistProvider>
    </StorefrontI18nProvider>
  );
}
