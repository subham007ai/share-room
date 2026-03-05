# Responsive Design Skill — Production Grade

## When to Use
Trigger this skill for any request involving:
- "Make this mobile-friendly / responsive"
- Layouts that break on small screens
- Navigation menus, hamburger menus, mobile nav
- Typography that is too small or too large on certain screens
- Images that overflow, stretch, or look wrong on mobile
- Tables on mobile — the hardest responsive problem
- Flexbox or Grid layouts that need to adapt across screen sizes
- Touch targets, tap areas, mobile interaction
- Responsive in Tailwind CSS
- Responsive in plain HTML/CSS (Claude.ai artifacts)
- Responsive in React components
- Container queries — components responsive to their parent, not the viewport
- Fluid spacing, padding, margins across screen sizes
- SSR / Next.js viewport detection without layout shift
- "Why does my layout look broken on mobile?"

---

## The Responsive Mindset

Responsive design is not "make it work on phone too." It is designing for a **continuous spectrum of screens** from 320px to 3840px with different input methods (touch vs mouse), different distances (hand vs desk), and different contexts (glance vs focus).

**Three rules that govern everything:**

1. **Mobile-first is a content decision, not just a CSS order.** Start by deciding what content and interactions are essential. The mobile layout reveals priorities. Desktop is an enhancement.
2. **Breakpoints should come from the content, not from device names.** "Tablet breakpoint" is meaningless. "The point where this two-column layout stops fitting" is meaningful. Resize until something breaks — that is your breakpoint.
3. **Never fight the browser.** The browser already knows how to wrap text, shrink images, and reflow content. Most responsive problems are caused by setting explicit widths that prevent the browser from doing its job.

---

## Phase 1: Decide Before You Build

### Is This Thing Even Meant to Be Responsive?

Some interfaces should not be forced onto small screens.

```
Genuinely responsive (build fully):
  Marketing sites, landing pages, blogs, documentation
  E-commerce, checkout, settings, profile pages
  Forms, onboarding flows
  Navigation, headers, footers

Needs careful thought (responsive but constrained):
  Data tables with many columns  -> horizontal scroll, not reflow
  Complex dashboards             -> simplified mobile view, not squeezed desktop
  Rich text editors              -> strip features on mobile
  Map interfaces                 -> full-screen on mobile, different controls

Genuinely desktop-only (do not force mobile):
  Tools with 20+ column tables, code editors, video production software
  Show a "best experienced on desktop" message instead
```

### Mobile-First or Desktop-First?

```
Mobile-first (default for new projects):
  Write base styles for mobile
  Use min-width media queries to enhance for larger screens
  Best when mobile is the primary use case

Desktop-first (legacy or desktop-primary apps):
  Write base styles for desktop
  Use max-width media queries to adapt for smaller screens
  Best for retrofitting existing desktop apps

NEVER mix them in the same codebase. Pick one. Document it. Stick to it.
```

### Breakpoints

```
Resist named breakpoints as the primary mental model.
Real rule: add a breakpoint when the content breaks.

Reference points:
  320px  — smallest phone (iPhone SE)
  480px  — large phones, landscape phones
  768px  — tablets portrait
  1024px — tablets landscape, small laptops
  1280px — standard desktop
  1920px — wide desktop

Tailwind defaults:
  sm: 640px  md: 768px  lg: 1024px  xl: 1280px  2xl: 1536px

Reality check: most designs only need 2-3 real breakpoints.
6+ breakpoints means the design has a problem, not the CSS.
```

---

## Phase 2: The Responsive Toolkit — Right Tool for Each Job

```
Layout changes at viewport widths
  -> CSS Media Queries (min-width, mobile-first)

Component responds to its CONTAINER size (not viewport)
  -> Container Queries  <- the modern answer most tutorials skip

Typography scales smoothly between sizes
  -> clamp() — fluid type, no breakpoint jumps

Spacing or padding scales smoothly
  -> clamp() for spacing — same principle as type

Images load appropriate resolution for screen
  -> srcset + sizes, or picture for art direction

Multi-column layout that reflows naturally
  -> CSS Grid with auto-fill/auto-fit + minmax

One-direction flexible layout
  -> Flexbox with flex-wrap

Navigation that collapses on mobile
  -> CSS-only disclosure or JS hamburger — full patterns below

Table on mobile
  -> Horizontal scroll (dense data) or card reflow (sparse data)

Component needs viewport info in React or Next.js
  -> useMediaQuery hook (client) or CSS-only (SSR safe)
```

