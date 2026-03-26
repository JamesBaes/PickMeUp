# globals.css — Color System Deep Dive

**File:** `app/globals.css`

---

## Table of Contents

1. [How the Color System Works](#1-how-the-color-system-works)
2. [Brand Color — Accent Red](#2-brand-color--accent-red)
3. [Neutral Scale](#3-neutral-scale)
4. [Semantic Color Groups](#4-semantic-color-groups)
5. [Miscellaneous Colors](#5-miscellaneous-colors)
6. [Dark Mode](#6-dark-mode)
7. [Why This Approach](#7-why-this-approach)

---

## 1. How the Color System Works

Colors are defined in two layers:

**Layer 1 — CSS custom properties (`:root`)**

Raw values are declared as CSS variables:
```css
:root {
  --accent: #B6244F;
  --neutral-900: #111827;
}
```

**Layer 2 — Tailwind theme bridge (`@theme inline`)**

Each CSS variable is mapped to a Tailwind color token:
```css
@theme inline {
  --color-accent: var(--accent);
  --color-neutral-900: var(--neutral-900);
}
```

This means Tailwind classes like `bg-accent`, `text-neutral-900`, and `border-danger` all resolve to the CSS variables defined in `:root`. Changing a value in `:root` automatically updates every Tailwind class that references it — there is only one place to change a color.

---

## 2. Brand Color — Accent Red

```css
--accent: #B6244F;
--accent-hover: #9A1E42;
--secondary: #9A1E42;
--active: #7D1534;
```

`#B6244F` is the primary brand color — a deep crimson red. It appears on every primary button, link highlight, and interactive element across the app.

**Why this color:**
- It reads as bold and appetizing — a deliberate choice for a food ordering app. Reds are widely used in the food industry (McDonald's, KFC, Pizza Hut) because they are associated with appetite stimulation and urgency.
- It is dark enough to pass WCAG AA contrast on white backgrounds while still being visually warm rather than harsh.

**The hover/active scale:**
Each step darkens the hue by roughly 15% lightness, following standard interactive state conventions:

| Token | Hex | Use |
|-------|-----|-----|
| `--accent` | `#B6244F` | Default state (buttons, links, icons) |
| `--accent-hover` / `--secondary` | `#9A1E42` | Hover state |
| `--active` | `#7D1534` | Active/pressed state |

The same hex (`#9A1E42`) is used for both `--accent-hover` and `--secondary` — they are the same shade used in slightly different semantic contexts.

---

## 3. Neutral Scale

```css
--neutral-50:  #F9FAFB;
--neutral-100: #F3F4F6;
--neutral-200: #E5E7EB;
--neutral-300: #D1D5DB;
--neutral-400: #9CA3AF;
--neutral-500: #6B7280;
--neutral-600: #4B5563;
--neutral-700: #374151;
--neutral-800: #1F2937;
--neutral-900: #111827;
```

This is the standard Tailwind Gray scale (taken directly from Tailwind's default palette). It provides 10 steps from near-white to near-black.

**How it is used across the app:**

| Range | Use |
|-------|-----|
| `50–100` | Page backgrounds, card backgrounds |
| `200–300` | Borders, dividers, input outlines |
| `400–500` | Placeholder text, muted labels |
| `600–700` | Secondary body text |
| `800–900` | Primary headings and body text |

Using a consistent neutral scale means all grey tones are harmonious — there is no mixing of warm and cool greys from different sources.

---

## 4. Semantic Color Groups

Each semantic group represents a UI communication type. They are not random — each is derived from the brand red or from broadly recognized UI conventions.

---

### Danger / Error

```css
--danger:        #B6244F;   /* same as accent */
--danger-dark:   #9A1E42;
--danger-darker: #7D1534;
--danger-subtle: #F5D0DA;   /* light pink background */
--danger-border: #EAA1B5;   /* medium pink border */
--danger-text:   #7D1534;   /* darkest shade for text on light bg */
```

**Why danger = accent red?**
The brand color is already red. Rather than introducing a separate "error red" that would clash, the danger palette reuses the same hue family. This means errors look on-brand rather than jarring, while still conveying urgency.

`--danger-subtle` and `--danger-border` are the light background and border used for error banners/input states — they let the error be visible without overwhelming the screen with dark red.

---

### Info (Blue)

```css
--info-bg:     #EBF9FF;
--info-border: #C1EEFF;
--info-muted:  #70CFFF;
--info:        #3BBDF5;
--info-hover:  #1AAEE8;
--info-dark:   #0077AA;
--info-text:   #004E73;
```

Blue is the universal color for informational/neutral states. `#3BBDF5` is a bright sky blue — distinct enough from the red accent that info messages are immediately distinguishable from errors or brand actions.

The scale follows the same pattern as danger: light background (`--info-bg`) → border (`--info-border`) → muted mid-tone → full color → hover → dark text-safe version.

---

### Success (Green)

```css
--success-subtle:    #E2F8EA;
--success-border:    #A9E5BB;
--success-indicator: #A9E5BB;
--success:           #3DBD6E;
--success-hover:     #2EA05C;
--success-dark:      #1A8449;
--success-text:      #115C32;
```

Green is universally understood as "good" or "confirmed." Used in:
- The order progress bar (completed/active steps)
- Success toasts and confirmations
- Payment success states

`#3DBD6E` is a medium emerald green — vivid enough to be clearly "success" without being neon. `--success-indicator` uses the lighter `#A9E5BB` for subtle inline indicators that don't need to shout.

---

### Warning (Amber)

```css
--warning-bg:        #FFFBEB;
--warning-bg-hover:  #FEF3C7;
--warning-highlight: #FCD34D;
--warning-text:      #B45309;
--warning-text-dark: #92400E;
```

Amber/yellow is the standard warning color. Used for non-critical alerts that need attention but aren't errors. `#FCD34D` is a clean yellow that reads as caution.

Note there is no `--warning` full-intensity variable — the warning group is intentionally lighter (bg + text only), because the app rarely needs a solid warning button or badge. The palette is sized to actual usage.

---

## 5. Miscellaneous Colors

```css
--heart:  #EC4899;  /* pink */
--rating: #F59E0B;  /* amber/gold */
--black:  #B6244F;  /* ← intentionally the accent red */
```

**`--heart` (`#EC4899`):** Used for the favorites/heart icon. Pink is universally associated with liking/saving and is visually distinct from the red accent so hearts don't look like error states.

**`--rating` (`#F59E0B`):** Gold/amber for star ratings. Standard convention — users immediately recognize gold stars as a rating system.

**`--black` (`#B6244F`):** This is deliberately set to the brand red, not actual black. The name `--black` in this context means "the darkest/strongest emphasis color for this brand." It allows DaisyUI components that reference `--black` to render in the brand color rather than a generic black, keeping the visual identity consistent even in third-party component slots.

---

## 6. Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #FFFFFF;
    --foreground: #001219;
  }
}
```

Dark mode is currently a stub — `--background` stays white and `--foreground` shifts to a very dark navy (`#001219`) instead of a warm dark. The rest of the palette does not change.

This is intentional: the app was designed for a light theme and full dark mode support was out of scope. The stub is here to avoid the browser's default dark mode inversion from making the UI look broken — by explicitly locking `--background` to white even in dark mode preference, the app always renders on its designed white canvas.

---

## 7. Why This Approach

### Single source of truth

Every color in the entire app traces back to one line in `:root`. Rebranding the accent color means changing one hex value — every button, link, badge, and icon updates automatically.

### Semantic naming over raw values

Components use `bg-danger-subtle` or `text-success-text` rather than `bg-pink-100` or `text-green-900`. This means the code communicates intent, not appearance. If the success color changes from green to teal, the class name `text-success-text` still makes sense — `text-green-900` would be a lie.

### Scale consistency

Every semantic group (danger, info, success) follows the same 6-level pattern:
```
subtle bg → border → muted → full → hover → dark text
```
This predictability means building a new component type only requires deciding which level of emphasis is needed — the right token already exists.

### DaisyUI compatibility

Tailwind 4 + DaisyUI 5 are configured on top of this system. DaisyUI's component tokens reference the Tailwind color names, which in turn reference the CSS variables. The `--black: #B6244F` override is specifically for this integration — it routes DaisyUI's "black" semantic slot to the brand color.
