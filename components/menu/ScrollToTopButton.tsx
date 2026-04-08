export default function ScrollToTopButton() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 bg-black text-white p-3 rounded-full shadow-lg hover:bg-neutral-800 transition-colors"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}
