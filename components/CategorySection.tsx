import { MenuItem, MenuCategory } from '@/types/';
import { formatCategoryName } from '@/helpers/menuHelpers';
import MenuItemCard from './MenuItemCard';
import { CategorySectionProps } from '@/types';


export default function CategorySection({ category, items }: CategorySectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-4xl font-heading font-bold mb-6 inline-block">
        {formatCategoryName(category as MenuCategory)}
      </h2>
      {/* FIX COLS TO ALIGN FOR SMALLER SCREENS/MOBILE SCREENS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {items.map((item) => (
          <MenuItemCard key={item.item_id || item.name} item={item} />
        ))}
      </div>
    </section>
  );
}