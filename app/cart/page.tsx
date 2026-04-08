'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { useCart } from '@/context/cartContext'
import { useLocation } from '@/context/locationContext'
import supabase from '@/utils/supabase/client'
import { MenuItem } from '@/types'
import { transformMenuItemData, formatItemName } from '@/helpers/menuHelpers'
import CartItemCard from '@/components/cart/CartItemCard'
import ClearCartModal from '@/components/cart/ClearCartModal'
import ConflictingItemsList from '@/components/cart/ConflictingItemsList'
import LocationSwapSuggestion from '@/components/cart/LocationSwapSuggestion'
import LocationMismatchBanner from '@/components/cart/LocationMismatchBanner'
import CheckoutGuardModal from '@/components/cart/CheckoutGuardModal'
import { TAX_RATE } from '@/helpers/orderHelpers'

const UNASSIGNED_RESTAURANT_ID = 'Unassigned';

type LocationSwapSuggestionType = {
  targetLocation: { id: string; name: string };
  swaps: Array<{ oldItemId: string; newItem: MenuItem }>;
  unavailableNames: string[];
};

const Cart = () => {
  const router = useRouter();

  const { items: cartItems, removeItem, updateQuantity, clearCart, swapItemsToNewLocation } = useCart();
  const { locations, currentLocation, setCurrentLocation, loading } = useLocation();

  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [showCheckoutGuardModal, setShowCheckoutGuardModal] = useState(false);
  const [locationSwapSuggestion, setLocationSwapSuggestion] = useState<LocationSwapSuggestionType | null>(null);
  const [isCheckingSwap, setIsCheckingSwap] = useState(false);

  // IDs come from mixed sources (string/number), normalize before comparing.
  const normalizeId = (id: unknown) => String(id ?? '').trim();

  // Derived totals — memoized to avoid recalculating on every render.
  const { totalItemCount, subtotal, tax, total } = useMemo(() => {
    const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { totalItemCount, subtotal, tax, total };
  }, [cartItems]);

  // Group cart lines by restaurant so users can see mixed-location carts clearly.
  const groupedItems = cartItems.reduce<Record<string, typeof cartItems>>((acc, item) => {
    const key = normalizeId(item.restaurant_id) || UNASSIGNED_RESTAURANT_ID;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  const getRestaurantDisplayName = (restaurantId: string) => {
    if (restaurantId === UNASSIGNED_RESTAURANT_ID) return 'Restaurant';
    const match = locations.find((loc) => normalizeId(loc.id) === normalizeId(restaurantId));
    return match?.name || `Restaurant #${restaurantId}`;
  };

  const mismatchedItems = currentLocation?.id
    ? cartItems.filter((item) => normalizeId(item.restaurant_id) !== normalizeId(currentLocation.id))
    : [];

  const mismatchedRestaurantIds = Array.from(new Set(mismatchedItems.map((item) => normalizeId(item.restaurant_id))));

  const mismatchedRestaurantItemCounts = mismatchedRestaurantIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = cartItems.filter((item) => normalizeId(item.restaurant_id) === id).reduce((sum, item) => sum + item.quantity, 0);
    return acc;
  }, {});

  // True when selected pickup location does not match all items in cart.
  const hasLocationMismatch = Boolean(currentLocation?.id) && mismatchedRestaurantIds.length > 0;

  const activeMismatchedItemIds = new Set(mismatchedItems.map((item) => item.item_id));
  const activeSwaps = (locationSwapSuggestion?.swaps || []).filter((swap) => activeMismatchedItemIds.has(swap.oldItemId));
  const activeSwappableIds = new Set(activeSwaps.map((swap) => swap.oldItemId));
  const unavailableMismatchedItems = mismatchedItems.filter((item) => !activeSwappableIds.has(item.item_id));
  const unavailableDisplayNames = Array.from(
    new Set(unavailableMismatchedItems.map((item) => formatItemName(item.name)))
  );

  // Query the target location's menu and find cart items available there by name.
  const checkAvailabilityAtLocation = async (targetLocationId: string, targetLocationName: string) => {
    const mismatched = cartItems.filter((item) => normalizeId(item.restaurant_id) !== normalizeId(targetLocationId));
    if (mismatched.length === 0) {
      setLocationSwapSuggestion(null);
      return;
    }
    setIsCheckingSwap(true);
    try {
      const { data, error } = await supabase
        .from('menu_items_restaurant_locations')
        .select('item_id, restaurant_id, name, price, popular, description, category, bogo, image_url, calories, allergy_information')
        .eq('restaurant_id', parseInt(targetLocationId, 10));
      if (error) throw error;

      const targetItems = (data || []).map(transformMenuItemData);
      const targetByName = new Map(targetItems.map((item) => [item.name.toLowerCase(), item]));
      const swaps: Array<{ oldItemId: string; newItem: MenuItem }> = [];
      const unavailableNames: string[] = [];

      for (const cartItem of mismatched) {
        const match = targetByName.get(cartItem.name.toLowerCase());
        if (match) swaps.push({ oldItemId: cartItem.item_id, newItem: match });
        else unavailableNames.push(cartItem.name);
      }
      setLocationSwapSuggestion({ targetLocation: { id: targetLocationId, name: targetLocationName }, swaps, unavailableNames });
    } catch (err) {
      console.error('Error checking location availability:', err);
    } finally {
      setIsCheckingSwap(false);
    }
  };

  const handleLocationChange = (locationId: string) => {
    const selected = locations.find((loc) => loc.id === locationId) || null;
    setCurrentLocation(selected);
    setLocationSwapSuggestion(null);
    if (selected) checkAvailabilityAtLocation(selected.id, selected.name);
  };

  const handleSwapItems = () => {
    if (!locationSwapSuggestion || activeSwaps.length === 0) return;
    swapItemsToNewLocation(activeSwaps);
    setLocationSwapSuggestion(null);
  };

  const handleRemoveUnavailableItems = () => {
    if (!locationSwapSuggestion) return;
    unavailableMismatchedItems.forEach((item) => removeItem(item.item_id));
  };

  // Prevent checkout until user resolves pickup location conflicts.
  const handleProceedToCheckout = () => {
    if (!currentLocation || mismatchedRestaurantIds.length > 0) {
      setShowCheckoutGuardModal(true);
      return;
    }
    router.push('/checkout');
  };

  // Auto-close guard modal when conflicts are resolved.
  useEffect(() => {
    if (showCheckoutGuardModal && currentLocation && mismatchedRestaurantIds.length === 0) {
      setShowCheckoutGuardModal(false);
    }
    if (mismatchedRestaurantIds.length === 0) {
      setLocationSwapSuggestion(null);
    }
  }, [showCheckoutGuardModal, currentLocation, mismatchedRestaurantIds.length]);

  // When the modal opens, check if mismatched items are available at the current location.
  // checkAvailabilityAtLocation and locationSwapSuggestion are intentionally excluded from deps
  // to avoid re-triggering on every swap-state update — this effect should only fire when
  // the modal visibility or selected location changes.
  useEffect(() => {
    if (showCheckoutGuardModal && currentLocation && mismatchedRestaurantIds.length > 0) {
      if (!locationSwapSuggestion || locationSwapSuggestion.targetLocation.id !== currentLocation.id) {
        checkAvailabilityAtLocation(currentLocation.id, currentLocation.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckoutGuardModal, currentLocation?.id, mismatchedRestaurantIds.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="font-body text-neutral-600">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">

        {/* Left section — cart items */}
        <section className="flex flex-col lg:w-3/5">
          <header className="flex justify-between items-end pb-4">
            <h2 className="font-heading font-bold text-3xl">Shopping Cart</h2>
            <div className="flex items-center gap-3">
              <span className="font-body text-neutral-600 text-md">{totalItemCount} items</span>
              {cartItems.length > 0 && (
                <button
                  className="font-body text-sm text-danger hover:text-danger-dark hover:cursor-pointer"
                  onClick={() => setShowClearCartConfirm(true)}
                >
                  Clear Cart
                </button>
              )}
            </div>
          </header>

          <hr className="border-neutral-300" />

          {cartItems.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-body text-neutral-500 text-lg">Your cart is empty</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 py-4">
              {Object.entries(groupedItems).map(([restaurantId, restaurantItems]) => (
                <div key={restaurantId} className="rounded-xl border border-neutral-200 bg-background p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold text-neutral-900">
                      {getRestaurantDisplayName(restaurantId)}
                    </h3>
                    <span className="font-body text-sm text-neutral-500">
                      {restaurantItems.length} item{restaurantItems.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-neutral-200">
                    {restaurantItems.map((item) => (
                      <div key={`${restaurantId}-${item.item_id}`} className="py-3">
                        <CartItemCard
                          item={item}
                          onQuantityChange={(quantity) => updateQuantity(item.item_id, quantity)}
                          onRemove={() => removeItem(item.item_id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr className="border-neutral-300" />

          <div className="flex justify-between pt-4">
            <button
              className="font-body text-md text-neutral-600 hover:text-neutral-700 hover:cursor-pointer"
              onClick={() => router.push('/')}
            >
              Back to Menu
            </button>
            {cartItems.length > 0 && (
              <button
                className="font-body text-md text-danger hover:text-danger-dark hover:cursor-pointer"
                onClick={() => setShowClearCartConfirm(true)}
              >
                Clear Cart
              </button>
            )}
          </div>
        </section>

        {/* Right section — order summary */}
        <section className="flex flex-col lg:w-2/5 bg-neutral-50 shadow-md p-8 xl:p-12 rounded-2xl h-fit">
          <header className="flex justify-between items-end pb-4">
            <h2 className="font-heading font-bold text-3xl">Order Summary</h2>
            <span className="font-body text-neutral-600 text-md">{totalItemCount} items</span>
          </header>

          <hr className="border-neutral-300" />

          <div className="py-4">
            <label className="font-body text-neutral-600 mb-2 block">Pickup Location</label>
            <select
              value={currentLocation?.id || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="" disabled>Select Location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>

            <LocationSwapSuggestion
              isChecking={isCheckingSwap}
              suggestion={locationSwapSuggestion}
              onSwap={handleSwapItems}
              onDismiss={() => setLocationSwapSuggestion(null)}
            />

            {hasLocationMismatch && currentLocation && (
              <ConflictingItemsList
                items={mismatchedItems}
                getDisplayName={getRestaurantDisplayName}
                onRemove={removeItem}
                maxHeight="max-h-40"
                padding="p-3"
              />
            )}
          </div>

          <hr className="border-neutral-300" />

          <div className="flex flex-col py-4 gap-3">
            <div className="flex justify-between font-body">
              <span className="text-neutral-600">Subtotal</span>
              <span className="text-neutral-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-body">
              <span className="text-neutral-600">Tax (13%)</span>
              <span className="text-neutral-900">${tax.toFixed(2)}</span>
            </div>
          </div>

          <hr className="border-neutral-300" />

          <div className="flex justify-between font-heading text-xl pt-4 pb-6">
            <span className="font-bold">Total</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>

          <button
            className="w-full bg-accent text-white font-heading font-semibold py-3 hover:cursor-pointer rounded-lg hover:shadow-lg transition-colors disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:shadow-none"
            disabled={cartItems.length === 0 || hasLocationMismatch}
            onClick={handleProceedToCheckout}
          >
            {hasLocationMismatch ? 'Resolve Conflicts to Checkout' : 'Proceed to Checkout'}
          </button>
        </section>

        {hasLocationMismatch && (
          <LocationMismatchBanner
            currentLocation={currentLocation}
            mismatchedRestaurantIds={mismatchedRestaurantIds}
            mismatchedRestaurantItemCounts={mismatchedRestaurantItemCounts}
            getDisplayName={getRestaurantDisplayName}
            onReview={() => setShowCheckoutGuardModal(true)}
          />
        )}

        {showCheckoutGuardModal && (
          <CheckoutGuardModal
            currentLocation={currentLocation}
            mismatchedItems={mismatchedItems}
            activeSwaps={activeSwaps}
            unavailableMismatchedItems={unavailableMismatchedItems}
            unavailableDisplayNames={unavailableDisplayNames}
            isCheckingSwap={isCheckingSwap}
            locationSwapSuggestion={locationSwapSuggestion}
            locations={locations}
            getDisplayName={getRestaurantDisplayName}
            onRemove={removeItem}
            onSwap={handleSwapItems}
            onRemoveUnavailable={handleRemoveUnavailableItems}
            onLocationChange={handleLocationChange}
            onClose={() => setShowCheckoutGuardModal(false)}
          />
        )}
      </div>

      {showClearCartConfirm && (
        <ClearCartModal
          onConfirm={() => { clearCart(); setShowClearCartConfirm(false); }}
          onCancel={() => setShowClearCartConfirm(false)}
        />
      )}
    </div>
  );
};

export default Cart;
