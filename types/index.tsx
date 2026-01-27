export interface MenuItem {
  item_id: string; // Unique identifier for the menu item
  restaurant_id: string; // Identifier for the restaurant
  name: string; // Name of the menu item
  description: string; // Description of the menu item
  price: number; // Price of the menu item
  category: string; // Category of the menu item (e.g., appetizer, main course, dessert)
  calories: number; // Caloric content of the menu item
  allergy_information: string; // Allergy information for the menu item
  image_url: string; // URL to an image of the menu item
  list_of_ingredients: string[]; // List of ingredients used in the menu item
}

export interface MenuItemCardProps {
  item: MenuItem; // The menu item object from database
}

export interface CategorySectionProps {
  category: string; // The category name
  items: MenuItem[]; // Array of menu items in this category
}

export type MenuCategory =
  | "beef_burgers"
  | "chicken_burgers"
  | "veggie_burgers"
  | "steak_sandwiches"
  | "crowds_sides"
  | "extra_armour_sides"
  | "beverages"
  | "combos";

export interface GroupedMenuItems {
  [key: string]: MenuItem[];
}

// Dictonary/Record to map the category description to the category.
export const CategoryDescriptions: Record<MenuCategory, string> = {
  beef_burgers:
    "You deserve all the freshest ingredients. Our meat 🥩 is 100% Prime quality, never frozen and domestically raised with sustainable farming practices.",
  chicken_burgers:
    "We ❤️ 🐓 chicken. Chicken that's fresh and never frozen and hand breaded in-house, It’s the best whole white meat chicken out there!",
  veggie_burgers:
    "Delicious Veggie options loaded with fresh toppings and home made sauces.",
  steak_sandwiches:
    "6oz Rib-eye steak, thinly sliced and served as loaded philly cheesteak style. Your taste buds will thank you!",
  crowds_sides: "Crowd-pleasing favorites to complement your meal.",
  extra_armour_sides:
    "Loaded sides for those who want something extra special.",
  beverages:
    "Enjoy our rich and thick creamy shakes blended to perfection! OR satisfy your thirst from one of our great selection of drinks",
  combos: "",
};

// Cart Related Types

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface CartContextType {
  items: CartItem[]
  addItem: (item: MenuItem, quantity?: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  updateQuantity: (itemId: string, quantity: number) => void
  getItemCount: () => number
  getTotal: () => number
}

export interface CartProvideProps {
  children: React.ReactNode
}
