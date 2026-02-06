"use client";

import { useState } from "react";
import OrderCard from "./OrderCard";

// Mock data
const ACTIVE_ORDER = {
  id: "12394175012",
  date: "October 2, 2025",
  location: "Brampton, ON",
  orderNumber: "12394175012",
  items: [
    { name: "Combo Plate", quantity: 1, price: 25.99 },
    { name: "Strawberry Milkshake", quantity: 2, price: 6.50 },
    { name: "Chicken Burger", quantity: 1, price: 19.99 },
    { name: "Fries", quantity: 3, price: 4.99 }
  ],
  subtotal: 154.00,
  tax: 23.70,
  total: 177.70,
  estimatedDelivery: "6:45 PM",
  status: "Preparing your order",
  progress: 60
};

const PAST_ORDERS = [
  {
    id: "1",
    date: "October 2, 2025",
    location: "Brampton, ON",
    orderNumber: "12394175011",
    items: [
      { name: "Combo Plate", quantity: 1, price: 25.99 },
      { name: "Strawberry Milkshake", quantity: 1, price: 6.50 }
    ],
    subtotal: 32.49,
    tax: 4.88,
    total: 37.37
  },
  {
    id: "2",
    date: "September 28, 2025",
    location: "Brampton, ON",
    orderNumber: "12394175010",
    items: [
      { name: "Chicken Burger", quantity: 2, price: 19.99 },
      { name: "Fries", quantity: 1, price: 4.99 }
    ],
    subtotal: 44.97,
    tax: 6.75,
    total: 51.72
  }
];

export default function OrderHistoryPage() {
  const [hasActiveOrder] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Order History
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Track your active orders and view past purchases
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Active Order Section */}
        {hasActiveOrder && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Active Order 🚚
            </h2>
            <OrderCard order={ACTIVE_ORDER} isActive={true} />
          </div>
        )}

        {/* Past Orders Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Past Orders ({PAST_ORDERS.length})
            </h2>
            <div className="text-sm text-gray-600">
              Sorted by: <span className="font-semibold">Most Recent</span>
            </div>
          </div>

          {PAST_ORDERS.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Past Orders</h3>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
              <button className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition">
                Browse Menu
              </button>
            </div>
          ) : (
            <div>
              {PAST_ORDERS.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}