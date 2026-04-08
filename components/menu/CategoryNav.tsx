import { RefObject } from 'react';
import { MenuCategory } from '@/types';
import { formatCategoryName } from '@/helpers/menuHelpers';

interface CategoryNavProps {
  categories: MenuCategory[];
  activeCategory: string | null;
  categoryNavRef: RefObject<HTMLDivElement | null>;
  categoryButtonRefs: RefObject<Record<string, HTMLButtonElement | null>>;
  onCategoryClick: (category: string) => void;
}

export default function CategoryNav({
  categories,
  activeCategory,
  categoryNavRef,
  categoryButtonRefs,
  onCategoryClick,
}: CategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <nav className="sticky top-16 z-20 bg-background border-b border-neutral-200 shadow-sm">
      <div ref={categoryNavRef} className="overflow-x-auto no-scrollbar px-4 py-2">
        <div className="flex w-max min-w-full flex-nowrap gap-1 md:justify-center">
          {categories.map((category) => (
            <button
              key={category}
              ref={(el) => { categoryButtonRefs.current[category] = el; }}
              onClick={() => onCategoryClick(category)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors shrink-0 ${
                activeCategory === category
                  ? 'bg-danger-dark text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {formatCategoryName(category)}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
