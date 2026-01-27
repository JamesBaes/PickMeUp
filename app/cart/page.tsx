'use client'
import CartItemCard from '@/components/CartItemCard'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const Cart = () => {
  
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState("Brampton");

  const locations = [
    "Brampton",
    "Mississauga West",
    "Missisauge East",
    "Oakville",
    "Scarborough",
    "Waterloo"
  ];

  const cartItems = [
    {
      id: 1,
      name: "Gladiator",
      price: 12.50,
      quantity: 2,
      image: "/placeholder-drink.jpg",
      category: "Beef Burger"
    },
    {
      id: 2,
      name: "Liberator",
      price: 16.50,
      quantity: 1,
      image: "/placeholder-food.jpg",
      category: "Beef Burger"
    },
    {
      id: 3,
      name: "Chicken Mac",
      price: 15.50,
      quantity: 3,
      image: "/placeholder-food.jpg",
      category: "Chicken Burger"
    }
  ]

  // todo: function to calculate the total after tax
  const calculateTotal = () => {

  }
  

  return (
    <div className="flex flex-row">

      {/* Left section with shopping cart items */}
      <section className="flex flex-col w-3/5 my-12 mx-20">
        <header className="flex justify-between items-end pb-4">
          <h2 className="font-heading font-bold text-3xl">Shopping Cart</h2>
          <h2 className="font-body text-gray-600 text-md">{cartItems.length} items</h2>
        </header>
        
        <hr className="border-gray-300" />
        
        <div className="flex flex-col divide-y divide-gray-300">
          {cartItems.map((item) => (
            <div key={item.id} className="py-4">
              <CartItemCard item={item} />
            </div>
          ))}
        </div>

        <hr className="border-gray-300" />

        <button className="text-left font-body text-md text-gray-600 pt-4 hover:cursor-pointer hover:text-gray-700" onClick={() => router.push("/")}>
          Back to Menu
        </button>
      </section>
      

      {/* Right section with summary */}
      <section className="flex flex-col w-2/5 my-12 mr-20 bg-gray-50 shadow-md p-12 rounded-2xl ">
        <header className="flex justify-between items-end pb-4">
          <h2 className="font-heading font-bold text-3xl">Order Summary</h2>
          <h2 className="font-body text-gray-600 text-md">{cartItems.length} items</h2>
        </header>
        
        <hr className="border-gray-300" />
        
        {/* Location selector area */}
        <div className="py-4">
          <label className="font-body text-gray-600 mb-2 block">Pickup Location</label>
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
        </div>

        <hr className="border-gray-300" />
        
        <div className="flex flex-col py-4 gap-3">
          <div className="flex justify-between font-body">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">$93</span>
          </div>
          
          <div className="flex justify-between font-body">
            <span className="text-gray-600">Tax (13%)</span> {/* change this to the actual tax im just going of memory of 5 gst + 8 pst */}
            <span className="text-gray-900">$7</span>
          </div>
        </div>

        <hr className="border-gray-300" />
        
        <div className="flex justify-between font-heading text-xl pt-4 pb-6">
          <span className="font-bold">Total</span>
          <span className="font-bold">$100</span>
        </div>
        
        <button className="w-full bg-accent text-white font-heading font-semibold py-3 hover:cursor-pointer rounded-lg hover:shadow-lg transition-colors">
          Proceed to Checkout
        </button>
      </section>
    </div>
  )
}

export default Cart