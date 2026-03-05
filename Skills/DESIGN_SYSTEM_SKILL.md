# Design System Skill — Production Grade (Complete)

## When to Use
Trigger this skill for any request involving:
- Building a component library or design system from scratch
- Design tokens: color, spacing, typography, shadows, motion
- Dark mode architecture and theming — including SSR flash prevention
- Consistent typography scale across a project
- Component variants, sizes, and states with CVA
- Radix UI primitives styled with design tokens
- Compound components with shared internal state (Tabs, Accordion, Select)
- Polymorphic / asChild components (Button that renders as a link)
- Button, Input, Card, Badge, Modal, Tabs, or any UI component
- Accessibility: focus trapping, keyboard navigation, ARIA patterns
- Storybook setup and component documentation
- Tailwind config extension with custom tokens
- File structure and exports for a component library
- Versioning and evolving a system without breaking consumers

---

## The Design System Mindset

A design system is not a component library. A component library is a collection of reusable UI pieces. A design system is the **language** those pieces are written in — the decisions, constraints, and contracts that make them coherent across products and teams.

Most design systems fail because they start with components. The right order is always: **tokens first, patterns second, components third.**

**Three rules that govern everything:**

1. **Tokens are decisions made once, applied everywhere.** Every hard-coded color, spacing value, or font size in a component is a future inconsistency. Every token is a promise: change it in one place, everything updates — including dark mode.
2. **Design systems are for humans, not just machines.** A component that cannot be used correctly by a new developer in under five minutes has failed. API design, naming, and documentation are as important as the implementation.
3. **Never build what Radix already solved.** Focus trapping, keyboard navigation, ARIA state management for dropdowns, modals, tooltips, and comboboxes are extraordinarily hard to get right. Radix UI has solved them. Use Radix primitives, apply your tokens, ship faster and more accessibly.

---

## Phase 1: Decide Before You Build

### Should You Even Build a Design System?

```
Build a full design system when:
  Multiple products share the same visual language
  3+ developers building UI simultaneously
  Project runs 2+ years with dedicated resources
  You are shipping a component library as an npm package

Build a simple token file + component folder when:
  Single product, single team
  Project under 1 year old
  You are still exploring the product direction

Do NOT build a design system when:
  The project is a prototype or MVP (under 3 months)
  You are solving design inconsistency — fix the design first
  You have no one to maintain it after it is built

The cost is real: initial build, maintenance, documentation,
versioning, and keeping it in sync with product needs.
The benefit only exceeds the cost at scale.
```

### The Modern Design System Stack

```
Tokens:      CSS custom properties (primitive + semantic layers)
Variants:    CVA (class-variance-authority) + cn() utility
Primitives:  Radix UI (accessibility, keyboard, ARIA — never hand-roll these)
Styling:     Tailwind CSS wired to your token system
Docs:        Storybook with autodocs, dark mode decorator, a11y addon
Testing:     Vitest + Testing Library + jest-axe + Playwright visual regression
Versioning:  Semantic versioning + deprecation period + codemods

What NOT to include:
  Redux or Zustand — design systems do not own app state
  React Query — design systems do not own data fetching
  Router — design systems do not own navigation
```

### Token Architecture — Three Levels, Never Skip One

```
Level 1: Primitive tokens (raw values — the palette)
  --primitive-blue-500: #3b82f6
  --primitive-space-4:  1rem
  These have no meaning, only values.
  RULE: Never reference primitives directly in components.

Level 2: Semantic tokens (meaning — the interface)
  --color-brand-default:    var(--primitive-blue-500)
  --color-bg-surface:       var(--primitive-neutral-0)
  --color-text-primary:     var(--primitive-neutral-900)
  These map meaning to primitives.
  Dark mode swaps these — not primitives.
  RULE: Components ONLY reference semantic tokens.

Level 3: Component tokens (optional — component-specific theming)
  --button-bg-primary:  var(--color-brand-default)
  --button-radius:      var(--radius-component-md)
  Use only when a component needs to be independently themeable.
  Most projects do not need level 3.

The payoff:
  Dark mode    = swap level 2 values. Zero component changes.
  Brand change = swap level 1 values. Zero component changes.
  White label  = new level 2 file per tenant. Zero component changes.
```

### Token Naming Convention — The Contract

Every token name must be readable as a sentence:
`--color-[category]-[prominence]`

```
Prominence scale (use consistently across ALL categories):
  subtle    — barely visible background tints, hover backgrounds
  muted     — secondary backgrounds, disabled surfaces
  default   — the standard value for this role
  emphasis  — stronger than default, used for hover on default
  strong    — strongest, used for active states or high-contrast text

Examples:
  --color-brand-subtle    border tint, selected background
  --color-brand-muted     chip background, tag fill
  --color-brand-default   primary button, links, active states
  --color-brand-emphasis  hover state on brand-default
  --color-brand-strong    active/pressed state, high contrast text

Same scale applies to: success, warning, error, info, neutral

For text:
  --color-text-primary    headings, body text
  --color-text-secondary  subtext, captions
  --color-text-tertiary   placeholders, disabled labels
  --color-text-disabled   explicitly disabled content
  --color-text-inverse    text on dark/brand backgrounds
  --color-text-on-brand   text on brand-default colored surfaces

For backgrounds:
  --color-bg-base         page background
  --color-bg-subtle       section backgrounds
  --color-bg-muted        input backgrounds, chips
  --color-bg-emphasis     hover state backgrounds

For surfaces (cards, modals, popovers — elevated from bg):
  --color-surface             card background
  --color-surface-raised      popover, tooltip background
  --color-surface-overlay     modal/dialog background

For borders:
  --color-border-subtle       dividers, very light separators
  --color-border-default      standard input borders, card borders
  --color-border-strong       focused input, hovered card
```

---

## Phase 2: File Structure

```
src/
  tokens/
    primitives.css         Raw palette — colors, spacing, radii, shadows, motion
    semantic.css           Semantic layer — light mode
    dark.css               Dark mode overrides (semantic values only)
    index.css              @import all token files

  lib/
    utils.ts               cn() utility (clsx + tailwind-merge)
    motion.ts              Motion constants as JS (for use in framer-motion etc)

  components/
    Button/
      Button.tsx           Component implementation
      Button.stories.tsx   Storybook stories
      Button.test.tsx      Unit + accessibility tests
      index.ts             export { Button } from "./Button"

    Input/
      Input.tsx
      Input.stories.tsx
      Input.test.tsx
      index.ts

    Card/
      Card.tsx             Card + CardHeader + CardContent + CardFooter
      Card.stories.tsx
      Card.test.tsx
      index.ts

    Tabs/
      Tabs.tsx             Compound component using Radix + context
      Tabs.stories.tsx
      Tabs.test.tsx
      index.ts

    Badge/
    Modal/
    Tooltip/
    Select/
    ...

  hooks/
    useMediaQuery.ts
    usePrefersReducedMotion.ts
    useTheme.ts

  index.ts                 Public API — re-exports all components and hooks

tailwind.config.ts         Tailwind wired to token system
.storybook/
  main.ts
  preview.ts               Global decorators, dark mode, a11y
```

### Public API — index.ts

```typescript
// src/index.ts — the only file consumers import from
// Never expose internals — only the public contract

// Components
export { Button, type ButtonProps }     from './components/Button';
export { Input, type InputProps }       from './components/Input';
export { Card, CardHeader, CardContent,
         CardFooter, CardTitle,
         CardDescription }             from './components/Card';
export { Tabs, TabsList, TabsTrigger,
         TabsContent }                 from './components/Tabs';
export { Badge, type BadgeProps }       from './components/Badge';
export { Modal, ModalContent,
         ModalHeader, ModalFooter }    from './components/Modal';

// Hooks
export { useTheme }                    from './hooks/useTheme';
export { useMediaQuery }               from './hooks/useMediaQuery';
export { usePrefersReducedMotion }     from './hooks/usePrefersReducedMotion';

// Utilities
export { cn }                          from './lib/utils';
export { motion }                      from './lib/motion';
```

---

## Phase 3: Primitive Tokens

