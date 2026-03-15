"use client";

import { useFavorites } from "@/context/favoritesContext";
import { useCart } from "@/context/cartContext";
import Link from "next/link";

export default function FavoritesPage() {
  const { favoriteItems, toggleFavorite, loading } = useFavorites();
  const { addItem } = useCart();

  const formatName = (name: string): string => {
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleOrderAllFavorites = () => {
    favoriteItems.forEach((item) => addItem(item, 1));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-300 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-slate-900">
            Your Favorites ❤️
          </h1>
          <p className="text-slate-500 mt-2">All your loved Gladiator burgers in one place.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border-2 border-accent/70 bg-white shadow-md p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900">{favoriteItems.length} Favorite Items</h2>
            <p className="text-slate-500">Saved just for you</p>
          </div>

          {favoriteItems.length > 0 && (
            <button
              onClick={handleOrderAllFavorites}
              className="btn bg-accent hover:bg-secondary border-0 text-white font-heading"
            >
              Order All Favorites
            </button>
          )}
        </div>

        <h3 className="text-3xl font-heading font-bold text-slate-900 mb-5">Your Favorite Burgers</h3>

        {favoriteItems.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
            <p className="text-slate-500 mb-4">You haven&apos;t added any favorites yet.</p>
            <Link href="/" className="btn bg-accent hover:bg-secondary border-0 text-white font-heading">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favoriteItems.map((item) => (
              <article
                key={item.item_id}
                className="bg-white border border-stone-300 rounded-xl shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-stone-200" />
                  )}

                  <button
                    onClick={() => toggleFavorite(item)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center"
                    aria-label="Remove from favorites"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-pink-500">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  </button>
                </div>

                <div className="p-4 flex flex-col grow">
                  <Link href={`/${item.item_id}`} className="hover:underline">
                    <h4 className="font-heading text-2xl font-semibold text-slate-900 wrap-break-word">
                      {formatName(item.name)}
                    </h4>
                  </Link>
                  <p className="text-slate-500 mt-1 mb-3 text-sm">${item.price.toFixed(2)}</p>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 grow">{item.description}</p>

                  <button
                    onClick={() => addItem(item, 1)}
                    className="btn btn-sm bg-accent hover:bg-secondary border-0 text-white font-heading self-end"
                  >
                    Add to Cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