---

## Phase 3: CSS Foundations — What Every Responsive Layout Needs

Missing any one of these causes hard-to-debug responsive failures.

```css
/* 1. Box model — without this, padding breaks width calculations */
*, *::before, *::after { box-sizing: border-box; }

/* 2. Viewport meta tag — goes in HTML head, not CSS
   <meta name="viewport" content="width=device-width, initial-scale=1">
   Without this, mobile browsers zoom out to fit desktop width.
   This is the single most common reason mobile layouts look broken. */

/* 3. Images and media — prevent overflow, preserve ratio */
img, video, svg, canvas, iframe {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 4. Base font size */
:root { font-size: 16px; }

/* 5. Prevent horizontal scroll */
html, body { overflow-x: hidden; }

/* 6. Readable line length */
p, li, blockquote { max-width: 65ch; }
```

---

## Phase 4: Media Queries — The Right Way

### Mobile-First Pattern (default)

```css
/* Base = mobile. No media query needed. */
.card { display: flex; flex-direction: column; padding: 1rem; gap: 1rem; }

@media (min-width: 768px) {
  .card { flex-direction: row; padding: 1.5rem; }
}

@media (min-width: 1024px) {
  .card { padding: 2rem; gap: 2rem; }
}

/* Responsive grid — stack on mobile, expand upward */
.feature-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 640px)  { .feature-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .feature-grid { grid-template-columns: repeat(3, 1fr); } }

/* Other useful media features */
@media (prefers-color-scheme: dark)    { /* dark mode */ }
@media (prefers-reduced-motion: reduce){ /* disable animations */ }
@media (hover: none)                   { /* touch devices */ }
@media (orientation: landscape)        { /* landscape phones */ }
@media print                           { /* print styles */ }
```

### Tailwind Media Queries

```tsx
{/* Mobile-first. Prefix applies at that breakpoint and UP. */}

{/* Stack on mobile, row on md+ */}
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">

{/* Hide on mobile, show on desktop */}
<aside className="hidden lg:block">Sidebar</aside>

{/* Show on mobile, hide on desktop */}
<button className="lg:hidden">Menu</button>

{/* Responsive heading */}
<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">

{/* Responsive grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

{/* Responsive padding */}
<section className="px-4 py-8 md:px-8 md:py-16 lg:px-16 lg:py-24">
```

---

## Phase 5: Container Queries — The Modern Approach

Container queries let a component respond to its **parent container size**, not the viewport. This is what most tutorials skip, and what makes reusable components truly responsive.

**Why it matters:** A card at 300px wide in a sidebar needs different styling than the same card at 700px in main content — at the same viewport width. Media queries cannot solve this.

```css
/* Step 1: Declare the container on the parent */
.card-grid {
  container-type: inline-size;
  container-name: card-grid;
}

/* Step 2: Query from inside children */
.card { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; }

@container (min-width: 400px) { .card { flex-direction: row; gap: 1.5rem; } }
@container (min-width: 600px) { .card { gap: 2rem; padding: 2rem; } }

/* Named container — targets a specific ancestor */
@container card-grid (min-width: 800px) { .card-title { font-size: 1.5rem; } }
```

```tsx
{/* Tailwind container queries — requires @tailwindcss/container-queries plugin */}
<div className="@container">
  <div className="flex flex-col @md:flex-row @lg:gap-8">
    <img className="w-full @md:w-48" src={img} alt="" />
    <div className="@md:flex-1">
      <h3 className="text-base @lg:text-xl">{title}</h3>
    </div>
  </div>
</div>
```

### When to Use Each

```
Media queries: page-level layout, navigation threshold, body font sizes,
               show/hide entire sections

Container queries: reusable card components, design system components,
                   dashboard widgets, components in multiple layout contexts
```

