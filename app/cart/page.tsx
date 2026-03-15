'use client'
import CartItemCard from '@/components/CartItemCard'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useCart } from '@/context/cartContext'
import { useLocation } from '@/context/locationContext'
import supabase from '@/utils/supabase/client'
import { MenuItem } from '@/types'
import { transformMenuItemData } from '@/helpers/menuHelpers'

// tax rate for ontario
const TAX_RATE = 0.13;

const Cart = () => {

  const router = useRouter();

  // cart context - cart operations
  const {
    items: cartItems,
    removeItem,
    updateQuantity,
    clearCart,
    lastCartSyncAt,
    isRealtimeSyncEnabled,
    swapItemsToNewLocation,
  } = useCart();

  const { locations, currentLocation, setCurrentLocation, loading } = useLocation();

  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  // Modal used to prevent invalid checkout when location/cart mismatch exists.
  const [showCheckoutGuardModal, setShowCheckoutGuardModal] = useState(false);

  // Suggestion shown when the user changes pickup location and matching items exist at the new location.
  type LocationSwapSuggestion = {
    targetLocation: { id: string; name: string };
    swaps: Array<{ oldItemId: string; newItem: MenuItem }>;
    unavailableNames: string[];
  };
  const [locationSwapSuggestion, setLocationSwapSuggestion] = useState<LocationSwapSuggestion | null>(null);
  const [isCheckingSwap, setIsCheckingSwap] = useState(false);

  // IDs come from mixed sources (string/number), so normalize before compare.
  const normalizeRestaurantId = (id: unknown) => String(id ?? '').trim();

  // Group cart lines by restaurant so users can see mixed-location carts clearly.
  const groupedItems = cartItems.reduce<Record<string, typeof cartItems>>((acc, item) => {
    const restaurantKey = normalizeRestaurantId(item.restaurant_id) || 'Unassigned';
    if (!acc[restaurantKey]) {
      acc[restaurantKey] = [];
    }
    acc[restaurantKey].push(item);
    return acc;
  }, {});

  // function to calculate the total after tax
  const calculateTotal = () => {
    const newSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTax = newSubtotal * TAX_RATE;
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newSubtotal + newTax);
  }


  // recalculates the totals when the cart changes
  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  // all functions for updating, removing, or clearing cart handle both use and guest!

  // function updates the quantity of an item
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  }

  const handleClearCart = () => {
    clearCart();
  }

  const handleLocationChange = (locationId: string) => {
    const selected = locations.find((loc) => loc.id === locationId) || null;
    setCurrentLocation(selected);
    setLocationSwapSuggestion(null);
    if (selected) {
      checkAvailabilityAtLocation(selected.id, selected.name);
    }
  };

  // Query the target location's menu and find cart items that are available there by name.
  // If matches exist, surface a swap suggestion so the user can switch with one tap.
  const checkAvailabilityAtLocation = async (targetLocationId: string, targetLocationName: string) => {
    const mismatchedItems = cartItems.filter(
      (item) => normalizeRestaurantId(item.restaurant_id) !== normalizeRestaurantId(targetLocationId)
    );
    if (mismatchedItems.length === 0) {
      setLocationSwapSuggestion(null);
      return;
    }

    setIsCheckingSwap(true);
    try {
      const numericId = parseInt(targetLocationId, 10);
      const { data, error } = await supabase
        .from('menu_items_restaurant_locations')
        .select('item_id, restaurant_id, name, price, popular, description, category, bogo, image_url, calories, allergy_information')
        .eq('restaurant_id', numericId);

      if (error) throw error;

      const targetItems = (data || []).map(transformMenuItemData);
      const targetByName = new Map(targetItems.map((item) => [item.name.toLowerCase(), item]));

      const swaps: Array<{ oldItemId: string; newItem: MenuItem }> = [];
      const unavailableNames: string[] = [];

      for (const cartItem of mismatchedItems) {
        const match = targetByName.get(cartItem.name.toLowerCase());
        if (match) {
          swaps.push({ oldItemId: cartItem.item_id, newItem: match });
        } else {
          unavailableNames.push(cartItem.name);
        }
      }

      setLocationSwapSuggestion({ targetLocation: { id: targetLocationId, name: targetLocationName }, swaps, unavailableNames });
    } catch (err) {
      console.error('Error checking location availability:', err);
    } finally {
      setIsCheckingSwap(false);
    }
  };

  const handleSwapItems = () => {
    if (!locationSwapSuggestion) return;
    const activeMismatchedIds = new Set(mismatchedItems.map((item) => item.item_id));
    const activeSwaps = locationSwapSuggestion.swaps.filter((swap) => activeMismatchedIds.has(swap.oldItemId));
    if (activeSwaps.length === 0) return;

    swapItemsToNewLocation(activeSwaps);
    setLocationSwapSuggestion(null);
  };

  const handleRemoveUnavailableItems = () => {
    if (!locationSwapSuggestion) return;

    const activeMismatchedIds = new Set(mismatchedItems.map((item) => item.item_id));
    const swappableOldIds = new Set(
      locationSwapSuggestion.swaps
        .filter((swap) => activeMismatchedIds.has(swap.oldItemId))
        .map((swap) => swap.oldItemId),
    );
    mismatchedItems
      .filter((item) => !swappableOldIds.has(item.item_id))
      .forEach((item) => removeItem(item.item_id));
  };

  const getRestaurantDisplayName = (restaurantId: string) => {
    if (restaurantId === 'Unassigned') {
      return 'Restaurant';
    }

    const normalizedId = normalizeRestaurantId(restaurantId);
    const matchedLocation = locations.find((loc) => normalizeRestaurantId(loc.id) === normalizedId);
    return matchedLocation?.name || `Restaurant #${restaurantId}`;
  };

  const mismatchedItems = cartItems.filter((item) => {
    if (!currentLocation?.id || !item.restaurant_id) {
      return false;
    }
    return normalizeRestaurantId(item.restaurant_id) !== normalizeRestaurantId(currentLocation.id);
  });

  const mismatchedRestaurantIds = Array.from(
    new Set(mismatchedItems.map((item) => normalizeRestaurantId(item.restaurant_id))),
  );

  const mismatchedRestaurantNames = mismatchedRestaurantIds.map((restaurantId) =>
    getRestaurantDisplayName(restaurantId),
  );

  const mismatchedRestaurantItemCounts = mismatchedRestaurantIds.reduce<Record<string, number>>((acc, restaurantId) => {
    const totalQuantityForLocation = cartItems
      .filter((item) => normalizeRestaurantId(item.restaurant_id) === restaurantId)
      .reduce((sum, item) => sum + item.quantity, 0);

    acc[restaurantId] = totalQuantityForLocation;
    return acc;
  }, {});

  // True when selected pickup location does not match all items in cart.
  const hasLocationMismatch = Boolean(currentLocation?.id) && mismatchedRestaurantIds.length > 0;

  const activeMismatchedItemIds = new Set(mismatchedItems.map((item) => item.item_id));
  const activeSwaps = (locationSwapSuggestion?.swaps || []).filter((swap) =>
    activeMismatchedItemIds.has(swap.oldItemId),
  );
  const activeSwappableIds = new Set(activeSwaps.map((swap) => swap.oldItemId));
  const unavailableMismatchedItems = mismatchedItems.filter((item) => !activeSwappableIds.has(item.item_id));
  const unavailableDisplayNames = Array.from(
    new Set(
      unavailableMismatchedItems.map((item) =>
        item.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      ),
    ),
  );

  // Prevent checkout until user resolves pickup location conflicts.
  const handleProceedToCheckout = () => {
    if (!currentLocation) {
      setShowCheckoutGuardModal(true);
      return;
    }

    if (mismatchedRestaurantIds.length > 0) {
      setShowCheckoutGuardModal(true);
      return;
    }

    router.push('/checkout');
  };

  useEffect(() => {
    // Auto-close guard modal when conflicts are resolved.
    if (showCheckoutGuardModal && currentLocation && mismatchedRestaurantIds.length === 0) {
      setShowCheckoutGuardModal(false);
    }

    if (mismatchedRestaurantIds.length === 0) {
      setLocationSwapSuggestion(null);
    }
  }, [showCheckoutGuardModal, currentLocation, mismatchedRestaurantIds.length]);

  useEffect(() => {
    // When the modal opens, check if mismatched items are available at the current location.
    if (showCheckoutGuardModal && currentLocation && mismatchedRestaurantIds.length > 0) {
      if (!locationSwapSuggestion || locationSwapSuggestion.targetLocation.id !== currentLocation.id) {
        checkAvailabilityAtLocation(currentLocation.id, currentLocation.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckoutGuardModal, currentLocation?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="font-body text-gray-600">Loading cart...</p>
      </div>
    )
  };

  return (
    <div className="flex flex-row">
      {/* Left section */}
      <section className="flex flex-col w-3/5 my-12 mx-20">
        <header className="flex justify-between items-end pb-4">
          <h2 className="font-heading font-bold text-3xl">Shopping Cart</h2>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isRealtimeSyncEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              <span className="font-body text-xs text-gray-500">
                {isRealtimeSyncEnabled ? 'Auto-sync on' : 'Auto-sync off (guest)'}
              </span>
              {lastCartSyncAt && (
                <span className="font-body text-xs text-emerald-600">Updated from another session just now</span>
              )}
            </div>
            <div className="flex items-center gap-3">
            <h2 className="font-body text-gray-600 text-md">{cartItems.length} items</h2>
            {cartItems.length > 0 && (
              <button
                className="font-body text-sm text-red-500 hover:text-red-600 hover:cursor-pointer"
                onClick={handleClearCart}
              >
                Clear Cart
              </button>
            )}
            </div>
          </div>
        </header>
        
        <hr className="border-gray-300" />
        
        {cartItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-body text-gray-500 text-lg">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 py-4">
            {Object.entries(groupedItems).map(([restaurantId, restaurantItems]) => (
              <div key={restaurantId} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-gray-900">
                    {getRestaurantDisplayName(restaurantId)}
                  </h3>
                  <span className="font-body text-sm text-gray-500">
                    {restaurantItems.length} item{restaurantItems.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex flex-col divide-y divide-gray-200">
                  {restaurantItems.map((item) => (
                    <div key={`${restaurantId}-${item.item_id}`} className="py-3">
                      <CartItemCard 
                        item={item}
                        onQuantityChange={(quantity) => handleUpdateQuantity(item.item_id, quantity)}
                        onRemove={() => handleRemoveItem(item.item_id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <hr className="border-gray-300" />

        <div className="flex justify-between pt-4">
          <button 
            className="font-body text-md text-gray-600 hover:text-gray-700 hover:cursor-pointer" 
            onClick={() => router.push("/")}
          >
            Back to Menu
          </button>
          {cartItems.length > 0 && (
            <button 
              className="font-body text-md text-red-500 hover:text-red-600 hover:cursor-pointer"
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          )}
        </div>
      </section>

      {/* Right section */}
      <section className="flex flex-col w-2/5 my-12 mr-20 bg-gray-50 shadow-md p-12 rounded-2xl">
        <header className="flex justify-between items-end pb-4">
          <h2 className="font-heading font-bold text-3xl">Order Summary</h2>
          <h2 className="font-body text-gray-600 text-md">{cartItems.length} items</h2>
        </header>
        
        <hr className="border-gray-300" />
        
        <div className="py-4">
          <label className="font-body text-gray-600 mb-2 block">Pickup Location</label>
          <select 
            value={currentLocation?.id || ''}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="" disabled>Select Location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>

          {/* Location swap suggestion — shown when cart items exist at the newly selected location */}
          {isCheckingSwap && (
            <p className="mt-2 font-body text-xs text-gray-400">Checking availability at this location…</p>
          )}
          {!isCheckingSwap && locationSwapSuggestion && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="font-heading text-sm font-semibold text-blue-800">
                Switch to {locationSwapSuggestion.targetLocation.name}?
              </p>
              <p className="mt-1 font-body text-xs text-blue-700">
                {locationSwapSuggestion.swaps.length} of your item{locationSwapSuggestion.swaps.length === 1 ? '' : 's'} {locationSwapSuggestion.swaps.length === 1 ? 'is' : 'are'} available at this location.
              </p>
              {locationSwapSuggestion.unavailableNames.length > 0 && (
                <p className="mt-1 font-body text-xs text-amber-700">
                  Not available here:{' '}
                  {locationSwapSuggestion.unavailableNames
                    .map((n) =>
                      n.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                    )
                    .join(', ')}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded-md bg-blue-600 px-3 py-1.5 font-body text-xs text-white hover:bg-blue-700 transition-colors"
                  onClick={handleSwapItems}
                >
                  Switch {locationSwapSuggestion.swaps.length} item{locationSwapSuggestion.swaps.length === 1 ? '' : 's'}
                </button>
                <button
                  className="rounded-md border border-blue-300 px-3 py-1.5 font-body text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                  onClick={() => setLocationSwapSuggestion(null)}
                >
                  Keep as-is
                </button>
              </div>
            </div>
          )}

          {hasLocationMismatch && currentLocation && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="font-body text-sm font-semibold text-red-700">Conflicting items:</p>
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1 font-body text-sm text-red-700">
                {cartItems
                  .filter((item) => normalizeRestaurantId(item.restaurant_id) !== normalizeRestaurantId(currentLocation.id))
                  .map((item) => (
                    <li key={`summary-${item.item_id}`} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-red-800">
                          {item.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className="text-xs text-red-400">
                          Qty {item.quantity} &middot; {getRestaurantDisplayName(normalizeRestaurantId(item.restaurant_id))}
                        </span>
                      </div>
                      <button
                        className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                        onClick={() => handleRemoveItem(item.item_id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <hr className="border-gray-300" />
        
        <div className="flex flex-col py-4 gap-3">
          <div className="flex justify-between font-body">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-body">
            <span className="text-gray-600">Tax (13%)</span>
            <span className="text-gray-900">${tax.toFixed(2)}</span>
          </div>
        </div>

        <hr className="border-gray-300" />
        
        <div className="flex justify-between font-heading text-xl pt-4 pb-6">
          <span className="font-bold">Total</span>
          <span className="font-bold">${total.toFixed(2)}</span>
        </div>
        
        <button
          className="w-full bg-accent text-white font-heading font-semibold py-3 hover:cursor-pointer rounded-lg hover:shadow-lg transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
          disabled={cartItems.length === 0 || hasLocationMismatch}
          onClick={handleProceedToCheckout}
        >
          {hasLocationMismatch ? 'Resolve Conflicts to Checkout' : 'Proceed to Checkout'}
        </button>
      </section>

      {hasLocationMismatch && (
        <div className="fixed left-1/2 top-24 z-40 w-full max-w-md -translate-x-1/2 px-4">
          <div className="alert alert-warning border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-lg">
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-heading text-base font-bold leading-none">Location Mismatch Detected</p>
                <button
                  className="btn btn-xs btn-outline border-amber-700 text-amber-800 hover:bg-amber-100"
                  onClick={() => setShowCheckoutGuardModal(true)}
                >
                  Review
                </button>
              </div>

              <div className="space-y-1">
                <p className="font-body text-sm">
                  Selected location: <span className="font-semibold">{currentLocation?.name}</span>
                </p>
                <div className="space-y-0.5 font-body text-sm">
                  {mismatchedRestaurantIds.map((restaurantId) => {
                    const name = getRestaurantDisplayName(restaurantId);
                    const itemCount = mismatchedRestaurantItemCounts[restaurantId] || 0;
                    return (
                      <p key={`floating-${restaurantId}`}>
                        {itemCount} item{itemCount === 1 ? '' : 's'} from {name}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckoutGuardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-2xl font-bold text-gray-900">Checkout Location Mismatch</h3>
            {!currentLocation ? (
              <p className="mt-3 font-body text-gray-700">
                Please choose a pickup location before checking out.
              </p>
            ) : (
              <>
                <p className="mt-3 font-body text-gray-700">
                  Your selected location is <span className="font-semibold">{currentLocation.name}</span>, but your cart has items from other locations.
                </p>
                <p className="mt-2 font-body text-sm text-gray-600">
                  You can switch items that exist in {currentLocation.name}, remove unavailable ones, or remove all conflicting items.
                </p>
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="font-body text-sm font-semibold text-red-700">Conflicting items:</p>
                  <ul className="mt-2 max-h-52 space-y-2 overflow-y-auto font-body text-sm text-red-700 pr-1">
                    {mismatchedItems.map((item) => (
                      <li key={item.item_id} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold text-red-800">
                            {item.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          <span className="text-xs text-red-400">
                            Qty {item.quantity} &middot; {getRestaurantDisplayName(normalizeRestaurantId(item.restaurant_id))}
                          </span>
                        </div>
                        <button
                          className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                          onClick={() => handleRemoveItem(item.item_id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Swap suggestion — shown when items exist at the selected location */}
                {isCheckingSwap && (
                  <p className="mt-3 font-body text-xs text-gray-400">Checking availability at {currentLocation.name}...</p>
                )}
                {!isCheckingSwap && locationSwapSuggestion && locationSwapSuggestion.targetLocation.id === currentLocation.id && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="font-heading text-sm font-semibold text-blue-800">
                      {activeSwaps.length} of {mismatchedItems.length} conflicting item{mismatchedItems.length === 1 ? '' : 's'} can be switched to {currentLocation.name}
                    </p>
                    {unavailableDisplayNames.length > 0 && (
                      <p className="mt-1 font-body text-xs text-amber-700">
                        Not available here:{' '}
                        {unavailableDisplayNames.join(', ')}
                      </p>
                    )}
                    <div className="mt-3 grid gap-2">
                      {activeSwaps.length > 0 && (
                        <button
                          className="w-full rounded-lg bg-blue-600 py-2 font-body text-sm text-white transition-colors hover:bg-blue-700"
                          onClick={handleSwapItems}
                        >
                          Switch Available Items ({activeSwaps.length})
                        </button>
                      )}
                      {unavailableMismatchedItems.length > 0 && (
                        <button
                          className="w-full rounded-lg border border-amber-300 bg-amber-50 py-2 font-body text-sm text-amber-700 transition-colors hover:bg-amber-100"
                          onClick={handleRemoveUnavailableItems}
                        >
                          Remove Unavailable Items ({unavailableMismatchedItems.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="mb-2 block font-body text-sm text-gray-700">Change pickup location</label>
                  <select
                    value={currentLocation?.id || ''}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="" disabled>Select Location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 font-body text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowCheckoutGuardModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart;