```css
/* tokens/primitives.css */

:root {
  /* ─── Brand Palette ──────────────────────────── */
  --primitive-brand-50:  #eff6ff;
  --primitive-brand-100: #dbeafe;
  --primitive-brand-200: #bfdbfe;
  --primitive-brand-300: #93c5fd;
  --primitive-brand-400: #60a5fa;
  --primitive-brand-500: #3b82f6;
  --primitive-brand-600: #2563eb;
  --primitive-brand-700: #1d4ed8;
  --primitive-brand-800: #1e40af;
  --primitive-brand-900: #1e3a8a;
  --primitive-brand-950: #172554;

  /* ─── Neutral Palette ────────────────────────── */
  --primitive-neutral-0:   #ffffff;
  --primitive-neutral-50:  #f9fafb;
  --primitive-neutral-100: #f3f4f6;
  --primitive-neutral-200: #e5e7eb;
  --primitive-neutral-300: #d1d5db;
  --primitive-neutral-400: #9ca3af;
  --primitive-neutral-500: #6b7280;
  --primitive-neutral-600: #4b5563;
  --primitive-neutral-700: #374151;
  --primitive-neutral-800: #1f2937;
  --primitive-neutral-900: #111827;
  --primitive-neutral-950: #030712;

  /* ─── Feedback Palettes ──────────────────────── */
  --primitive-success-50:  #f0fdf4;
  --primitive-success-100: #dcfce7;
  --primitive-success-500: #22c55e;
  --primitive-success-600: #16a34a;
  --primitive-success-700: #15803d;
  --primitive-success-900: #14532d;

  --primitive-warning-50:  #fffbeb;
  --primitive-warning-100: #fef3c7;
  --primitive-warning-500: #f59e0b;
  --primitive-warning-600: #d97706;
  --primitive-warning-700: #b45309;
  --primitive-warning-900: #78350f;

  --primitive-error-50:  #fef2f2;
  --primitive-error-100: #fee2e2;
  --primitive-error-500: #ef4444;
  --primitive-error-600: #dc2626;
  --primitive-error-700: #b91c1c;
  --primitive-error-900: #7f1d1d;

  --primitive-info-50:  #eff6ff;
  --primitive-info-100: #dbeafe;
  --primitive-info-500: #3b82f6;
  --primitive-info-600: #2563eb;
  --primitive-info-700: #1d4ed8;
  --primitive-info-900: #1e3a8a;

  /* ─── Spacing (base 4px) ─────────────────────── */
  --primitive-space-0:   0;
  --primitive-space-px:  1px;
  --primitive-space-0-5: 0.125rem;
  --primitive-space-1:   0.25rem;
  --primitive-space-1-5: 0.375rem;
  --primitive-space-2:   0.5rem;
  --primitive-space-2-5: 0.625rem;
  --primitive-space-3:   0.75rem;
  --primitive-space-4:   1rem;
  --primitive-space-5:   1.25rem;
  --primitive-space-6:   1.5rem;
  --primitive-space-8:   2rem;
  --primitive-space-10:  2.5rem;
  --primitive-space-12:  3rem;
  --primitive-space-16:  4rem;
  --primitive-space-20:  5rem;
  --primitive-space-24:  6rem;
  --primitive-space-32:  8rem;

  /* ─── Border Radius ──────────────────────────── */
  --primitive-radius-none: 0;
  --primitive-radius-xs:   0.125rem;
  --primitive-radius-sm:   0.25rem;
  --primitive-radius-md:   0.375rem;
  --primitive-radius-lg:   0.5rem;
  --primitive-radius-xl:   0.75rem;
  --primitive-radius-2xl:  1rem;
  --primitive-radius-3xl:  1.5rem;
  --primitive-radius-full: 9999px;

  /* ─── Shadows ────────────────────────────────── */
  --primitive-shadow-xs:    0 1px 2px 0 rgb(0 0 0 / 0.05);
  --primitive-shadow-sm:    0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --primitive-shadow-md:    0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --primitive-shadow-lg:    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --primitive-shadow-xl:    0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --primitive-shadow-2xl:   0 25px 50px -12px rgb(0 0 0 / 0.25);
  --primitive-shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);

  /* ─── Z-Index Scale ──────────────────────────── */
  --primitive-z-behind:   -1;
  --primitive-z-base:      0;
  --primitive-z-raised:    10;
  --primitive-z-dropdown:  100;
  --primitive-z-sticky:    200;
  --primitive-z-overlay:   300;
  --primitive-z-modal:     400;
  --primitive-z-toast:     500;
  --primitive-z-tooltip:   600;

  /* ─── Motion ─────────────────────────────────── */
  --primitive-duration-instant:  0ms;
  --primitive-duration-fast:     100ms;
  --primitive-duration-normal:   200ms;
  --primitive-duration-slow:     300ms;
  --primitive-duration-slower:   500ms;

  --primitive-ease-linear:  linear;
  --primitive-ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --primitive-ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --primitive-ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
  --primitive-ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── Typography ─────────────────────────────── */
  --primitive-font-sans:  ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --primitive-font-mono:  ui-monospace, "Cascadia Code", "Fira Code", monospace;

  --primitive-text-xs:   0.75rem;
  --primitive-text-sm:   0.875rem;
  --primitive-text-base: 1rem;
  --primitive-text-lg:   1.125rem;
  --primitive-text-xl:   1.25rem;
  --primitive-text-2xl:  1.5rem;
  --primitive-text-3xl:  1.875rem;
  --primitive-text-4xl:  2.25rem;
  --primitive-text-5xl:  3rem;
  --primitive-text-6xl:  3.75rem;

  --primitive-leading-none:    1;
  --primitive-leading-tight:   1.25;
  --primitive-leading-snug:    1.375;
  --primitive-leading-normal:  1.5;
  --primitive-leading-relaxed: 1.625;

  --primitive-weight-regular:  400;
  --primitive-weight-medium:   500;
  --primitive-weight-semibold: 600;
  --primitive-weight-bold:     700;

  --primitive-tracking-tight:  -0.025em;
  --primitive-tracking-normal:  0em;
  --primitive-tracking-wide:    0.025em;
}
```

---

## Phase 4: Semantic Tokens and Dark Mode

