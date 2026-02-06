export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-pulse">
          <div className="text-5xl mb-4">🍔</div>
          <div className="text-2xl font-bold text-gray-800 mb-2">Loading Favorites</div>
          <p className="text-gray-600">Getting your delicious burgers ready...</p>
        </div>
      </div>
    </div>
  );
}