import { MenuItem, MenuCategory } from '@/types/';
import { formatCategoryName, sortByCategory } from '@/helpers/menuHelpers';
import MenuItemCard from './MenuItemCard';
import { CategorySectionProps } from '@/types';

export default function CategorySection({ category, items }: CategorySectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-4 border-primary pb-2 inline-block">
        {formatCategoryName(category as MenuCategory)}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {items.map((item) => (
          <MenuItemCard key={item.item_id || item.name} item={item} />
        ))}
      </div>
    </section>
  );
}