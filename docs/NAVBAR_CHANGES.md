# NavBar Changes — What Changed and How It Works

## Overview

The NavBar was rebuilt using **daisyUI** — a component library that gives you pre-styled, ready-to-use UI pieces on top of Tailwind CSS. The goal was to modernize the look with icon-based navigation (cart and profile) instead of plain text links.

---

## What Changed at a Glance

| Feature | Before | After |
|---|---|---|
| Layout system | Custom flexbox with manual spacing | daisyUI `navbar` with built-in sections |
| Cart link | Plain text link ("cart") | Shopping cart icon with item count badge |
| Profile / account | Plain text links listed out | Profile icon that opens a dropdown menu |
| Sign up | Plain text link | Styled button (red/accent colored) |
| Login | Plain text link | Plain text link (unchanged style) |

---

## How the Layout Is Structured

daisyUI's navbar divides itself into three sections. Think of it like splitting a row into left, center, and right:

```
[ navbar-start ]   [ navbar-center ]   [ navbar-end ]
  Logo               Menu | Location    Cart  Profile
```

In code:

```tsx
<div className="navbar ...">
  <div className="navbar-start">  {/* Logo */}      </div>
  <div className="navbar-center"> {/* Nav links */}  </div>
  <div className="navbar-end">    {/* Cart + Auth */} </div>
</div>
```

This is much simpler than manually trying to position things with `justify-between` and `gap` everywhere.

---

## The Cart Icon and Badge

### What it does
The cart icon shows a small red number badge (like a notification bubble) whenever there are items in the cart. If the cart is empty, no badge appears.

### How it works

```tsx
const { getItemCount } = useCart();
const itemCount = getItemCount();
```

`useCart()` connects to the **CartContext** — a shared "storage box" that tracks everything in the cart. `getItemCount()` adds up the quantities of all items.

```tsx
<Link href="/cart" className="btn btn-ghost btn-circle relative">
  {/* Shopping cart SVG icon */}
  <svg>...</svg>

  {/* Only show the badge if there's at least 1 item */}
  {itemCount > 0 && (
    <span className="badge badge-sm absolute -top-1 -right-1 bg-accent text-white">
      {itemCount}
    </span>
  )}
</Link>
```

- `{itemCount > 0 && (...)}` — this is a conditional render. It means: "only show the badge **if** itemCount is greater than 0."
- `absolute -top-1 -right-1` — positions the badge in the top-right corner of the cart icon.

---

## The Profile Icon and Dropdown (Logged-In Users)

### What it does
When a user is logged in, a person/profile icon appears. Clicking it opens a dropdown menu with links to their account, order history, favorites, and a sign out button.

### How it works

```tsx
{user ? (
  // Show profile icon + dropdown
  <div className="dropdown dropdown-end">
    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
      {/* Person SVG icon */}
    </div>
    <ul tabIndex={0} className="menu menu-sm dropdown-content ...">
      <li><Link href="/account">account</Link></li>
      <li><Link href="/order-history">order history</Link></li>
      <li><Link href="/favorites">favorites</Link></li>
      <li><button onClick={handleSignOut}>sign out</button></li>
    </ul>
  </div>
) : (
  // Show login + sign up links instead
  <div>
    <Link href="/login">login</Link>
    <Link href="/sign-up">sign up</Link>
  </div>
)}
```

- `user ? (...) : (...)` — this is a **ternary operator**. It means: "if `user` exists (is truthy), show the first thing; otherwise show the second thing."
- `dropdown` and `dropdown-end` are daisyUI classes that handle all the open/close toggle behavior automatically — no JavaScript needed for that part.
- `dropdown-end` means the dropdown menu aligns to the right edge of the icon.

---

## How the App Knows If a User Is Logged In

The navbar checks Supabase (the authentication service) in two ways:

### 1. On first load
```tsx
useEffect(() => {
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user); // saves the user to state
  };
  checkUser();

  // Also listens for login/logout events in real time
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe(); // cleanup when component unmounts
}, []); // empty array = run once on mount
```

- `useEffect` with an empty `[]` runs **once** when the navbar first appears on screen.
- `onAuthStateChange` keeps listening — if the user logs in or out anywhere in the app, the navbar updates automatically.

### 2. On every page navigation
```tsx
useEffect(() => {
  const checkUserOnRouteChange = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };
  checkUserOnRouteChange();
}, [pathname]); // runs whenever the URL changes
```

- `pathname` is the current URL path (e.g. `/cart`, `/account`).
- `[pathname]` in the dependency array means: "re-run this effect whenever the pathname changes." This is a safety net to make sure the navbar stays in sync when navigating.

---

## Active Link Highlighting

A helper function makes the current page's link turn red:

```tsx
const navLinkClass = (path: string) =>
  `font-heading font-semibold text-lg capitalize hover:text-accent transition-all ${
    pathname === path ? "text-accent" : ""
  }`;
```

- It takes a path (like `"/"` or `"/select-location"`) and returns a CSS class string.
- If the current page matches that path, it adds `text-accent` (red). Otherwise it adds nothing.
- This replaces the repeated inline ternary that was in every link before.

---

## The Location Link

The "select location" link dynamically shows the name of the currently selected location once it has loaded:

```tsx
{isHydrated
  ? currentLocation
    ? currentLocation.name   // e.g. "Downtown"
    : "select location"      // no location picked yet
  : "select location"}       // still loading from storage
```

- `isHydrated` — a flag from `useLocation()` that becomes `true` once the location data has been read from localStorage. Before that, we show a default so the page doesn't flash.

---

## File Location

```
components/NavBar.tsx
```

This component is used in the root layout (`app/layout.tsx`) and appears at the top of every page.