---

## Phase 6: Fluid Typography and Spacing — clamp()

Typography that jumps between sizes at breakpoints feels jarring. clamp() creates smooth scaling between a minimum and maximum with no breakpoints.

```css
/* clamp(minimum, preferred, maximum)
   preferred: a viewport-relative value that scales with screen width */

:root {
  --text-sm:   clamp(0.75rem,  0.7rem + 0.25vw, 0.875rem);  /* 12px -> 14px */
  --text-base: clamp(0.9375rem, 0.875rem + 0.3vw, 1.125rem); /* 15px -> 18px */
  --text-lg:   clamp(1.125rem, 1rem + 0.5vw, 1.5rem);        /* 18px -> 24px */
  --text-xl:   clamp(1.5rem, 1.25rem + 1vw, 2.25rem);        /* 24px -> 36px */
  --text-2xl:  clamp(1.75rem, 1.25rem + 2vw, 3rem);          /* 28px -> 48px */
  --text-hero: clamp(2rem, 1rem + 5vw, 4.5rem);              /* 32px -> 72px */

  --space-sm:  clamp(0.5rem,  0.25rem + 1vw,  1rem);
  --space-md:  clamp(1rem,    0.5rem + 2vw,   2rem);
  --space-lg:  clamp(1.5rem,  0.75rem + 3vw,  3rem);
  --space-xl:  clamp(2rem,    1rem + 5vw,     5rem);
  --space-2xl: clamp(3rem,    1.5rem + 7vw,   8rem);
}

h1 { font-size: var(--text-hero); }
h2 { font-size: var(--text-2xl); }
p  { font-size: var(--text-base); }
.section { padding: var(--space-xl) var(--space-md); }

/*
  How to calculate clamp values:
  Y = (max_px - min_px) / (max_viewport - min_viewport) * 100
  X = min_px/16 - Y * min_viewport/100/16

  Example: 16px at 320px screen -> 24px at 1280px screen
    Y = (24-16)/(1280-320)*100 = 0.833
    Result: clamp(1rem, 0.833rem + 0.833vw, 1.5rem)

  Use https://clamp.font-size.app/ to generate without manual math.

  NEVER use raw vw for font-size without clamp().
  Raw vw becomes unreadably tiny on small screens and enormous on large ones.
*/
```

---

## Phase 7: Layout Patterns — Flexbox and Grid

### The Five Essential Flexbox Patterns

```css
/* 1. Stack on mobile, row on desktop */
.stack-to-row { display: flex; flex-direction: column; gap: 1rem; }
@media (min-width: 768px) { .stack-to-row { flex-direction: row; } }

/* 2. Auto-wrapping grid — no media queries needed */
.auto-wrap { display: flex; flex-wrap: wrap; gap: 1rem; }
.auto-wrap > * { flex: 1 1 280px; }
/* Automatically: 1 col narrow, 2 col ~600px, 3 col ~900px */

/* 3. Fixed sidebar + fluid main content */
.sidebar-layout { display: flex; flex-direction: column; }
@media (min-width: 1024px) {
  .sidebar-layout { flex-direction: row; }
  .sidebar        { width: 280px; flex-shrink: 0; }
  .main-content   { flex: 1; min-width: 0; } /* min-width:0 prevents overflow */
}

/* 4. Centered container with fluid side padding */
.container {
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
}

/* 5. Equal-height cards that push footers to bottom */
.card-row { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: stretch; }
.card-row > * { flex: 1 1 300px; display: flex; flex-direction: column; }
.card-body { flex: 1; }
```

### CSS Grid Responsive Patterns

