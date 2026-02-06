import Link from "next/link";

export default function EmptyFavorites() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="mb-8">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Favorites Yet</h2>
        <p className="text-gray-600 mb-8">
          You haven't added any items to your favorites. Start exploring our menu!
        </p>
      </div>
      
      <div className="space-y-4">
        <Link
          href="/"
          className="block w-full py-3 px-6 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition"
        >
          Browse Menu
        </Link>
        
        <Link
          href="/combos"
          className="block w-full py-3 px-6 border-2 border-orange-500 text-orange-500 font-semibold rounded-lg hover:bg-orange-50 transition"
        >
          Check Popular Combos
        </Link>
      </div>

      <div className="mt-12 pt-8 border-t">
        <p className="text-gray-500 text-sm">
          ❤️ <strong>How to add favorites:</strong><br />
          1. Browse the menu page<br />
          2. Click the heart icon on any item<br />
          3. Find all your favorites here!
        </p>
      </div>
    </div>
  );
}