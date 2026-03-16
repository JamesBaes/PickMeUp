// This file defines what an "Order" looks like in our app
// Like a blueprint for order data

export interface Order {
  id: string;                   // Unique ID for each order
  date: string;                 // When order was placed
  location: string;             // Restaurant location
  orderNumber: string;          // Order number like "ORD-001"
  items: OrderItem[];           // List of items in the order
  subtotal: number;             // Price before tax
  tax: number;                  // Tax amount
  total: number;                // Final price (subtotal + tax)
  status?: string;              // Order status (active only)
  progress?: number;            // Progress % (active only)
}

export interface OrderItem {
  name: string;     // Item name like "Burger"
  quantity: number; // How many of this item
  price: number;    // Price per item
}