```css
/* Pattern 1: Auto-fill — fills with as many columns as fit. No media queries. */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Pattern 2: Safe auto-fill — prevents overflow on very narrow screens */
.safe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
}

/* Pattern 3: Named template areas — complete layout reflow */
.page {
  display: grid;
  grid-template-areas: "header" "main" "sidebar" "footer";
}
@media (min-width: 768px) {
  .page {
    grid-template-areas: "header header" "sidebar main" "footer footer";
    grid-template-columns: 280px 1fr;
  }
}
.page-header  { grid-area: header; }
.page-main    { grid-area: main; }
.page-sidebar { grid-area: sidebar; }
.page-footer  { grid-area: footer; }

/* Pattern 4: Article + sidebar */
.article-layout { display: grid; grid-template-columns: 1fr; }
@media (min-width: 1024px) {
  .article-layout { grid-template-columns: 2fr 1fr; gap: 3rem; }
}

/* Pattern 5: Masonry-like with column-count */
.masonry { column-count: 1; column-gap: 1rem; }
.masonry > * { break-inside: avoid; margin-bottom: 1rem; }
@media (min-width: 640px)  { .masonry { column-count: 2; } }
@media (min-width: 1024px) { .masonry { column-count: 3; } }
```

---

## Phase 8: Responsive Navigation — Complete Patterns

### Pattern 1: CSS-Only Disclosure (No JavaScript)

```html
<nav class="nav">
  <input type="checkbox" id="nav-toggle" hidden>
  <div class="nav-bar">
    <a href="/" class="nav-logo">Brand</a>
    <label for="nav-toggle" class="nav-toggle-btn" aria-label="Toggle menu">
      <span class="hamburger"></span>
    </label>
    <ul class="nav-links" role="list">
      <li><a href="/about">About</a></li>
      <li><a href="/work">Work</a></li>
      <li><a href="/contact">Contact</a></li>
    </ul>
  </div>
</nav>
```

```css
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  max-width: 1280px;
  margin: auto;
}

/* Hamburger button — 44px minimum touch target */
.nav-toggle-btn {
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
}

.hamburger,
.hamburger::before,
.hamburger::after {
  display: block;
  width: 24px;
  height: 2px;
  background: currentColor;
  transition: transform 0.3s, opacity 0.3s;
}
.hamburger { position: relative; }
.hamburger::before, .hamburger::after { content: ''; position: absolute; }
.hamburger::before { top: -8px; }
.hamburger::after  { top:  8px; }

/* Animate to X when open */
#nav-toggle:checked ~ .nav-bar .hamburger     { background: transparent; }
#nav-toggle:checked ~ .nav-bar .hamburger::before { transform: rotate(45deg) translate(5px, 6px); }
#nav-toggle:checked ~ .nav-bar .hamburger::after  { transform: rotate(-45deg) translate(5px, -6px); }

/* Mobile: links hidden by default */
.nav-links { display: none; flex-direction: column; list-style: none; margin: 0; padding: 0 1.5rem 1rem; }
#nav-toggle:checked ~ .nav-bar .nav-links { display: flex; }

.nav-links a {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  text-decoration: none;
  color: inherit;
}

/* Desktop: show links, hide toggle */
@media (min-width: 768px) {
  .nav-toggle-btn { display: none; }
  .nav-links {
    display: flex !important;
    flex-direction: row;
    gap: 2rem;
    padding: 0;
    align-items: center;
  }
  .nav-links a { border-bottom: none; padding: 0; min-height: auto; }
}
```

### Pattern 2: JavaScript Hamburger (Accessible)

```tsx
import { useState, useRef, useEffect, useCallback } from 'react';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef   = useRef<HTMLUListElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape key — close and return focus to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Outside click — close menu
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (isOpen
        && !menuRef.current?.contains(e.target as Node)
        && !toggleRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);
  const links = [
    { href: '/about', label: 'About' },
    { href: '/work',  label: 'Work' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav>
      <div className="nav-bar">
        <a href="/">Brand</a>
        <button
          ref={toggleRef}
          onClick={() => setIsOpen(o => !o)}
          aria-expanded={isOpen}
          aria-controls="nav-menu"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="lg:hidden"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <span aria-hidden="true">{isOpen ? '✕' : '☰'}</span>
        </button>
        <ul id="nav-menu" ref={menuRef} role="list"
            className={`nav-links ${isOpen ? 'nav-links--open' : ''}`}>
          {links.map(({ href, label }) => (
            <li key={href}><a href={href} onClick={close}>{label}</a></li>
          ))}
        </ul>
      </div>
      {isOpen && (
        <div aria-hidden="true" onClick={close}
             style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: -1 }} />
      )}
    </nav>
  );
};
```

