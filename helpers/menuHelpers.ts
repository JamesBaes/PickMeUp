import { MenuItem, MenuCategory, GroupedMenuItems, CategoryDescriptions } from '@/types';

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

/**
 * Group menu items by category
 */
export const groupByCategory = (items: MenuItem[]): GroupedMenuItems => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as GroupedMenuItems);
};

/**
 * Category display order
 */
export const categoryOrder: MenuCategory[] = [
    'beef_burgers',
    'chicken_burgers',
    'veggie_burgers',
    'steak_sandwiches',
    'combos',
    'crowds_sides',
    'extra_armour_sides',
    'beverages',
    'juice',
    'milkshakes',
    'soda_and_water',
    'treats',

];

/**
 * Format category names for display
 */
export const formatCategoryName = (category: MenuCategory): string => {
  const categoryMap: Record<MenuCategory, string> = {
    beef_burgers: 'Beef Burgers',
    chicken_burgers: 'Chicken Burgers',
    veggie_burgers: 'Veggie Burgers',
    steak_sandwiches: 'Steak Sandwiches',
    crowds_sides: 'Sides',
    extra_armour_sides: 'Extra Toppings',
    beverages: 'Beverages',
    combos: 'Combo Meals',
    juice: 'Juice',
    milkshakes: 'Milkshakes',
    soda_and_water: 'Soda & Water',
    treats: 'Treats',

  };
  return categoryMap[category] || category;
};


/**
 * Sort menu items by name
 */
export const sortByName = (items: MenuItem[]): MenuItem[] => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Sort menu items by price
 */
export const sortByPrice = (items: MenuItem[], ascending = true): MenuItem[] => {
  return [...items].sort((a, b) => 
    ascending ? a.price - b.price : b.price - a.price
  );
};

/*
  * transform menu item data from database to match MenuItem type
  */

export const transformMenuItemData = (item: any): MenuItem => ({
  item_id: item.item_id,
  restaurant_id: item.restaurant_id,
  name: item.name,
  description: item.description,
  price: item.price,
  category: item.category,
  calories: item.calories || 0,
  allergy_information: item.allergy_information || "",
  image_url: item.image_url || "",
  popular: item.popular || false,
  bogo: item.bogo || false,
});