'use client';

import { useMenuPage } from '@/hooks/useMenuPage';
import CategoryNav from '@/components/menu/CategoryNav';
import CategorySection from '@/components/menu/CategorySection';
import LocationSelector from '@/components/menu/LocationSelector';
import ScrollToTopButton from '@/components/menu/ScrollToTopButton';

export default function MenuPage() {
  const {
    loading,
    isRefreshingMenu,
    showScrollTop,
    activeCategory,
    groupedItems,
    categories,
    currentLocation,
    locations,
    locationLoading,
    categoryNavRef,
    categoryButtonRefs,
    scrollToCategory,
    handleLocationChange,
  } = useMenuPage();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="font-body text-neutral-600">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        categoryNavRef={categoryNavRef}
        categoryButtonRefs={categoryButtonRefs}
        onCategoryClick={scrollToCategory}
      />

      <div className={`container mx-auto px-4 py-8 transition-opacity duration-300 ${isRefreshingMenu ? 'opacity-45' : 'opacity-100'}`}>
        <LocationSelector
          value={currentLocation?.id || ''}
          locations={locations}
          onChange={handleLocationChange}
          disabled={locationLoading}
          className="mb-6 w-56"
        />

        {categories.length === 0 ? (
          <p className="font-body text-neutral-500">No items found.</p>
        ) : (
          categories.map((category) => (
            <CategorySection key={category} category={category} items={groupedItems[category]} />
          ))
        )}
      </div>

      {isRefreshingMenu && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-20 flex justify-center">
          <div className="rounded-full border border-neutral-200 bg-background/95 px-4 py-1.5 shadow-sm">
            <p className="font-body text-sm text-neutral-600">Updating menu...</p>
          </div>
        </div>
      )}

      {showScrollTop && <ScrollToTopButton />}
    </div>
  );
}