---

## Phase 9: Responsive Images — The Full Picture

Responsive images are a completely separate concern from responsive layout. Wrong decisions here cause blurry images on Retina screens or massive bandwidth waste on mobile.

### srcset and sizes — Resolution Switching

```html
<img
  src="photo-800.jpg"
  srcset="
    photo-400.jpg   400w,
    photo-800.jpg   800w,
    photo-1200.jpg 1200w,
    photo-1600.jpg 1600w
  "
  sizes="
    (max-width: 640px)  100vw,
    (max-width: 1024px) 80vw,
    1200px
  "
  alt="Descriptive alt text"
  width="1200"
  height="800"
  loading="lazy"
  decoding="async"
/>
<!--
  width + height: always include — prevents layout shift (CLS)
  loading="lazy":  below-fold images
  loading="eager": hero / above-fold images (or omit — eager is default)
-->
```

### picture — Art Direction

```html
<!-- Different crop per screen size -->
<picture>
  <source media="(max-width: 767px)"
          srcset="hero-portrait-400.jpg 400w, hero-portrait-800.jpg 800w"
          sizes="100vw" />
  <source media="(min-width: 768px)"
          srcset="hero-landscape-800.jpg 800w, hero-landscape-1600.jpg 1600w"
          sizes="100vw" />
  <img src="hero-landscape-800.jpg" alt="Team" width="1600" height="900" loading="eager" />
</picture>

<!-- WebP with JPEG fallback -->
<picture>
  <source type="image/webp" srcset="photo.webp 800w, photo@2x.webp 1600w" sizes="(max-width: 768px) 100vw, 50vw">
  <source type="image/jpeg" srcset="photo.jpg 800w, photo@2x.jpg 1600w"  sizes="(max-width: 768px) 100vw, 50vw">
  <img src="photo.jpg" alt="Description" width="800" height="600" loading="lazy">
</picture>
```

### Responsive Images in Next.js

```tsx
import Image from 'next/image';

{/* Standard */}
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />

{/* Fill container */}
<div style={{ position: 'relative', aspectRatio: '16/9' }}>
  <Image src="/photo.jpg" alt="Photo" fill
         sizes="(max-width: 768px) 100vw, 50vw"
         style={{ objectFit: 'cover' }} />
</div>

{/* Full width */}
<Image src="/banner.jpg" alt="Banner" width={1600} height={400}
       sizes="100vw" style={{ width: '100%', height: 'auto' }} />
```

---

## Phase 10: Responsive Tables — The Hardest Problem

Tables on mobile are the hardest responsive challenge. There is no single right answer — it depends on the data.

### Approach 1: Horizontal Scroll (dense data, many columns)

```css
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
table { width: 100%; min-width: 600px; border-collapse: collapse; }
th, td { padding: 0.75rem 1rem; text-align: left; white-space: nowrap; border-bottom: 1px solid #e5e7eb; }

/* Sticky first column — keeps label visible while scrolling */
th:first-child, td:first-child {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 1;
  box-shadow: 2px 0 4px rgba(0,0,0,0.05);
}
```

### Approach 2: Card Reflow (sparse data, few columns)

```html
<table class="responsive-table">
  <thead><tr><th>Customer</th><th>Order</th><th>Amount</th><th>Status</th></tr></thead>
  <tbody>
    <tr>
      <td data-label="Customer">Jane Smith</td>
      <td data-label="Order">#1042</td>
      <td data-label="Amount">$124.00</td>
      <td data-label="Status">Shipped</td>
    </tr>
  </tbody>
</table>
```

```css
@media (max-width: 640px) {
  .responsive-table thead { display: none; }
  .responsive-table tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
  }
  .responsive-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
    gap: 1rem;
  }
  .responsive-table td:last-child { border-bottom: none; }
  .responsive-table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #6b7280;
    font-size: 0.875rem;
  }
}
@media (min-width: 641px) {
  .responsive-table { width: 100%; border-collapse: collapse; }
  .responsive-table th, .responsive-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; }
}
```

