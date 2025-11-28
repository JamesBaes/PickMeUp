
export interface MenuItem {
    item_id: string;  // Unique identifier for the menu item
    restaurant_id: string;  // Identifier for the restaurant
    name: string; // Name of the menu item
    description: string;  // Description of the menu item
    price: number;  // Price of the menu item
    category: string;  // Category of the menu item (e.g., appetizer, main course, dessert)
    calories: number;  // Caloric content of the menu item
    allergy_information: string;  // Allergy information for the menu item
    image_url: string;  // URL to an image of the menu item
    list_of_ingredients: string[];  // List of ingredients used in the menu item
}

export interface MenuItemCardProps {
  item: MenuItem;  // The menu item object from database
}

