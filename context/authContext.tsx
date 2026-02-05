'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import supabase from '../utils/supabase/client'
import { CartItem, MenuItem } from '@/types'

interface AuthContextType {
  user: User | null
  isGuest: boolean
  loading: boolean
  guestCart: CartItem[]
  addToGuestCart: (item: MenuItem, quantity?: number) => void
  updateGuestCartQuantity: (itemId: string, quantity: number) => void
  removeFromGuestCart: (itemId: string) => void
  clearGuestCart: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: true,
  loading: true,
  guestCart: [],
  addToGuestCart: () => {},
  updateGuestCartQuantity: () => {},
  removeFromGuestCart: () => {},
  clearGuestCart: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestCart, setGuestCart] = useState<CartItem[]>([])


  // Load guest cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('guestCart')
    if (stored) {
      try {
        setGuestCart(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing guest cart:', error)
        localStorage.removeItem('guestCart')
      }
    }
  }, [])
  
  // Whenever a change occurs the guest cart will be saved to local storage
  useEffect(() => {
    if (guestCart.length > 0) {
      localStorage.setItem('guestCart', JSON.stringify(guestCart))
    } else {
      localStorage.removeItem('guestCart')
    }
  }, [guestCart])

  // Merge guest cart into user's Supabase cart on login
  const mergeGuestCartToUser = async (userId: string) => {
    try {
      for (const item of guestCart) {
        const { data: existing } = await supabase
          .from('cart')
          .select('*')
          .eq('user_id', userId)
          .eq('product_id', item.item_id)
          .single()

        if (existing) {
          await supabase
            .from('cart')
            .update({ quantity: existing.quantity + item.quantity })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('cart')
            .insert({
              user_id: userId,
              product_id: item.item_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image_url,
              category: item.category,
              description: item.description
            })
        }
      }

      clearGuestCart()
    } catch (error) {
      console.error('Error merging guest cart:', error)
    }
  }

  const addToGuestCart = (item: MenuItem, quantity: number = 1) => {
    setGuestCart(prev => {
      const existing = prev.find(cartItem => cartItem.item_id === item.item_id)
      if (existing) {
        return prev.map(cartItem => 
          cartItem.item_id === item.item_id 
            ? { ...cartItem, quantity: cartItem.quantity + quantity } 
            : cartItem
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }

  const updateGuestCartQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromGuestCart(itemId)
      return
    }
    setGuestCart(prev => 
      prev.map(item => item.item_id === itemId ? { ...item, quantity } : item)
    )
  }

  const removeFromGuestCart = (itemId: string) => {
    setGuestCart(prev => prev.filter(item => item.item_id !== itemId))
  }

  const clearGuestCart = () => {
    setGuestCart([])
    localStorage.removeItem('guestCart')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)
      setLoading(false)
      
      // Merge guest cart when user logs in
      if (newUser && guestCart.length > 0) {
        await mergeGuestCartToUser(newUser.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [guestCart])

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isGuest: !user, 
        loading,
        guestCart,
        addToGuestCart,
        updateGuestCartQuantity,
        removeFromGuestCart,
        clearGuestCart 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


// hook for accessing context values.
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}