### Approach 3: Priority Columns (hide less important on mobile)

```css
.col-secondary { display: none; }
.col-tertiary  { display: none; }
@media (min-width: 640px)  { .col-secondary { display: table-cell; } }
@media (min-width: 1024px) { .col-tertiary  { display: table-cell; } }
```

---

## Phase 11: Touch Targets and Mobile Interaction

```css
/* Minimum touch target sizes:
   Apple HIG: 44x44px
   Google Material: 48x48px
   WCAG 2.5.5 (AAA): 44x44px
   WCAG 2.5.8 (AA, WCAG 2.2): 24x24px */

button, a, input[type="checkbox"],
input[type="radio"], select, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Expand tap area on inline links without affecting layout */
a { position: relative; }
a::after { content: ''; position: absolute; inset: -8px; }

/* 8px minimum gap between adjacent targets */
.button-group { display: flex; gap: 0.5rem; }

/* Hover states only on devices that support hover */
@media (hover: hover) {
  .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  a:hover     { text-decoration: underline; }
}

/* Tap feedback */
button:active, a:active { opacity: 0.7; transform: scale(0.98); }

/* Remove iOS tap highlight */
button, a { -webkit-tap-highlight-color: transparent; }

/* Prevent scroll chaining */
.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }

/* CRITICAL: iOS auto-zoom prevention
   iOS zooms in when input font-size is below 16px.
   This is the most common mobile form complaint. */
input, select, textarea { font-size: 1rem; }
```

---

## Phase 12: Responsive in React — useMediaQuery Hook

Use for logic-driven responsive behavior only — different components, different behavior. Not for styling differences. Use CSS for that.

```tsx
import { useState, useEffect } from 'react';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false; // SSR safe
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

const bp = {
  sm:     '(min-width: 640px)',
  md:     '(min-width: 768px)',
  lg:     '(min-width: 1024px)',
  xl:     '(min-width: 1280px)',
  touch:  '(hover: none)',
  dark:   '(prefers-color-scheme: dark)',
  motion: '(prefers-reduced-motion: reduce)',
} as const;

export const useBreakpoint = (b: keyof typeof bp) => useMediaQuery(bp[b]);

// Usage
const Dashboard = () => {
  const isDesktop = useBreakpoint('lg');
  const isTouch   = useBreakpoint('touch');

  return (
    <div>
      {isDesktop ? <FullDataTable /> : <MobileCardList />}
      {isTouch   ? <SwipeableCarousel /> : <CarouselWithArrows />}
    </div>
  );
};
```

---

## Phase 13: SSR / Next.js — Viewport Without Layout Shift

The hardest responsive problem in server-rendered apps: viewport size is unknown on the server, but the right component must render without layout shift.

```tsx
// Strategy 1: CSS-only (ALWAYS prefer this)
// No JS, no layout shift, identical on server and client
const Nav = () => (
  <nav>
    <ul className="hidden lg:flex gap-8">   {/* CSS hides on mobile */}
      <li><a href="/about">About</a></li>
    </ul>
    <button className="lg:hidden">Menu</button>  {/* CSS hides on desktop */}
  </nav>
);

// Strategy 2: Render both, CSS shows the correct one
// Both in DOM — use only when both versions are simple
const DataView = () => (
  <>
    <div className="hidden md:block"><DataTable /></div>
    <div className="md:hidden"><DataCards /></div>
  </>
);

// Strategy 3: Client-only render
// Use when components are too different to render both
'use client';
const ComplexWidget = () => {
  const [mounted, setMounted] = useState(false);
  const isDesktop = useBreakpoint('lg');
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <WidgetSkeleton />;
  return isDesktop ? <DesktopWidget /> : <MobileWidget />;
};

// Next.js App Router: middleware UA hint
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? '';
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const res = NextResponse.next();
  res.headers.set('x-is-mobile', isMobile ? '1' : '0');
  return res;
}

// Server component reading the hint
import { headers } from 'next/headers';
const Page = () => {
  const isMobile = headers().get('x-is-mobile') === '1';
  return isMobile ? <MobilePage /> : <DesktopPage />;
};
```