```css
/* tokens/semantic.css — light mode (default) */

:root {
  /* Backgrounds */
  --color-bg-base:     var(--primitive-neutral-0);
  --color-bg-subtle:   var(--primitive-neutral-50);
  --color-bg-muted:    var(--primitive-neutral-100);
  --color-bg-emphasis: var(--primitive-neutral-200);

  /* Surfaces */
  --color-surface:         var(--primitive-neutral-0);
  --color-surface-raised:  var(--primitive-neutral-0);
  --color-surface-overlay: var(--primitive-neutral-0);

  /* Borders */
  --color-border-subtle:  var(--primitive-neutral-100);
  --color-border-default: var(--primitive-neutral-200);
  --color-border-strong:  var(--primitive-neutral-300);

  /* Text */
  --color-text-primary:   var(--primitive-neutral-900);
  --color-text-secondary: var(--primitive-neutral-600);
  --color-text-tertiary:  var(--primitive-neutral-400);
  --color-text-disabled:  var(--primitive-neutral-300);
  --color-text-inverse:   var(--primitive-neutral-0);
  --color-text-on-brand:  var(--primitive-neutral-0);

  /* Brand */
  --color-brand-subtle:   var(--primitive-brand-50);
  --color-brand-muted:    var(--primitive-brand-100);
  --color-brand-default:  var(--primitive-brand-500);
  --color-brand-emphasis: var(--primitive-brand-600);
  --color-brand-strong:   var(--primitive-brand-700);

  /* Success */
  --color-success-subtle:   var(--primitive-success-50);
  --color-success-muted:    var(--primitive-success-100);
  --color-success-default:  var(--primitive-success-500);
  --color-success-emphasis: var(--primitive-success-600);
  --color-success-strong:   var(--primitive-success-700);

  /* Warning */
  --color-warning-subtle:   var(--primitive-warning-50);
  --color-warning-muted:    var(--primitive-warning-100);
  --color-warning-default:  var(--primitive-warning-500);
  --color-warning-emphasis: var(--primitive-warning-600);
  --color-warning-strong:   var(--primitive-warning-700);

  /* Error */
  --color-error-subtle:   var(--primitive-error-50);
  --color-error-muted:    var(--primitive-error-100);
  --color-error-default:  var(--primitive-error-500);
  --color-error-emphasis: var(--primitive-error-600);
  --color-error-strong:   var(--primitive-error-700);

  /* Info */
  --color-info-subtle:   var(--primitive-info-50);
  --color-info-muted:    var(--primitive-info-100);
  --color-info-default:  var(--primitive-info-500);
  --color-info-emphasis: var(--primitive-info-600);
  --color-info-strong:   var(--primitive-info-700);

  /* Interactive */
  --color-focus-ring:        var(--primitive-brand-500);
  --color-focus-ring-offset: var(--primitive-neutral-0);

  /* Semantic spacing */
  --space-component-xs: var(--primitive-space-2);
  --space-component-sm: var(--primitive-space-3);
  --space-component-md: var(--primitive-space-4);
  --space-component-lg: var(--primitive-space-6);
  --space-component-xl: var(--primitive-space-8);
  --space-layout-sm:    var(--primitive-space-8);
  --space-layout-md:    var(--primitive-space-16);
  --space-layout-lg:    var(--primitive-space-24);

  /* Semantic radius */
  --radius-component-sm: var(--primitive-radius-sm);
  --radius-component-md: var(--primitive-radius-md);
  --radius-component-lg: var(--primitive-radius-lg);
  --radius-surface:      var(--primitive-radius-xl);
  --radius-full:         var(--primitive-radius-full);

  /* Semantic shadows */
  --shadow-sm:      var(--primitive-shadow-sm);
  --shadow-md:      var(--primitive-shadow-md);
  --shadow-lg:      var(--primitive-shadow-lg);
  --shadow-surface: var(--primitive-shadow-md);
  --shadow-overlay: var(--primitive-shadow-xl);

  /* Semantic motion */
  --duration-fast:   var(--primitive-duration-fast);
  --duration-normal: var(--primitive-duration-normal);
  --duration-slow:   var(--primitive-duration-slow);
  --ease-default:    var(--primitive-ease-in-out);
  --ease-enter:      var(--primitive-ease-out);
  --ease-exit:       var(--primitive-ease-in);
  --ease-spring:     var(--primitive-ease-spring);

  /* Semantic typography */
  --font-sans:    var(--primitive-font-sans);
  --font-mono:    var(--primitive-font-mono);
  --text-xs:      var(--primitive-text-xs);
  --text-sm:      var(--primitive-text-sm);
  --text-base:    var(--primitive-text-base);
  --text-lg:      var(--primitive-text-lg);
  --text-xl:      var(--primitive-text-xl);
  --text-2xl:     var(--primitive-text-2xl);
  --text-3xl:     var(--primitive-text-3xl);
  --text-4xl:     var(--primitive-text-4xl);

  /* Fluid display sizes — smooth scaling, no breakpoint jumps */
  --text-display-sm: clamp(1.5rem,  1.25rem + 1vw,   2rem);
  --text-display-md: clamp(2rem,    1.5rem + 2vw,    3rem);
  --text-display-lg: clamp(2.5rem,  1.75rem + 3.5vw, 4.5rem);
  --text-display-xl: clamp(3rem,    2rem + 5vw,      6rem);
}
```

```css
/* tokens/dark.css — only semantic tokens, never primitives */

[data-theme="dark"] {
  /* Backgrounds */
  --color-bg-base:     var(--primitive-neutral-950);
  --color-bg-subtle:   var(--primitive-neutral-900);
  --color-bg-muted:    var(--primitive-neutral-800);
  --color-bg-emphasis: var(--primitive-neutral-700);

  /* Surfaces */
  --color-surface:         var(--primitive-neutral-900);
  --color-surface-raised:  var(--primitive-neutral-800);
  --color-surface-overlay: var(--primitive-neutral-900);

  /* Borders */
  --color-border-subtle:  var(--primitive-neutral-800);
  --color-border-default: var(--primitive-neutral-700);
  --color-border-strong:  var(--primitive-neutral-600);

  /* Text */
  --color-text-primary:   var(--primitive-neutral-50);
  --color-text-secondary: var(--primitive-neutral-400);
  --color-text-tertiary:  var(--primitive-neutral-500);
  --color-text-disabled:  var(--primitive-neutral-600);
  --color-text-inverse:   var(--primitive-neutral-900);
  --color-text-on-brand:  var(--primitive-neutral-0);

  /* Brand — lighter shades readable on dark backgrounds */
  --color-brand-subtle:   var(--primitive-brand-950);
  --color-brand-muted:    var(--primitive-brand-900);
  --color-brand-default:  var(--primitive-brand-400);
  --color-brand-emphasis: var(--primitive-brand-300);
  --color-brand-strong:   var(--primitive-brand-200);

  /* Success */
  --color-success-subtle:   var(--primitive-success-900);
  --color-success-muted:    #052e16;
  --color-success-default:  var(--primitive-success-500);
  --color-success-emphasis: #4ade80;
  --color-success-strong:   #86efac;

  /* Warning */
  --color-warning-subtle:   var(--primitive-warning-900);
  --color-warning-muted:    #451a03;
  --color-warning-default:  var(--primitive-warning-500);
  --color-warning-emphasis: #fbbf24;
  --color-warning-strong:   #fcd34d;

  /* Error */
  --color-error-subtle:   var(--primitive-error-900);
  --color-error-muted:    #450a0a;
  --color-error-default:  var(--primitive-error-500);
  --color-error-emphasis: #f87171;
  --color-error-strong:   #fca5a5;

  /* Focus */
  --color-focus-ring:        var(--primitive-brand-400);
  --color-focus-ring-offset: var(--primitive-neutral-950);

  /* Shadows — more opacity needed on dark backgrounds */
  --shadow-sm:      0 1px 2px 0 rgb(0 0 0 / 0.4);
  --shadow-md:      0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5);
  --shadow-lg:      0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.6);
  --shadow-surface: var(--shadow-md);
  --shadow-overlay: var(--shadow-lg);
}

/* System dark mode — respects OS setting when no data-theme is set */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    /* Repeat all dark values here, or @import dark.css conditionally */
    --color-bg-base:     var(--primitive-neutral-950);
    --color-bg-subtle:   var(--primitive-neutral-900);
    /* ... same as [data-theme="dark"] above ... */
  }
}

/* Reduced motion — override motion tokens globally */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast:   0ms;
    --duration-normal: 0ms;
    --duration-slow:   0ms;
  }
}
```

---

## Phase 5: SSR Theme — Preventing Flash of Wrong Theme

This is the problem the previous version did not solve. Without this, every Next.js project gets a flash of the wrong theme on page load.

```typescript
// lib/theme-script.ts
// This script runs BEFORE React hydration — synchronously sets theme
// so there is zero flash between server HTML and client render

export const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = stored === 'dark' || stored === 'light' ? stored : system;
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;
```

```tsx
// app/layout.tsx — Next.js App Router
import { themeScript } from '@/lib/theme-script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* dangerouslySetInnerHTML + suppressHydrationWarning prevents
            React from complaining about the server/client mismatch
            caused by the theme script running before hydration */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// hooks/useTheme.ts — full theme hook with SSR safety

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme:         Theme;
  resolvedTheme: "light" | "dark";
  setTheme:      (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted]  = useState(false);

  // Sync from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") setThemeState(stored);
    else setThemeState("system");
    setMounted(true);
  }, []);

  // Resolved theme — what is actually showing
  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (!mounted) return "light"; // safe SSR default
    if (theme !== "system") return theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }, [theme, mounted]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    const resolved = t === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : t;
    document.documentElement.setAttribute("data-theme", resolved);
    if (t === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", t);
  }, []);

  // Keep DOM in sync when theme state changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme, mounted]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
};
```

---

## Phase 6: The cn() Utility

This must be defined before any component. Every component uses it.

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names correctly for Tailwind.
 * clsx handles conditionals and arrays.
 * twMerge resolves Tailwind conflicts (e.g. "p-2 p-4" → "p-4").
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", className)
 * cn(["flex", "items-center"], { "opacity-50": disabled })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

