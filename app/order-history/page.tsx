"use client";

// Import React hooks for state and effects
import { useEffect, useState } from "react";
// Import our OrderCard component to display each order
import OrderCard from "./OrderCard";
// Import Supabase client to connect to our database
import supabase from "@/utils/supabase/client";

export default function OrderHistoryPage() {
  // ============================================
  // STATE VARIABLES - Where we store our data
  // ============================================
  
  // Stores the current active order (if any)
  const [activeOrder, setActiveOrder] = useState<any>(null);
  
  // Stores all past/completed orders
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  
  // Shows loading spinner when true
  const [loading, setLoading] = useState(true);
  
  // Stores any error messages
  const [error, setError] = useState("");

  // ============================================
  // FETCH DATA WHEN PAGE LOADS
  // ============================================
  
  // useEffect runs this code when the component first loads
  useEffect(() => {
    fetchOrders();
  }, []); // Empty array means run only once

  // ============================================
  // MAIN FUNCTION TO GET ORDERS FROM DATABASE
  // ============================================
  
  const fetchOrders = async () => {
    try {
      // Step 1: Start loading and clear any old errors
      setLoading(true);
      setError("");

      // Step 2: Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user is logged in, show error and stop
      if (!user) {
        setError("Please login to view your orders");
        return;
      }

      // ============================================
      // STEP 3: FETCH ACTIVE ORDERS
      // ============================================
      // Active orders are orders that are being prepared
      const { data: activeData } = await supabase
        .from("orders")           // Table name in database
        .select("*")              // Get all columns
        .eq("user_id", user.id)   // Only this user's orders
        .eq("status", "preparing") // Status = "preparing" means active
        .limit(1);                // Get only 1 active order

      // If we found an active order, save it to state
      if (activeData && activeData.length > 0) {
        setActiveOrder(activeData[0]);
      }

      // ============================================
      // STEP 4: FETCH PAST/COMPLETED ORDERS
      // ============================================
      // Past orders are orders that are already completed
      const { data: pastData } = await supabase
        .from("orders")           // Same table
        .select("*")              // Get all columns
        .eq("user_id", user.id)   // Only this user's orders
        .eq("status", "completed"); // Status = "completed" means done

      // Save past orders to state
      setPastOrders(pastData || []);

    } catch (err) {
      // If anything goes wrong, show error message
      setError("Failed to load orders from database");
      console.error("Error fetching orders:", err);
    } finally {
      // This runs whether we succeeded or failed
      setLoading(false);
    }
  };

  // ============================================
  // LOADING STATE - Show while fetching data
  // ============================================
  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Order History</h1>
        <p>Loading your orders from database...</p>
      </div>
    );
  }

  // ============================================
  // ERROR STATE - Show if something went wrong
  // ============================================
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Order History</h1>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ============================================
  // MAIN PAGE CONTENT - Show when data is loaded
  // ============================================
  return (
    <div className="p-8">
      {/* Page title */}
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      
      {/* ============================================ */}
      {/* ACTIVE ORDER SECTION */}
      {/* ============================================ */}
      
      {/* Only show active order section if we have an active order */}
      {activeOrder && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Active Order</h2>
          {/* 
            Pass the active order data to OrderCard component
            isActive={true} makes it look different from past orders
          */}
          <OrderCard order={activeOrder} isActive={true} />
        </div>
      )}

      {/* ============================================ */}
      {/* PAST ORDERS SECTION */}
      {/* ============================================ */}
      <div>
        {/* Show number of past orders in the title */}
        <h2 className="text-xl font-bold mb-4">
          Past Orders ({pastOrders.length})
        </h2>
        
        {/* Check if we have any past orders */}
        {pastOrders.length === 0 ? (
          // If no past orders, show this message
          <p className="text-gray-500">
            You haven't placed any orders yet.
          </p>
        ) : (
          // If we have past orders, display them
          <div className="space-y-4">
            {/* 
              Loop through each past order and create an OrderCard
              key={order.id} helps React keep track of each card
            */}
            {pastOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}