---

## Phase 14: Component-Specific Patterns

### Hero Section

```css
.hero {
  min-height: 100svh; /* svh accounts for mobile browser chrome — use instead of 100vh */
  display: grid;
  place-items: center;
  padding: clamp(2rem, 8vw, 6rem) clamp(1rem, 4vw, 2rem);
  text-align: center;
}
@media (min-width: 768px) {
  .hero { text-align: left; grid-template-columns: 1fr 1fr; }
}
.hero-title    { font-size: clamp(2rem, 1rem + 5vw, 5rem); }
.hero-subtitle { font-size: clamp(1rem, 0.5rem + 2vw, 1.5rem); }
```

### Modal / Bottom Sheet

```css
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: grid; place-items: center;
  padding: 1rem;
}
.modal {
  background: #fff; border-radius: 12px;
  width: 100%; max-width: 480px;
  max-height: 90vh; overflow-y: auto;
  padding: clamp(1.25rem, 4vw, 2rem);
}
@media (max-width: 480px) {
  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal { border-radius: 16px 16px 0 0; max-height: 85vh; max-width: 100%; }
}
```

### Responsive Form

```css
.form-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
@media (min-width: 640px) {
  .form-grid { grid-template-columns: 1fr 1fr; }
  .form-field--full { grid-column: 1 / -1; }
}
input, select, textarea {
  width: 100%;
  min-height: 44px;
  font-size: 1rem; /* CRITICAL: prevents iOS auto-zoom on focus */
}
```

### Self-Adapting Card Grid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}
/* min(100%, 300px) prevents cards from overflowing on narrow screens */
```

---

## Phase 15: Testing Responsive Design

### Browser DevTools Protocol

```
Test at these widths every time:
  320px  — iPhone SE (smallest common phone)
  375px  — iPhone 14
  768px  — iPad portrait
  1024px — iPad landscape / small laptop
  1280px — standard desktop
  1920px — wide desktop

Also test:
  Portrait AND landscape orientation
  Zoom levels 100%, 125%, 150%
  Device emulation (touch events, device pixel ratio)
  Slow 3G (check image lazy loading)
  High DPI / Retina (check image sharpness)
```

### Automated Tests

```tsx
// Jest + Testing Library — mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches, media: query, onchange: null,
      addListener: jest.fn(), removeListener: jest.fn(),
      addEventListener: jest.fn(), removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
};