```bash
# Install required packages
npm install clsx tailwind-merge class-variance-authority
npm install @radix-ui/react-dialog @radix-ui/react-tabs
npm install @radix-ui/react-tooltip @radix-ui/react-select
npm install @radix-ui/react-dropdown-menu @radix-ui/react-popover
npm install @radix-ui/react-slot  # for asChild / polymorphic
```

---

## Phase 7: Component Architecture

### The asChild Pattern — Polymorphic Components

This is how you build a Button that can render as an `<a>`, `<Link>`, or any other element — without `as` prop hacks or losing TypeScript types.

```tsx
// The Slot pattern from Radix — merges props and renders as child element
import { Slot } from "@radix-ui/react-slot";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?:     boolean;  // when true, renders as whatever child element is passed
    isLoading?:   boolean;
    loadingText?: string;
    leftIcon?:    React.ReactNode;
    rightIcon?:   React.ReactNode;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, variant, size, isLoading, loadingText,
     leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    // Slot renders as child element; "button" renders as native button
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <><Spinner />{loadingText ?? children}</>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Usage — Button renders as Next.js Link, keeping all Button styles and behavior
import Link from "next/link";
<Button asChild variant="primary">
  <Link href="/dashboard">Go to dashboard</Link>
</Button>

// Button renders as anchor tag
<Button asChild variant="ghost">
  <a href="https://example.com" target="_blank" rel="noopener noreferrer">
    External link
  </a>
</Button>
```

### CVA — Complete Button Implementation

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { Slot }    from "@radix-ui/react-slot";
import { cn }      from "@/lib/utils";
import { forwardRef } from "react";

const buttonVariants = cva(
  // Base — applied to ALL variants
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium leading-none whitespace-nowrap",
    "border border-transparent",
    "transition-[background-color,color,border-color,box-shadow,opacity]",
    "duration-[--duration-fast]",
    "select-none cursor-pointer",
    // Focus ring — keyboard visible, mouse invisible
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-[--color-focus-ring]",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[--color-brand-default] text-[--color-text-on-brand]",
          "shadow-[--shadow-sm]",
          "hover:bg-[--color-brand-emphasis]",
          "active:bg-[--color-brand-strong] active:shadow-none",
        ],
        secondary: [
          "bg-[--color-surface] text-[--color-text-primary]",
          "border-[--color-border-default] shadow-[--shadow-sm]",
          "hover:bg-[--color-bg-subtle] hover:border-[--color-border-strong]",
          "active:bg-[--color-bg-muted]",
        ],
        ghost: [
          "bg-transparent text-[--color-text-primary]",
          "hover:bg-[--color-bg-muted]",
          "active:bg-[--color-bg-emphasis]",
        ],
        destructive: [
          "bg-[--color-error-default] text-white shadow-[--shadow-sm]",
          "hover:bg-[--color-error-emphasis]",
          "active:bg-[--color-error-strong] active:shadow-none",
        ],
        link: [
          "bg-transparent text-[--color-brand-default]",
          "underline underline-offset-2",
          "hover:text-[--color-brand-emphasis]",
          "h-auto p-0", // override size — link has no height/padding
        ],
      },
      size: {
        xs:   "h-7  px-2.5 text-xs   rounded-[--radius-component-sm]",
        sm:   "h-8  px-3   text-sm   rounded-[--radius-component-md]",
        md:   "h-9  px-4   text-sm   rounded-[--radius-component-md]",
        lg:   "h-10 px-5   text-base rounded-[--radius-component-lg]",
        xl:   "h-12 px-6   text-base rounded-[--radius-component-lg]",
        icon: "size-9 p-0           rounded-[--radius-component-md]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?:     boolean;
    isLoading?:   boolean;
    loadingText?: string;
    leftIcon?:    React.ReactNode;
    rightIcon?:   React.ReactNode;
  };

