interface LocationMismatchBannerProps {
  currentLocation: { name: string } | null;
  mismatchedRestaurantIds: string[];
  mismatchedRestaurantItemCounts: Record<string, number>;
  getDisplayName: (restaurantId: string) => string;
  onReview: () => void;
}

export default function LocationMismatchBanner({
  currentLocation,
  mismatchedRestaurantIds,
  mismatchedRestaurantItemCounts,
  getDisplayName,
  onReview,
}: LocationMismatchBannerProps) {
  return (
    <div className="fixed left-1/2 top-24 z-40 w-full max-w-md -translate-x-1/2 px-4">
      <div className="alert alert-warning border border-warning-highlight bg-warning-bg px-4 py-3 text-warning-text-dark shadow-lg">
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-base font-bold leading-none">Location Mismatch Detected</p>
            <button
              className="btn btn-xs btn-outline border-warning-text text-warning-text-dark hover:bg-warning-bg-hover"
              onClick={onReview}
            >
              Review
            </button>
          </div>
          <div className="space-y-1">
            <p className="font-body text-sm">
              Selected location: <span className="font-semibold">{currentLocation?.name}</span>
            </p>
            <div className="space-y-0.5 font-body text-sm">
              {mismatchedRestaurantIds.map((restaurantId) => {
                const name = getDisplayName(restaurantId);
                const itemCount = mismatchedRestaurantItemCounts[restaurantId] || 0;
                return (
                  <p key={`banner-${restaurantId}`}>
                    {itemCount} item{itemCount === 1 ? '' : 's'} from {name}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