describe('Nav', () => {
  it('shows hamburger on mobile', () => {
    mockMatchMedia(false);
    render(<Nav />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
  it('shows inline links on desktop', () => {
    mockMatchMedia(true);
    render(<Nav />);
    expect(screen.getByRole('list')).toBeVisible();
  });
});

// Playwright — visual responsive testing
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone SE'] });
test('no horizontal scroll on mobile', async ({ page }) => {
  await page.goto('/');
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
test('hamburger opens menu', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Open menu').click();
  await expect(page.getByRole('navigation').getByRole('list')).toBeVisible();
});
```

---

## Anti-Patterns: The Responsive Hall of Shame

| Do Not | Do Instead |
|---|---|
| Missing viewport meta tag | Always include — without it, mobile zooms out to desktop width |
| `width: 100vw` on any element | `width: 100%` — `100vw` includes scrollbar width, causes overflow |
| Fixed `px` widths on containers | `max-width` + `width: 100%` |
| `px` for font sizes | `rem` base sizes, `clamp()` for fluid scaling |
| Raw `vw` for font-size without clamp | `clamp()` — raw `vw` becomes tiny on small and huge on large screens |
| Hover-only interactions | All interactions must work without hover |
| Touch targets under 44px | `min-height: 44px; min-width: 44px` on all interactive elements |
| Input `font-size` below 16px | iOS auto-zooms — always `font-size: 1rem` minimum |
| `overflow: hidden` on body to mask overflow | Fix the actual overflow source |
| Media queries for every reusable component | Container queries for components in multiple layout contexts |
| Stepped breakpoint font sizes | `clamp()` for smooth fluid scaling |
| `useMediaQuery` just to change a className | CSS / Tailwind for all styling differences |
| `window` or `localStorage` access in SSR path | Guard with `typeof window !== 'undefined'` |
| Squeezing desktop layout onto mobile | Rethink the layout, do not scale it down |
| Tables reflowing badly | Horizontal scroll (dense) or card reflow with data-label (sparse) |
| No `loading="lazy"` on below-fold images | Lazy load everything below the fold |
| Images without `width` and `height` | Always set both — prevents layout shift |
| Mixing mobile-first and desktop-first | Pick one approach and document it |
| 6+ breakpoints | Simplify the design — breakpoints follow content |

---

## Pre-Ship Checklist

### Foundations
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">` in HTML
- [ ] `box-sizing: border-box` on all elements
- [ ] `max-width: 100%; height: auto` on all images and media
- [ ] Approach chosen and consistent: mobile-first OR desktop-first

### Layout
- [ ] No horizontal overflow at 320px viewport
- [ ] Containers use `max-width` + `width: 100%`
- [ ] Fluid spacing with `clamp()` or responsive utility classes
- [ ] Grid/Flex layouts use auto-fill/wrap where columns should adapt

### Typography
- [ ] All headings use `clamp()` — smooth scaling, no breakpoint jumps
- [ ] Body text minimum 16px on mobile
- [ ] Input `font-size` at least 1rem (prevents iOS zoom)
- [ ] Line length capped at ~65ch for paragraphs

### Navigation
- [ ] Hamburger threshold correct for content
- [ ] Accessible: Escape key, outside click, focus returns to toggle
- [ ] All nav links meet 44px touch target height

### Images
- [ ] `srcset` + `sizes` on all variable-width images
- [ ] `<picture>` for art-directed crops
- [ ] `width` and `height` on every image element (prevents CLS)
- [ ] `loading="lazy"` on below-fold, `loading="eager"` on hero

### Touch
- [ ] All interactive elements at least 44x44px
- [ ] 8px+ gap between adjacent tap targets
- [ ] No interactions that only work with hover

### Tables
- [ ] Dense tables: horizontal scroll + sticky first column
- [ ] Sparse tables: card reflow with `data-label`

### SSR / Next.js
- [ ] No `window` / `localStorage` access without `typeof window` guard
- [ ] Viewport-dependent components use CSS-first
- [ ] Client-only components have skeleton fallback (no blank flash)

### Testing
- [ ] Tested at 320px, 375px, 768px, 1024px, 1280px, 1920px
- [ ] Tested portrait and landscape
- [ ] No horizontal scroll at any viewport
- [ ] Images sharp on high-DPI / Retina displays

---

## Quick Reference: Decision Tree

```
What responsive problem am I solving?

Layout changes at different viewport widths?
  Page-level layout          -> CSS media queries (min-width)
  Component-level layout     -> Container queries (@container)

Typography or spacing that scales smoothly?
  -> clamp(min, preferred-vw, max) — no breakpoints needed

Images that load at appropriate resolution?
  Same content, different sizes     -> srcset + sizes
  Different crop or composition     -> picture element

Navigation that collapses on mobile?
  No JavaScript needed              -> CSS checkbox disclosure
  Full accessibility required       -> JS with aria-expanded + focus trap

Table on mobile?
  Many columns, dense data          -> horizontal scroll + sticky column
  Few columns, sparse data          -> card reflow with data-label

React: different components by viewport?
  Only styling differences          -> CSS / Tailwind (never useMediaQuery)
  Genuinely different component trees -> useMediaQuery hook (client only)

Next.js / SSR viewport detection?
  Styling only                      -> CSS-only (preferred, zero layout shift)
  Two versions needed               -> render both, CSS shows correct one
  Fundamentally different           -> mounted state + client-only render

Images loading too slow?
  Below-fold                        -> loading="lazy"
  High-DPI screens                  -> srcset with 2x sources
  Different sizes needed            -> sizes attribute
```

---

> **Responsive design is not a feature you add at the end. It is the medium. Every layout decision, every spacing choice, every component you build exists across an infinite spectrum of screen sizes. Design for the content. Let the browser do its job. Add constraints only where the content demands them.**