const Spinner = () => (
  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, variant, size, isLoading, loadingText,
     leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <><Spinner />{loadingText ?? children}</>
        ) : (
          <>
            {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
```

### Input — Complete with All States

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, useId } from "react";

const inputVariants = cva(
  [
    "w-full font-[--font-sans] text-[--color-text-primary]",
    "bg-[--color-bg-base] border border-[--color-border-default]",
    "placeholder:text-[--color-text-tertiary]",
    "transition-[border-color,box-shadow] duration-[--duration-fast]",
    "outline-none",
    "focus:border-[--color-brand-default] focus:ring-2",
    "focus:ring-[--color-brand-default]/20",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[--color-bg-muted]",
  ],
  {
    variants: {
      inputState: {
        default: "",
        error: [
          "border-[--color-error-default]",
          "focus:border-[--color-error-default]",
          "focus:ring-[--color-error-default]/20",
        ],
        success: [
          "border-[--color-success-default]",
          "focus:border-[--color-success-default]",
          "focus:ring-[--color-success-default]/20",
        ],
      },
      size: {
        sm: "h-8  px-3 text-sm  rounded-[--radius-component-md]",
        md: "h-9  px-3 text-sm  rounded-[--radius-component-md]",
        lg: "h-11 px-4 text-base rounded-[--radius-component-lg]",
      },
    },
    defaultVariants: { inputState: "default", size: "md" },
  }
);

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants> & {
    label?:        string;
    hint?:         string;
    errorMessage?: string;
    leftAddon?:    React.ReactNode;
    rightAddon?:   React.ReactNode;
  };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputState, size, label, hint, errorMessage,
     leftAddon, rightAddon, id, required, ...props }, ref) => {
    const autoId   = useId();
    const inputId  = id ?? autoId;
    const errorId  = `${inputId}-error`;
    const hintId   = `${inputId}-hint`;
    const hasError = !!errorMessage;
    const state    = hasError ? "error" : inputState;

    const describedBy = [
      hasError && errorId,
      hint && !hasError && hintId,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId}
                 className="text-sm font-medium text-[--color-text-primary]">
            {label}
            {required && (
              <span className="ml-1 text-[--color-error-default]" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <span className="absolute left-3 text-[--color-text-tertiary] pointer-events-none"
                  aria-hidden="true">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              inputVariants({ inputState: state, size }),
              leftAddon  && "pl-9",
              rightAddon && "pr-9",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            {...props}
          />
          {rightAddon && (
            <span className="absolute right-3 text-[--color-text-tertiary] pointer-events-none"
                  aria-hidden="true">
              {rightAddon}
            </span>
          )}
        </div>

        {hint && !hasError && (
          <p id={hintId} className="text-xs text-[--color-text-tertiary]">{hint}</p>
        )}
        {hasError && (
          <p id={errorId} className="text-xs text-[--color-error-default]" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
```

---

## Phase 8: Compound Components — Internal State with Context

Compound components share state internally. The consumer gets a clean API without managing state themselves.

```tsx
// components/Tabs/Tabs.tsx
// Built on Radix Tabs — keyboard navigation, ARIA, focus management all handled

import * as RadixTabs from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Tabs List (the tab bar) ─────────────────────
const tabsListVariants = cva(
  "inline-flex items-center",
  {
    variants: {
      variant: {
        underline: [
          "border-b border-[--color-border-default]",
          "gap-0 bg-transparent w-full",
        ],
        pills: [
          "gap-1 p-1",
          "bg-[--color-bg-muted] rounded-[--radius-component-lg]",
        ],
        buttons: [
          "gap-2 bg-transparent",
        ],
      },
    },
    defaultVariants: { variant: "underline" },
  }
);

// ─── Individual Tab Trigger ──────────────────────
const tabsTriggerVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "text-sm font-medium whitespace-nowrap",
    "transition-all duration-[--duration-fast]",
    "cursor-pointer select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    // Focus ring
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-[--color-focus-ring]",
  ],
  {
    variants: {
      variant: {
        underline: [
          "px-4 py-2.5 border-b-2 border-transparent -mb-px",
          "text-[--color-text-secondary]",
          "hover:text-[--color-text-primary] hover:border-[--color-border-strong]",
          "data-[state=active]:text-[--color-brand-default]",
          "data-[state=active]:border-[--color-brand-default]",
        ],
        pills: [
          "px-3 py-1.5 rounded-[--radius-component-md]",
          "text-[--color-text-secondary]",
          "hover:text-[--color-text-primary] hover:bg-[--color-bg-subtle]",
          "data-[state=active]:bg-[--color-surface]",
          "data-[state=active]:text-[--color-text-primary]",
          "data-[state=active]:shadow-[--shadow-sm]",
        ],
        buttons: [
          "px-4 py-2 rounded-[--radius-component-md]",
          "border border-[--color-border-default]",
          "text-[--color-text-secondary]",
          "hover:bg-[--color-bg-subtle]",
          "data-[state=active]:bg-[--color-brand-subtle]",
          "data-[state=active]:text-[--color-brand-default]",
          "data-[state=active]:border-[--color-brand-muted]",
        ],
      },
    },
    defaultVariants: { variant: "underline" },
  }
);

// ─── Context — shares variant between List and Trigger ─
type TabsVariant = "underline" | "pills" | "buttons";
const TabsVariantContext = createContext<TabsVariant>("underline");

// ─── Root ────────────────────────────────────────
type TabsProps = React.ComponentPropsWithoutRef<typeof RadixTabs.Root> & {
  variant?: TabsVariant;
};

export const Tabs = ({ variant = "underline", className, ...props }: TabsProps) => (
  <TabsVariantContext.Provider value={variant}>
    <RadixTabs.Root className={cn("w-full", className)} {...props} />
  </TabsVariantContext.Provider>
);

// ─── List ────────────────────────────────────────
export const TabsList = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.List>) => {
  const variant = useContext(TabsVariantContext);
  return (
    <RadixTabs.List
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
};

// ─── Trigger ─────────────────────────────────────
export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) => {
  const variant = useContext(TabsVariantContext);
  return (
    <RadixTabs.Trigger
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
};

// ─── Content ─────────────────────────────────────
export const TabsContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixTabs.Content>) => (
  <RadixTabs.Content
    className={cn(
      "pt-4",
      "focus-visible:outline-2 focus-visible:outline-offset-2",
      "focus-visible:outline-[--color-focus-ring]",
      className
    )}
    {...props}
  />
);

// ─── Usage ───────────────────────────────────────
// Radix handles: keyboard navigation (arrow keys), roving tabindex,
// aria-selected, aria-controls, aria-labelledby — automatically
//
// <Tabs defaultValue="overview" variant="pills">
//   <TabsList>
//     <TabsTrigger value="overview">Overview</TabsTrigger>
//     <TabsTrigger value="analytics">Analytics</TabsTrigger>
//     <TabsTrigger value="settings" disabled>Settings</TabsTrigger>
//   </TabsList>
//   <TabsContent value="overview">Overview content here</TabsContent>
//   <TabsContent value="analytics">Analytics content here</TabsContent>
// </Tabs>
```

### Modal — Radix Dialog with Focus Trapping

```tsx
// components/Modal/Modal.tsx
// Focus trap, focus restoration on close, Escape key — all from Radix

import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react"; // or any icon library

// ─── Root (re-export Radix root — no styling needed) ─
export const Modal        = RadixDialog.Root;
export const ModalTrigger = RadixDialog.Trigger;

// ─── Overlay (backdrop) ──────────────────────────
export const ModalOverlay = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>) => (
  <RadixDialog.Overlay
    className={cn(
      "fixed inset-0 z-[--primitive-z-overlay]",
      "bg-black/50 backdrop-blur-sm",
      // Animate in
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      // Animate out
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
);

// ─── Content (the dialog panel) ─────────────────
type ModalContentProps = React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
};

const modalSizes = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-2xl",
  full: "max-w-[calc(100vw-2rem)]",
};

export const ModalContent = ({
  className,
  children,
  showCloseButton = true,
  size = "md",
  ...props
}: ModalContentProps) => (
  <RadixDialog.Portal>
    <ModalOverlay />
    <RadixDialog.Content
      className={cn(
        "fixed left-1/2 top-1/2 z-[--primitive-z-modal]",
        "-translate-x-1/2 -translate-y-1/2",
        "w-[calc(100%-2rem)]", modalSizes[size],
        "bg-[--color-surface-overlay]",
        "rounded-[--radius-surface] shadow-[--shadow-overlay]",
        "border border-[--color-border-default]",
        "p-6 focus:outline-none",
        "max-h-[85vh] overflow-y-auto",
        // Animations
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        "data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2",
        className
      )}
      // Radix handles: focus trap, focus restoration, Escape to close,
      // aria-modal, aria-labelledby, aria-describedby
      {...props}
    >
      {children}
      {showCloseButton && (
        <RadixDialog.Close asChild>
          <button
            className={cn(
              "absolute right-4 top-4",
              "inline-flex items-center justify-center",
              "size-8 rounded-[--radius-component-md]",
              "text-[--color-text-tertiary]",
              "hover:bg-[--color-bg-muted] hover:text-[--color-text-primary]",
              "transition-colors duration-[--duration-fast]",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[--color-focus-ring]",
            )}
            aria-label="Close dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </RadixDialog.Close>
      )}
    </RadixDialog.Content>
  </RadixDialog.Portal>
);

// ─── Sub-components for layout ───────────────────
export const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 pr-8", className)} {...props} />
);

export const ModalTitle = (props: React.ComponentPropsWithoutRef<typeof RadixDialog.Title>) => (
  <RadixDialog.Title
    className="text-lg font-semibold text-[--color-text-primary] leading-tight"
    {...props}
  />
);

export const ModalDescription = (
  props: React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
) => (
  <RadixDialog.Description
    className="mt-1 text-sm text-[--color-text-secondary]"
    {...props}
  />
);

export const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-6 flex items-center justify-end gap-3",
      "pt-4 border-t border-[--color-border-subtle]",
      className
    )}
    {...props}
  />
);

// ─── Usage ───────────────────────────────────────
// <Modal>
//   <ModalTrigger asChild>
//     <Button>Open dialog</Button>
//   </ModalTrigger>
//   <ModalContent>
//     <ModalHeader>
//       <ModalTitle>Confirm deletion</ModalTitle>
//       <ModalDescription>This action cannot be undone.</ModalDescription>
//     </ModalHeader>
//     <ModalFooter>
//       <ModalClose asChild><Button variant="secondary">Cancel</Button></ModalClose>
//       <Button variant="destructive">Delete</Button>
//     </ModalFooter>
//   </ModalContent>
// </Modal>
```

---

## Phase 9: Radix UI Integration Map

```
Never hand-roll these — use Radix primitives and style with tokens:

Radix Package                    | Component to build on top of it
─────────────────────────────────┼────────────────────────────────────
@radix-ui/react-dialog           | Modal, Drawer, AlertDialog
@radix-ui/react-tabs             | Tabs
@radix-ui/react-select           | Select (dropdown with search)
@radix-ui/react-dropdown-menu    | DropdownMenu, ContextMenu
@radix-ui/react-tooltip          | Tooltip
@radix-ui/react-popover          | Popover, DatePicker wrapper
@radix-ui/react-checkbox         | Checkbox
@radix-ui/react-radio-group      | RadioGroup
@radix-ui/react-switch           | Toggle/Switch
@radix-ui/react-accordion        | Accordion
@radix-ui/react-alert-dialog     | ConfirmDialog (destructive actions)
@radix-ui/react-scroll-area      | Custom scrollbar, scrollable panels
@radix-ui/react-separator        | Divider/HR
@radix-ui/react-progress         | ProgressBar
@radix-ui/react-slider           | Slider / Range input
@radix-ui/react-avatar           | Avatar with fallback initials
@radix-ui/react-navigation-menu  | Multi-level navigation
@radix-ui/react-slot             | asChild / polymorphic pattern

What Radix handles automatically for each:
  Keyboard navigation (arrow keys, Tab, Escape, Enter, Space)
  Focus management (trap in modal, roving tabindex in tabs/menus)
  ARIA attributes (role, aria-expanded, aria-selected, aria-controls)
  Focus restoration (returns focus to trigger after dialog closes)
  Portal rendering (modals, tooltips render outside DOM hierarchy)
  Dismissal (Escape, outside click)

What YOU add on top of Radix:
  Visual styling using design tokens
  Variant system using CVA
  TypeScript prop types
  Documentation and stories
```

---

## Phase 10: Accessibility — The Complete Patterns

### Focus Management

```tsx
// ─── Focus trap — provided free by Radix Dialog ──
// For custom implementations without Radix:

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const container = containerRef.current;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    // Focus first element on open
    first.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        // Shift+Tab: if on first, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isActive]);

  return containerRef;
}

// ─── Focus restoration — return focus after dialog closes ─
export function useFocusRestoration() {
  const triggerRef = useRef<Element | null>(null);

  const save = () => { triggerRef.current = document.activeElement; };

  const restore = () => {
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  };

  return { save, restore };
}
```

### Roving Tabindex — For Toolbars and Tab Panels

```tsx
// Radix handles this for Tabs, MenuBar, RadioGroup automatically.
// For custom toolbars or grids — implement roving tabindex:

export function useRovingTabindex(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const newIndex = {
      ArrowRight: (index + 1) % count,
      ArrowLeft:  (index - 1 + count) % count,
      Home:       0,
      End:        count - 1,
    }[e.key];

    if (newIndex !== undefined) {
      e.preventDefault();
      setActiveIndex(newIndex);
    }
  };

  return {
    getTabIndex: (index: number) => index === activeIndex ? 0 : -1,
    handleKeyDown,
    activeIndex,
  };
}

// Usage in a toolbar
const Toolbar = ({ tools }) => {
  const { getTabIndex, handleKeyDown } = useRovingTabindex(tools.length);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <div role="toolbar" aria-label="Text formatting">
      {tools.map((tool, i) => (
        <button
          key={tool.id}
          ref={el => { refs.current[i] = el; }}
          tabIndex={getTabIndex(i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onClick={tool.action}
          aria-pressed={tool.active}
          aria-label={tool.label}
        >
          <tool.Icon aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};
```

### Live Regions — Announcing Dynamic Changes

```tsx
// For status messages that screen readers need to announce

// role="alert" — interrupts immediately (errors, urgent messages)
<div role="alert" aria-live="assertive" aria-atomic="true">
  {errorMessage && <p>{errorMessage}</p>}
</div>

// role="status" — polite announcement (success, progress updates)
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage && <p>{statusMessage}</p>}
</div>

// React hook for accessible toast/announcement
export function useAnnounce() {
  const [message, setMessage] = useState("");

  const announce = useCallback((msg: string, _type: "polite" | "assertive" = "polite") => {
    setMessage(""); // clear first — forces re-announcement of same message
    requestAnimationFrame(() => setMessage(msg));
  }, []);

  // Render this hidden element in your app root
  const Announcer = () => (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"  // visually hidden but accessible
    >
      {message}
    </div>
  );

  return { announce, Announcer };
}
```

### Global Focus and Accessibility Styles

```css
/* Globally consistent focus ring — visible for keyboard, hidden for mouse */
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-component-sm);
}
:focus:not(:focus-visible) { outline: none; }

/* Skip navigation link */
.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  z-index: var(--primitive-z-toast);
  padding: 0.5rem 1rem;
  background: var(--color-brand-default);
  color: white;
  font-weight: 600;
  border-radius: var(--radius-component-md);
  transition: top var(--duration-fast);
  text-decoration: none;
}
.skip-link:focus { top: 1rem; }

/* Visually hidden — accessible but not visible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Contrast Requirements

```
WCAG AA (minimum — required):
  Normal text (< 18px or < 14px bold): 4.5:1
  Large text (>= 18px or >= 14px bold): 3:1
  UI components and graphics: 3:1

Token system contrast (light mode):
  --color-text-primary on --color-bg-base:     neutral-900/white = 16.1:1 (AAA)
  --color-text-secondary on --color-bg-base:   neutral-600/white = 7.0:1  (AAA)
  white on --color-brand-default:              white/blue-500    = 3.1:1  (AA large only)
  white on --color-brand-emphasis:             white/blue-600    = 4.6:1  (AA all sizes)
  IMPORTANT: For body text on brand, use brand-emphasis or brand-strong, not brand-default

Tools:
  https://webaim.org/resources/contrastchecker/
  https://www.radix-ui.com/colors (entire palette passes WCAG AA)
```

---

## Phase 11: Tailwind Config Extension

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content:  ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", "[data-theme='dark']"],

  theme: {
    extend: {
      colors: {
        brand: {
          subtle:   "var(--color-brand-subtle)",
          muted:    "var(--color-brand-muted)",
          DEFAULT:  "var(--color-brand-default)",
          emphasis: "var(--color-brand-emphasis)",
          strong:   "var(--color-brand-strong)",
        },
        bg: {
          base:     "var(--color-bg-base)",
          subtle:   "var(--color-bg-subtle)",
          muted:    "var(--color-bg-muted)",
          emphasis: "var(--color-bg-emphasis)",
        },
        surface:  "var(--color-surface)",
        border: {
          subtle:  "var(--color-border-subtle)",
          DEFAULT: "var(--color-border-default)",
          strong:  "var(--color-border-strong)",
        },
        text: {
          primary:   "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary:  "var(--color-text-tertiary)",
          disabled:  "var(--color-text-disabled)",
          inverse:   "var(--color-text-inverse)",
          "on-brand":"var(--color-text-on-brand)",
        },
        success: {
          subtle:   "var(--color-success-subtle)",
          muted:    "var(--color-success-muted)",
          DEFAULT:  "var(--color-success-default)",
          emphasis: "var(--color-success-emphasis)",
          strong:   "var(--color-success-strong)",
        },
        warning: {
          subtle:   "var(--color-warning-subtle)",
          DEFAULT:  "var(--color-warning-default)",
          emphasis: "var(--color-warning-emphasis)",
        },
        error: {
          subtle:   "var(--color-error-subtle)",
          DEFAULT:  "var(--color-error-default)",
          emphasis: "var(--color-error-emphasis)",
          strong:   "var(--color-error-strong)",
        },
      },

      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },

      fontSize: {
        "display-sm": ["var(--text-display-sm)", { lineHeight: "1.2" }],
        "display-md": ["var(--text-display-md)", { lineHeight: "1.15" }],
        "display-lg": ["var(--text-display-lg)", { lineHeight: "1.1" }],
        "display-xl": ["var(--text-display-xl)", { lineHeight: "1.05" }],
      },

      spacing: {
        "component-xs": "var(--space-component-xs)",
        "component-sm": "var(--space-component-sm)",
        "component-md": "var(--space-component-md)",
        "component-lg": "var(--space-component-lg)",
        "layout-sm":    "var(--space-layout-sm)",
        "layout-md":    "var(--space-layout-md)",
        "layout-lg":    "var(--space-layout-lg)",
      },

      borderRadius: {
        "component-sm": "var(--radius-component-sm)",
        "component-md": "var(--radius-component-md)",
        "component-lg": "var(--radius-component-lg)",
        "surface":      "var(--radius-surface)",
      },

      boxShadow: {
        surface: "var(--shadow-surface)",
        overlay: "var(--shadow-overlay)",
      },

      transitionDuration: {
        fast:   "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow:   "var(--duration-slow)",
      },

      transitionTimingFunction: {
        default: "var(--ease-default)",
        enter:   "var(--ease-enter)",
        exit:    "var(--ease-exit)",
        spring:  "var(--ease-spring)",
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;
```

---

## Phase 12: Storybook Setup — Complete Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories:  ["../src/**/*.stories.{ts,tsx}"],
  addons: [
    "@storybook/addon-essentials",     // controls, actions, docs, viewport
    "@storybook/addon-a11y",           // accessibility audit panel
    "@storybook/addon-themes",         // theme switching toolbar button
    "@chromatic-com/storybook",        // visual regression
  ],
  framework: {
    name:    "@storybook/nextjs",
    options: {},
  },
};

export default config;
```

```typescript
// .storybook/preview.ts
import type { Preview } from "@storybook/react";
import { themes } from "@storybook/theming";
import "../src/tokens/index.css";   // import all design tokens
import "../src/styles/global.css";  // global base styles

const preview: Preview = {
  parameters: {
    // ─── Accessibility audit config ───────────────
    a11y: {
      config: {
        rules: [
          // Enforce contrast on all stories
          { id: "color-contrast", enabled: true },
        ],
      },
    },

    // ─── Viewport presets ─────────────────────────
    viewport: {
      viewports: {
        mobile:  { name: "Mobile",  styles: { width: "375px",  height: "812px" } },
        tablet:  { name: "Tablet",  styles: { width: "768px",  height: "1024px" } },
        desktop: { name: "Desktop", styles: { width: "1280px", height: "900px" } },
        wide:    { name: "Wide",    styles: { width: "1920px", height: "1080px" } },
      },
    },

    // ─── Backgrounds ──────────────────────────────
    backgrounds: { disable: true }, // we use data-theme instead

    // ─── Docs theme ───────────────────────────────
    docs: { theme: themes.light },
  },

  // ─── Global decorators ────────────────────────
  decorators: [
    // Theme decorator — wraps every story with data-theme attribute
    (Story, context) => {
      const theme = context.globals.theme ?? "light";

      useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
      }, [theme]);

      return (
        <div
          data-theme={theme}
          style={{
            minHeight:  "100vh",
            padding:    "2rem",
            background: "var(--color-bg-base)",
            color:      "var(--color-text-primary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <Story />
        </div>
      );
    },
  ],

  // ─── Global types (toolbar controls) ─────────
  globalTypes: {
    theme: {
      name:        "Theme",
      description: "Design system theme",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun",  title: "Light" },
          { value: "dark",  icon: "moon", title: "Dark" },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
```

### Story Pattern — Every Component

```tsx
// components/Button/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title:     "Components/Button",
  component: Button,
  tags:      ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: "Primary action element. Use for form submissions, navigation triggers, and any action the user can take.",
      },
    },
    design: {
      type: "figma",
      url:  "https://figma.com/file/YOUR_FILE_ID/component-name",
    },
  },
  argTypes: {
    variant:     { control: "select", options: ["primary","secondary","ghost","destructive","link"] },
    size:        { control: "select", options: ["xs","sm","md","lg","xl","icon"] },
    isLoading:   { control: "boolean" },
    disabled:    { control: "boolean" },
    loadingText: { control: "text", if: { arg: "isLoading" } },
    children:    { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary:     Story = { args: { variant: "primary",     children: "Save changes" } };
export const Secondary:   Story = { args: { variant: "secondary",   children: "Cancel" } };
export const Ghost:       Story = { args: { variant: "ghost",       children: "More options" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Delete account" } };

export const Loading: Story = {
  args: { variant: "primary", isLoading: true, loadingText: "Saving...", children: "Save" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true, children: "Save changes" },
};

// Visual: all variants side by side
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["primary","secondary","ghost","destructive","link"] as const).map(v => (
        <Button key={v} variant={v}>{v}</Button>
      ))}
    </div>
  ),
};

// Visual: all sizes side by side
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["xs","sm","md","lg","xl"] as const).map(s => (
        <Button key={s} size={s}>Button {s}</Button>
      ))}
    </div>
  ),
};

