'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../utils/supabase/client'
import { useAuth } from './authContext'
import { MenuItem } from '@/types'

// Temporary shortcut for demos/testing.
// Keep this true until the favorites table + RLS are fully ready.
// Later, just flip it to false and everything goes back to Supabase.
export const USE_MOCK_FAVORITES = true

const MOCK_FAVORITE_ITEMS: MenuItem[] = [
  {
    item_id: '1',
    restaurant_id: '1',
    name: 'Double Cheese Smash',
    description: 'Double smashed beef patties with cheese, lettuce, and house sauce.',
    price: 12.99,
    category: 'beef_burgers',
    calories: 0,
    allergy_information: '',
    image_url: '/double-cheese-smash.png',
    list_of_ingredients: [],
  },
  {
    item_id: '2',
    restaurant_id: '1',
    name: 'Crispy Chicken Blaze',
    description: 'Crispy chicken burger with signature spicy sauce and fresh toppings.',
    price: 11.49,
    category: 'chicken_burgers',
    calories: 0,
    allergy_information: '',
    image_url: '/crispy-chicken-blaze.png',
    list_of_ingredients: [],
  },
]

const getMockFavoriteIds = () =>
  new Set(MOCK_FAVORITE_ITEMS.map((item) => parseInt(item.item_id.toString(), 10)).filter((id) => !Number.isNaN(id)))

// The favorites table uses uuid for favorite_item_id, but menu items use integers.
// We convert item_id to a deterministic UUID for storage.
const itemIdToUuid = (itemId: number | string): string => {
  const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId
  return `00000000-0000-0000-0000-${id.toString().padStart(12, '0')}`
}

const uuidToItemId = (uuid: string): number => {
  return parseInt(uuid.split('-').pop() || '0', 10)
}

interface FavoritesContextType {
  favoriteIds: Set<number>
  favoriteItems: MenuItem[]
  isFavorite: (itemId: string | number) => boolean
  toggleFavorite: (item: MenuItem) => Promise<boolean>
  loading: boolean
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: new Set(),
  favoriteItems: [],
  isFavorite: () => false,
  toggleFavorite: async () => false,
  loading: false,
})

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(USE_MOCK_FAVORITES ? getMockFavoriteIds() : new Set())
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>(USE_MOCK_FAVORITES ? MOCK_FAVORITE_ITEMS : [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (USE_MOCK_FAVORITES) {
      setFavoriteIds(getMockFavoriteIds())
      setFavoriteItems(MOCK_FAVORITE_ITEMS)
      setLoading(false)
      return
    }

    if (!user) {
      setFavoriteIds(new Set())
      setFavoriteItems([])
      return
    }
    fetchFavorites()
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('favorite_item_id')
        .eq('customer_id', user.id)

      if (favError) throw favError

      if (!favData || favData.length === 0) {
        setFavoriteIds(new Set())
        setFavoriteItems([])
        return
      }

      const itemIds = favData.map(f => uuidToItemId(f.favorite_item_id))
      setFavoriteIds(new Set(itemIds))

      // Fetch item details from menu_items_restaurant_locations (deduplicated by item_id)
      const { data: itemData, error: itemError } = await supabase
        .from('menu_items_restaurant_locations')
        .select('item_id, restaurant_id, name, price, description, category, image_url, calories, allergy_information')
        .in('item_id', itemIds)

      if (itemError) throw itemError

      // Deduplicate: keep first occurrence per item_id
      const seen = new Set<number>()
      const uniqueItems = (itemData || []).filter(item => {
        if (seen.has(item.item_id)) return false
        seen.add(item.item_id)
        return true
      })

      setFavoriteItems(
        uniqueItems.map(item => ({
          item_id: item.item_id.toString(),
          restaurant_id: item.restaurant_id?.toString() || '',
          name: item.name,
          description: item.description || '',
          price: item.price || 0,
          category: item.category || '',
          calories: item.calories || '',
          allergy_information: item.allergy_information || '',
          image_url: item.image_url || '',
          list_of_ingredients: [],
        }))
      )
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFavorite = (itemId: string | number): boolean => {
    const parsedId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId
    const id = Number(parsedId)
    if (Number.isNaN(id)) return false
    return favoriteIds.has(id)
  }

  const toggleFavorite = async (item: MenuItem) => {
    if (USE_MOCK_FAVORITES) {
      const numericId = parseInt(item.item_id.toString(), 10)
      if (Number.isNaN(numericId)) return false

      const currentlyFavorite = favoriteIds.has(numericId)

      if (currentlyFavorite) {
        setFavoriteIds(prev => {
          const next = new Set(prev)
          next.delete(numericId)
          return next
        })
        setFavoriteItems(prev => prev.filter(f => parseInt(f.item_id.toString(), 10) !== numericId))
      } else {
        setFavoriteIds(prev => new Set([...prev, numericId]))
        setFavoriteItems(prev => [...prev, item])
      }

      return true
    }

    if (!user) return false
    const numericId = parseInt(item.item_id.toString(), 10)
    if (Number.isNaN(numericId)) return false
    const uuidId = itemIdToUuid(numericId)
    const currentlyFavorite = favoriteIds.has(numericId)

    const previousIds = new Set(favoriteIds)
    const previousItems = [...favoriteItems]

    if (currentlyFavorite) {
      setFavoriteIds(prev => {
        const next = new Set(prev)
        next.delete(numericId)
        return next
      })
      setFavoriteItems(prev =>
        prev.filter(f => parseInt(f.item_id.toString(), 10) !== numericId)
      )

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('favorite_item_id', uuidId)
        .eq('customer_id', user.id)

      if (error) {
        console.error('Error removing favorite:', error)
        setFavoriteIds(previousIds)
        setFavoriteItems(previousItems)
        return false
      }

      return true
    } else {
      setFavoriteIds(prev => new Set([...prev, numericId]))
      setFavoriteItems(prev => [...prev, item])

      const { error } = await supabase
        .from('favorites')
        .insert({ favorite_item_id: uuidId, customer_id: user.id })

      if (error) {
        console.error('Error adding favorite:', error)
        setFavoriteIds(previousIds)
        setFavoriteItems(previousItems)
        return false
      }

      return true
    }
  }

  return (
    <FavoritesContext.Provider value={{ favoriteIds, favoriteItems, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
