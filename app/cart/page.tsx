"use client";
import CartItemCard from "@/components/CartItemCard";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import supabase from "@/utils/supabase/client";
import { useAuth } from "@/context/authContext";
import { useCart } from "@/context/cartContext";
import { CartItem } from "@/types";

// tax rate for ontario
const TAX_RATE = 0.13;

const Cart = () => {
  const router = useRouter();

  // auth context - user state and guest cart
  const { user, loading } = useAuth();

  // cart context - cart operations
  const {
    items: guestCartItems,
    removeItem: removeGuestItem,
    updateQuantity: updateGuestQuantity,
    clearCart: clearGuest,
  } = useCart();

  const useContextCart = guestCartItems.length > 0;

  const [cartItems, setCartItems] = useState<
    (CartItem & { cart_id?: string })[]
  >([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [isSupabaseCartAvailable, setIsSupabaseCartAvailable] = useState(true);

  // this loads the cart based on the auth state (user or guest)
  useEffect(() => {
    if (!loading) {
      if (user && !useContextCart && isSupabaseCartAvailable) {
        fetchCartFromSupabase();
      } else {
        setCartItems(guestCartItems);
      }
    }
  }, [user, loading, guestCartItems, useContextCart, isSupabaseCartAvailable]);

  // recalculates the totals when the cart changes
  useEffect(() => {
    calculateTotal();
  }, [cartItems]);

  const fetchCartFromSupabase = async () => {
    const { data, error } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user!.id);

    if (error) {
      const isMissingTable = error.message?.toLowerCase().includes("could not find the table");

      if (isMissingTable) {
        setIsSupabaseCartAvailable(false);
        setCartItems(guestCartItems);
        return;
      }

      console.error("Error fetching cart:", error.message);
      setCartItems(guestCartItems);
      return;
    }

    setIsSupabaseCartAvailable(true);
    setCartItems(data || []);
  };

  // function to calculate the total after tax
  const calculateTotal = () => {
    const newSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const newTax = newSubtotal * TAX_RATE;
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newSubtotal + newTax);
  };

  // all functions for updating, removing, or clearing cart handle both use and guest!

  // function updates the quantity of an item
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await handleRemoveItem(itemId);
      return;
    }

    if (user && !useContextCart && isSupabaseCartAvailable) {
      const { error } = await supabase
        .from("carts")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) {
        console.error("Error updating quantity:", error.message);
        return;
      }

      setCartItems((prev) =>
        prev.map((item) =>
          item.item_id === itemId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    } else {
      // Guest: update via cartContext
      updateGuestQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (user && !useContextCart && isSupabaseCartAvailable) {
      const { error } = await supabase.from("carts").delete().eq("id", itemId);

      if (error) {
        console.error("Error removing item:", error.message);
        return;
      }

      setCartItems((prev) => prev.filter((item) => item.item_id !== itemId));
    } else {
      removeGuestItem(itemId);
    }
  };

  const handleClearCart = async () => {
    if (user && !useContextCart && isSupabaseCartAvailable) {
      const { error } = await supabase
        .from("carts")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error clearing cart:", error.message);
        return;
      }

      setCartItems([]);
    } else {
      clearGuest();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="font-body text-gray-600">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
      {/* Left section */}
      <section className="flex flex-col w-full lg:w-3/5">
        <header className="flex justify-between items-end pb-4">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl">Shopping Cart</h2>
          <h2 className="font-body text-gray-600 text-sm sm:text-base">
            {cartItems.length} items
          </h2>
        </header>

        <hr className="border-gray-300" />

        {cartItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-body text-gray-500 text-lg">
              Your cart is empty
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-300">
            {cartItems.map((item) => (
              <div key={item.item_id} className="py-4">
                <CartItemCard
                  item={item}
                  onQuantityChange={(quantity) =>
                    handleUpdateQuantity(item.item_id, quantity)
                  }
                  onRemove={() => handleRemoveItem(item.item_id)}
                />
              </div>
            ))}
          </div>
        )}

        <hr className="border-gray-300" />

        <div className="flex justify-between pt-4 text-sm sm:text-base">
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
      <section className="flex flex-col w-full lg:w-2/5 bg-gray-50 shadow-md p-5 sm:p-8 lg:p-10 rounded-2xl h-fit">
        <header className="flex justify-between items-end pb-4">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl">Order Summary</h2>
          <h2 className="font-body text-gray-600 text-sm sm:text-base">
            {cartItems.length} items
          </h2>
        </header>

        <hr className="border-gray-300" />

        {/* <div className="py-4">
          <label className="font-body text-gray-600 mb-2 block">
            Pickup Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div> */}

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
          className="w-full bg-accent text-white font-heading font-semibold py-3 hover:cursor-pointer rounded-lg hover:shadow-lg transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed disabled:shadow-none"
          disabled={cartItems.length === 0}
          onClick={() => router.push("/checkout")}
        >
          Proceed to Checkout
        </button>
      </section>
      </div>
    </div>
  );
};

export default Cart;