// Dark mode — the theme toolbar handles this via the global decorator
// Export a story that visually validates dark mode values look right
export const DarkMode: Story = {
  args:       { variant: "primary", children: "Dark mode button" },
  parameters: { backgrounds: { default: "dark" } },
};
```

---

## Phase 13: Testing — Complete Suite

### Unit and Accessibility Tests

```tsx
// components/Button/Button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "./Button";

expect.extend(toHaveNoViolations);

describe("Button", () => {
  // ─── Render ──────────────────────────────────
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("renders all variants without throwing", () => {
    const variants = ["primary","secondary","ghost","destructive","link"] as const;
    variants.forEach(variant => {
      const { unmount } = render(<Button variant={variant}>Button</Button>);
      unmount();
    });
  });

  // ─── Interaction ─────────────────────────────
  it("calls onClick when clicked", async () => {
    const user    = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("can be activated with Enter key", async () => {
    const user    = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("can be activated with Space key", async () => {
    const user    = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    screen.getByRole("button").focus();
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // ─── Disabled state ───────────────────────────
  it("is disabled when disabled prop set", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", async () => {
    const user    = userEvent.setup();
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ─── Loading state ────────────────────────────
  it("shows loading text and spinner when loading", () => {
    render(<Button isLoading loadingText="Saving...">Save</Button>);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("does not call onClick when loading", async () => {
    const user    = userEvent.setup();
    const onClick = jest.fn();
    render(<Button isLoading onClick={onClick}>Save</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ─── asChild / polymorphic ────────────────────
  it("renders as anchor when asChild with anchor child", () => {
    render(
      <Button asChild>
        <a href="/dashboard">Dashboard</a>
      </Button>
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────
  it("has no axe violations — default", async () => {
    const { container } = render(<Button>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations — icon-only with aria-label", async () => {
    const { container } = render(
      <Button size="icon" aria-label="Open settings">
        <svg aria-hidden="true" viewBox="0 0 24 24" />
      </Button>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations — loading state", async () => {
    const { container } = render(
      <Button isLoading loadingText="Saving...">Save</Button>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations — disabled state", async () => {
    const { container } = render(<Button disabled>Click me</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### Keyboard Navigation Tests — Tabs

```tsx
// components/Tabs/Tabs.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";

expect.extend(toHaveNoViolations);

const TestTabs = () => (
  <Tabs defaultValue="tab1">
    <TabsList>
      <TabsTrigger value="tab1">Tab One</TabsTrigger>
      <TabsTrigger value="tab2">Tab Two</TabsTrigger>
      <TabsTrigger value="tab3" disabled>Tab Three</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">Content One</TabsContent>
    <TabsContent value="tab2">Content Two</TabsContent>
    <TabsContent value="tab3">Content Three</TabsContent>
  </Tabs>
);

describe("Tabs keyboard navigation", () => {
  it("shows first tab content by default", () => {
    render(<TestTabs />);
    expect(screen.getByText("Content One")).toBeVisible();
  });

  it("navigates with arrow keys", async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    // Focus first tab
    screen.getByRole("tab", { name: "Tab One" }).focus();

    // ArrowRight moves to Tab Two
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveFocus();
    expect(screen.getByText("Content Two")).toBeVisible();
  });

  it("wraps from last to first with ArrowRight", async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    screen.getByRole("tab", { name: "Tab One" }).focus();
    await user.keyboard("{ArrowRight}"); // Tab Two
    await user.keyboard("{ArrowRight}"); // Skips disabled Tab Three, wraps to Tab One
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveFocus();
  });

  it("navigates with Home and End", async () => {
    const user = userEvent.setup();
    render(<TestTabs />);

    screen.getByRole("tab", { name: "Tab Two" }).click();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Tab One" })).toHaveFocus();

    await user.keyboard("{End}");
    // End skips disabled — goes to last enabled
    expect(screen.getByRole("tab", { name: "Tab Two" })).toHaveFocus();
  });

  it("disabled tab is not activatable", () => {
    render(<TestTabs />);
    const disabledTab = screen.getByRole("tab", { name: "Tab Three" });
    expect(disabledTab).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TestTabs />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### Modal Focus Tests

```tsx
// components/Modal/Modal.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Modal, ModalTrigger, ModalContent, ModalTitle } from "./Modal";

expect.extend(toHaveNoViolations);

const TestModal = () => (
  <Modal>
    <ModalTrigger asChild>
      <button>Open modal</button>
    </ModalTrigger>
    <ModalContent>
      <ModalTitle>Test Modal</ModalTitle>
      <p>Modal content here</p>
      <button>Action button</button>
    </ModalContent>
  </Modal>
);

describe("Modal accessibility", () => {
  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(<TestModal />);
    await user.click(screen.getByText("Open modal"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("moves focus into modal when opened", async () => {
    const user = userEvent.setup();
    render(<TestModal />);
    await user.click(screen.getByText("Open modal"));
    // Focus should be inside the dialog
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
    });
  });

  it("closes with Escape key", async () => {
    const user = userEvent.setup();
    render(<TestModal />);
    await user.click(screen.getByText("Open modal"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns focus to trigger after close", async () => {
    const user = userEvent.setup();
    render(<TestModal />);
    const trigger = screen.getByText("Open modal");
    await user.click(trigger);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TestModal />);
    await user.click(screen.getByText("Open modal"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

---

## Phase 14: Versioning and Breaking Changes

```
Semantic versioning — strict:

Major (1.0.0 -> 2.0.0): Breaking changes
  Removing a component or hook
  Removing or renaming a prop
  Changing a component default behavior
  Renaming a token
  Changing a component DOM structure

Minor (1.0.0 -> 1.1.0): Backward compatible additions
  New component
  New variant or size
  New prop with default value
  New token
  New hook

Patch (1.0.0 -> 1.0.1): Bug fixes only
  Visual fix
  Accessibility fix
  Documentation fix
  TypeScript type correction
```

```tsx
// Managing breaking changes — deprecate before removing

// Step 1: Deprecate with console warning (one major version before removal)
type ButtonProps = {
  /** @deprecated Use variant="primary". Removed in v3. */
  isPrimary?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = ({ isPrimary, variant, ...props }: ButtonProps) => {
  if (process.env.NODE_ENV === "development" && isPrimary !== undefined) {
    console.warn(
      `[Button] isPrimary is deprecated and will be removed in v3.
       Use variant="primary" instead.
       Migration guide: https://your-ds.com/migration/v3`
    );
  }
  const resolvedVariant = isPrimary ? "primary" : (variant ?? "secondary");
  // ...
};

// Step 2: Provide a codemod
// package.json scripts:
// "migrate:v3": "npx @your-ds/codemod v3 ./src"

// Step 3: Changelog entry with migration steps
```

```markdown
## Changelog

### [3.0.0] — 2026-06-01

#### Breaking Changes

**Button: `isPrimary` prop removed**
Deprecated since v2.0.0. Use `variant="primary"` instead.
- Before: `<Button isPrimary>Save</Button>`
- After:  `<Button variant="primary">Save</Button>`
- Codemod: `npx @your-ds/codemod@3 button-is-primary ./src`

**Token rename: `--color-primary` → `--color-brand-default`**
- Find and replace in your codebase.
- All component classes updated automatically.

#### New Features
- **Tabs**: New `variant="buttons"` style
- **Badge**: New `dot` prop for status indicators

#### Bug Fixes
- Fixed focus ring not visible on secondary button in dark mode (#142)
```

---

## Anti-Patterns: The Design System Hall of Shame

| Do Not | Do Instead |
|---|---|
| Hard-code colors in components | Reference semantic tokens — `var(--color-brand-default)` |
| Reference primitive tokens in components | Map through semantic layer — change theme in one place |
| Start with components | Tokens first, patterns second, components third |
| Hand-roll focus traps, keyboard nav, ARIA | Use Radix UI primitives — they solved this already |
| Build Modal without focus trap | Radix Dialog — focus trap, focus restore, Escape, ARIA, free |
| if/else chains for component variants | CVA — declarative, type-safe, composable |
| className concatenation without twMerge | cn() with clsx + twMerge — prevents Tailwind class conflicts |
| Remove or skip `outline` on focus | `outline:none` only for `:focus:not(:focus-visible)` |
| Icon-only button without `aria-label` | Always `aria-label` on icon-only interactive elements |
| Decorative icons without `aria-hidden` | `aria-hidden="true"` on all decorative SVGs |
| `document.documentElement.setAttribute` for theme without SSR script | Inline script before hydration — prevents flash of wrong theme |
| Polymorphic `as` prop | `asChild` with Radix Slot — correct event merging and ref forwarding |
| Removing a prop without deprecation period | Deprecate → warn → codemod → remove in next major version |
| Building a design system for a prototype | Shared tokens file is enough — full system only at scale |
| Animation without reduced motion | Token system zeros duration — set `--duration-*: 0ms` in `prefers-reduced-motion` |
| No Storybook or no a11y addon | Every component needs stories + automated accessibility audit |
| Testing only happy path | Render, all variants, all states, keyboard nav, axe audit |
| One mega Storybook story | Separate story per meaningful state — loading, disabled, error |
| No skip link in app root | `<a href="#main" class="skip-link">Skip to content</a>` |

---

## Pre-Ship Checklist

### Token Architecture
- [ ] Primitive tokens — raw palette, no meaning
- [ ] Semantic tokens — reference primitives only, dark mode works by swap
- [ ] Token naming contract documented — subtle/muted/default/emphasis/strong
- [ ] Tailwind config wired to CSS custom properties
- [ ] SSR theme script injected before hydration — no flash of wrong theme

### Utilities and Setup
- [ ] `cn()` utility implemented (clsx + twMerge)
- [ ] Radix UI packages installed for complex interactive components
- [ ] `@radix-ui/react-slot` installed for asChild pattern

### Components
- [ ] CVA used for all variant/size definitions
- [ ] `forwardRef` on all components
- [ ] `displayName` set on all forwardRef components
- [ ] `asChild` pattern implemented (via Radix Slot)
- [ ] All interactive states: default, hover, active, focus, disabled, loading
- [ ] Complex components (Modal, Tabs, Select) built on Radix primitives

### Accessibility
- [ ] Global focus ring via `:focus-visible` — visible for keyboard, hidden for mouse
- [ ] Skip navigation link in app root
- [ ] `sr-only` utility class defined
- [ ] `aria-hidden="true"` on all decorative icons
- [ ] `aria-label` on all icon-only interactive elements
- [ ] `aria-busy` on loading states, `aria-invalid` on error inputs
- [ ] All text colors meet WCAG AA contrast (4.5:1 normal, 3:1 large)
- [ ] Animation respects `prefers-reduced-motion` (zeroed via tokens)

### Documentation and Storybook
- [ ] Storybook with a11y addon, theme toolbar, viewport addon
- [ ] Global decorator applies data-theme and base styles
- [ ] Story per component with: default, all variants, all sizes, loading, disabled
- [ ] JSDoc on every exported component with @example, @accessibility

### Testing
- [ ] Unit tests: render, interaction, all variants, all states
- [ ] Keyboard tests: Tab, Enter, Space, Escape, arrow keys for complex components
- [ ] `axe` accessibility audit on every component state
- [ ] Visual regression baseline screenshots captured (Playwright or Chromatic)

### Versioning
- [ ] SemVer followed strictly
- [ ] Breaking changes have deprecation warning (one major version ahead)
- [ ] Codemod provided for prop renames
- [ ] CHANGELOG.md with migration instructions maintained

---

## Quick Reference: Decision Tree

```
What am I building?

A visual value (color, space, shadow, radius)?
  -> Define as primitive token first
  -> Map to semantic token (level 2)
  -> Never use raw value in a component

A component with multiple visual styles?
  -> cva() for variants and sizes
  -> cn() for className merging
  -> forwardRef for DOM access and ref forwarding

A complex interactive component?
  Modal, dialog, alert     -> @radix-ui/react-dialog
  Tabs, tab panels         -> @radix-ui/react-tabs
  Dropdown, context menu   -> @radix-ui/react-dropdown-menu
  Select / combobox        -> @radix-ui/react-select
  Tooltip                  -> @radix-ui/react-tooltip
  Checkbox, radio, switch  -> @radix-ui/react-checkbox / radio-group / switch
  Accordion                -> @radix-ui/react-accordion
  NEVER hand-roll these

A component that renders as different HTML elements?
  -> asChild with @radix-ui/react-slot
  -> NOT an "as" prop

A compound component with shared internal state?
  -> createContext inside the component module
  -> Provider at root (Tabs, Accordion root)
  -> Custom hook (useTabs, useAccordion) for child access
  -> Radix handles this for all standard patterns

Dark mode?
  -> Handled by semantic token swap at [data-theme="dark"]
  -> Inline script before hydration prevents flash
  -> Nothing changes in components

Adding dark mode to a new app?
  1. Inject theme script in HTML before React hydration
  2. Wrap app in ThemeProvider
  3. dark.css already handles the rest

Testing a component?
  -> Render test
  -> All variants test
  -> All states (hover, focus, disabled, loading, error)
  -> Keyboard navigation (Tab, Enter, Space, Escape, arrows)
  -> axe accessibility audit on every state
  -> Visual regression screenshot

Releasing a breaking change?
  -> Deprecate with console.warn in development
  -> Document migration in CHANGELOG
  -> Provide codemod
  -> Remove in next major version only
```

---

> **A design system is finished when it is used correctly without explanation — when a new developer reaches for the right token automatically, when dark mode works without thinking, when Radix handles the keyboard navigation nobody remembers to test, when accessibility is the default and not the afterthought. Tokens first. Radix for complexity. CVA for variants. Test every keyboard path. Document everything.**
