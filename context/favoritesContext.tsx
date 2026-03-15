'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../utils/supabase/client'
import { useAuth } from './authContext'
import { MenuItem } from '@/types'

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
  toggleFavorite: (item: MenuItem) => Promise<void>
  loading: boolean
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: new Set(),
  favoriteItems: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  loading: false,
})

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
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
    const id = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId
    return favoriteIds.has(id)
  }

  const toggleFavorite = async (item: MenuItem) => {
    if (!user) return
    const numericId = parseInt(item.item_id.toString(), 10)
    const uuidId = itemIdToUuid(numericId)

    if (favoriteIds.has(numericId)) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('favorite_item_id', uuidId)
        .eq('customer_id', user.id)

      if (!error) {
        setFavoriteIds(prev => {
          const next = new Set(prev)
          next.delete(numericId)
          return next
        })
        setFavoriteItems(prev =>
          prev.filter(f => parseInt(f.item_id.toString(), 10) !== numericId)
        )
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ favorite_item_id: uuidId, customer_id: user.id })

      if (!error) {
        setFavoriteIds(prev => new Set([...prev, numericId]))
        setFavoriteItems(prev => [...prev, item])
      }
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
