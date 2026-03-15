# How It Works — Menu Navigation Features

This document explains the category navigation bar and scroll-to-top button in plain language.

---

## The Category Navigation Bar

### The big idea

When the menu page loads, it fetches all menu items from the database. Those items are grouped into categories (like "Beef Burgers", "Chicken Burgers", etc.). The nav bar displays one button per category, and clicking a button scrolls the page down to that category's section.

### Step-by-step

1. **The database gives us categories**
   Each menu item in the database has a `category` field (e.g. `beef_burgers`). When items are loaded, a helper function called `groupByCategory` organises them into groups by that field.

2. **We decide which categories to show**
   A predefined list called `categoryOrder` sets the display order (Beef Burgers first, then Chicken Burgers, etc.). Only categories that actually have items in them get shown — so if a location has no milkshakes, the Milkshakes button won't appear.

3. **The nav bar renders a button for each category**
   For each category in the list, a pill-shaped button is rendered. The label is a human-friendly name (e.g. `beef_burgers` becomes `"Beef Burgers"`) using the `formatCategoryName` helper.

4. **Clicking a button scrolls to the right section**
   Each category section on the page has a unique `id` attribute matching its category key (e.g. `id="beef_burgers"`). When a button is clicked, the `scrollToCategory` function finds that element by its `id` and calls `scrollIntoView({ behavior: "smooth" })`, which tells the browser to animate-scroll to it.

5. **The nav bar stays on screen while scrolling**
   The nav bar uses CSS `sticky top-0`, which means it locks to the top of the viewport as soon as the user scrolls past it. It always stays visible.

6. **The section heading doesn't hide behind the nav bar**
   Each section has a `scroll-mt-16` class. This adds a 64px gap above the section when it's scrolled to, so the sticky nav doesn't cover the heading.

---

## The Scroll-to-Top Button

### The big idea

A floating black circle button appears in the bottom-right corner of the screen after the user scrolls down. Clicking it smoothly returns the user to the top of the page.

### Step-by-step

1. **Tracking scroll position**
   A `useEffect` hook runs once when the page loads and attaches a listener to the browser's scroll event. Every time the user scrolls, it checks `window.scrollY` (how many pixels from the top the page is scrolled).

2. **Showing and hiding the button**
   If `scrollY` is greater than 300 pixels, a piece of state called `showScrollTop` is set to `true`. If the user scrolls back near the top, it's set back to `false`. The button is only rendered in the page when `showScrollTop` is `true`.

3. **Clicking the button**
   The `scrollToTop` function calls `window.scrollTo({ top: 0, behavior: "smooth" })`, which tells the browser to animate-scroll back to the very top of the page.

4. **Positioning**
   The button uses `fixed bottom-6 right-6`, which pins it to the bottom-right corner of the screen regardless of how far the user has scrolled. The `z-50` ensures it appears on top of all other content.

---

## Summary Diagram

```
User loads page
      │
      ▼
Database items → grouped by category → filtered to existing categories
      │
      ▼
Nav bar renders one button per category (sticky at top)
      │
      │   User clicks "Chicken Burgers"
      ▼
scrollToCategory("chicken_burgers")
      │
      ▼
Finds <section id="chicken_burgers"> → smooth scrolls to it
      │   (64px gap prevents nav bar overlap)
      │
      │   User scrolls > 300px down
      ▼
Scroll-to-top button appears (bottom-right)
      │
      │   User clicks ↑
      ▼
window.scrollTo(top: 0) → smooth scrolls back to the top
```
