'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '../utils/supabase/client'
import { useAuth } from './authContext'
import { MenuItem } from '@/types'

const toNumericId = (id: string | number): number | null => {
  const n = typeof id === 'string' ? parseInt(id, 10) : id
  return Number.isFinite(n) ? n : null
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
        .select('item_id')
        .eq('customer_id', user.id)

      if (favError) throw favError

      if (!favData || favData.length === 0) {
        setFavoriteIds(new Set())
        setFavoriteItems([])
        return
      }

      const itemIds = favData
        .map((f) => toNumericId(f.item_id))
        .filter((id): id is number => id !== null)

      setFavoriteIds(new Set(itemIds))

      const { data: itemData, error: itemError } = await supabase
        .from('menu_items_restaurant_locations')
        .select('item_id, restaurant_id, name, price, description, category, image_url, calories, allergy_information')
        .in('item_id', itemIds)

      if (itemError) throw itemError

      // Deduplicate: keep first occurrence per item_id
      const seen = new Set<number>()
      const uniqueItems = (itemData || []).filter((item) => {
        if (seen.has(item.item_id)) return false
        seen.add(item.item_id)
        return true
      })

      setFavoriteItems(
        uniqueItems.map((item) => ({
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
    const id = toNumericId(itemId)
    return id !== null && favoriteIds.has(id)
  }

  const toggleFavorite = async (item: MenuItem): Promise<boolean> => {
    if (!user) return false

    const numericId = toNumericId(item.item_id)
    if (numericId === null) return false

    const currentlyFavorite = favoriteIds.has(numericId)
    const previousIds = new Set(favoriteIds)
    const previousItems = [...favoriteItems]

    if (currentlyFavorite) {
      setFavoriteIds((prev) => { const next = new Set(prev); next.delete(numericId); return next })
      setFavoriteItems((prev) => prev.filter((f) => toNumericId(f.item_id) !== numericId))

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('item_id', numericId)
        .eq('customer_id', user.id)

      if (error) {
        console.error('Error removing favorite:', error)
        setFavoriteIds(previousIds)
        setFavoriteItems(previousItems)
        return false
      }
    } else {
      setFavoriteIds((prev) => new Set([...prev, numericId]))
      setFavoriteItems((prev) => [...prev, item])

      const { error } = await supabase
        .from('favorites')
        .insert({ item_id: numericId, customer_id: user.id })

      if (error) {
        console.error('Error adding favorite:', error)
        setFavoriteIds(previousIds)
        setFavoriteItems(previousItems)
        return false
      }
    }

    return true
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
