# Frontend Design Skill — Production Grade

## When to Use
Trigger this skill for any request involving:
- Web components, pages, or full applications
- Landing pages, dashboards, portfolios, admin panels
- React components, HTML/CSS layouts
- Styling, beautifying, or redesigning existing UI
- Posters, cards, interactive artifacts

---

## Phase 1: Understand Before You Design

Before writing a single line of code, answer these questions:

- **Who uses this?** A developer tool, a consumer app, and an enterprise dashboard each demand completely different aesthetics and interaction patterns.
- **What's the primary action?** Every UI has one thing it needs the user to do. Design around that — not around filling space.
- **What's the context of use?** Desktop-only internal tool vs. mobile-first public product — these are different problems.
- **What are the constraints?** Performance budget, accessibility requirements, client brand guidelines, browser support.

> **Rule:** A well-understood problem produces a better design than a well-executed guess. Never skip this phase.

---

## Phase 2: Design System Foundation (Set This Up First)

Even for one-off projects, establishing a foundation upfront saves time and produces cohesive results.

### Spacing Scale
Use a consistent base unit (4px or 8px). All spacing, padding, and gaps should be multiples of this unit. Never use arbitrary values like `13px` or `27px`.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Type Scale
Define your type hierarchy before writing any component. A scale of 5–6 sizes is enough for most UIs.

```css
:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-4xl: 2.25rem;
  --text-6xl: 3.75rem;
}
```

### Color Tokens
Never hardcode hex values in components. Define semantic tokens and use them everywhere.

```css
:root {
  /* Brand */
  --color-primary: #...;
  --color-primary-hover: #...;

  /* Neutrals */
  --color-bg: #...;
  --color-surface: #...;
  --color-border: #...;
  --color-text: #...;
  --color-text-muted: #...;

  /* Feedback */
  --color-success: #...;
  --color-warning: #...;
  --color-error: #...;
}
```

---

## Phase 3: Aesthetic Direction

Commit to a **single, clear aesthetic direction** before choosing colors or fonts. The biggest mistake is designing without a point of view — the result always looks generic.

**Pick one tone and execute it with precision:**

| Direction | Characteristics |
|---|---|
| Brutally minimal | Maximum whitespace, monochrome, one accent, zero decoration |
| Luxury / refined | Tight kerning, serif type, muted palette, precise spacing |
| Brutalist / raw | Grid-breaking layouts, high contrast, visible structure |
| Editorial / magazine | Strong typographic hierarchy, asymmetry, photography-forward |
| Retro-futuristic | Monospace fonts, scanlines, glow effects, dark backgrounds |
| Playful / toy-like | Rounded corners, saturated colors, bouncy animations |
| Organic / natural | Earth tones, irregular shapes, soft shadows, texture |
| Industrial / utilitarian | Dense information, monospace, muted palette, functional first |

> **Critical rule:** Bold maximalism and refined minimalism both work — what fails is trying to be both at once. Choose and commit.

---

## Phase 4: Typography

Typography communicates tone before the user reads a word.

**Do:**
- Pair a distinctive display/heading font with a clean body font
- Use Google Fonts or system-available fonts creatively
- Establish line-height ratios: `1.1–1.2` for headings, `1.5–1.7` for body
- Use `letter-spacing: -0.02em` on large headings for a polished, professional feel
- Size headings boldly — undersized headings are the #1 reason UIs look amateurish

**Don't:**
- Default to Inter, Roboto, Arial, or system-ui as a first choice
- Use more than 2 font families in one UI
- Ignore line-length — body text should max out at `65–75ch` for readability

**Font pairing formula that works:**
`[Expressive/Personality Display Font] + [Neutral, Readable Body Font]`

Examples: `Playfair Display + DM Sans`, `Syne + Inter`, `Bebas Neue + Source Sans 3`, `Cormorant Garamond + Jost`

---

## Phase 5: Color & Theme

**Rules:**
- **One dominant color, one accent, one neutral family.** More than this requires a strong reason.
- Use your color tokens (defined in Phase 2) everywhere — never inline hex values in components.
- Alternate between light and dark themes across different projects — never default to the same.
- Contrast ratios matter: body text needs **4.5:1 minimum** against its background (WCAG AA).

**Anti-patterns:**
- Purple gradient on white — the most overused "AI-generated" palette. Avoid entirely.
- Evenly distributed colors — imbalance creates visual tension and interest.
- Colors disconnected from the brand or tone of the product.

---

## Phase 6: Layout & Spatial Composition

### Responsive-First Approach
Always design mobile-first. Start with a single-column layout and add complexity at wider breakpoints using `min-width` media queries.

```css
/* Mobile first */
.grid { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }

/* Tablet */
@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }

/* Desktop */
@media (min-width: 1200px) { .grid { grid-template-columns: repeat(3, 1fr); } }
```

### Layout Principles
- Asymmetry, overlap, and diagonal flow create more memorable layouts than centered grids
- Break the grid intentionally in at least one place — it signals confidence
- Visual hierarchy through size contrast: make the most important element significantly larger than the rest
- Every layout needs breathing room — generous whitespace reads as premium, not empty
- **Touch targets:** Interactive elements must be minimum `44×44px` on mobile

---

## Phase 7: Component Architecture

**For simple artifacts:** A single well-organized file is fine.

**For anything reusable or production-bound:** Think in components.

```
UI = Layout Components + Feature Components + Primitive Components

Layout:    Page, Section, Container, Grid, Stack
Feature:   ProductCard, UserAvatar, SearchBar, Navbar
Primitive: Button, Input, Badge, Tooltip, Modal
```

**Rules:**
- Keep UI components free of business logic — they receive data as props and emit events
- Handle all three states for every dynamic component: **loading**, **error**, **empty**
- Never hardcode content inside components — pass it as props or slots
- Name components by what they *are*, not what they *look like* (`UserCard`, not `BlueBox`)
- **State that belongs in a component:** UI state (open/closed, hover, selected tab)
- **State that doesn't:** Server data, user auth, app-wide settings — these belong higher up

---

## Phase 8: Motion & Animation

Motion adds delight when used with intention. One well-placed animation beats ten scattered ones.

**Principles:**
- Orchestrate page load as a single staggered reveal — not random individual animations
- Hover states should change more than just opacity (transform, color shift, shadow)
- Always respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**High-impact animation moments:**
- Page/component entry (staggered `animation-delay` reveals)
- Scroll-triggered sections (`IntersectionObserver`)
- Button press and form submission feedback
- State transitions (tab switches, accordion opens, modal entrances)

CSS-only is preferred for HTML artifacts. Use the `motion` library for complex React sequences.

---

## Phase 9: Visual Atmosphere & Backgrounds

Go beyond flat backgrounds. Create depth and atmosphere.

**Techniques (choose what fits the aesthetic):**
- Gradient meshes and multi-stop layered gradients
- SVG noise/grain texture overlay for a tactile feel
- Geometric patterns or subtle tile backgrounds
- Dramatic `box-shadow` stacking for depth
- Glassmorphism / frosted blur (`backdrop-filter: blur()`)
- Layered transparencies with `mix-blend-mode`
- Decorative borders, corner accents, or ruled lines

---

## Phase 10: Accessibility (Non-Negotiable)

Accessibility is not optional — it's legally required in many markets and reflects professional quality.

**Minimum requirements for every UI:**

- **Color contrast:** Text must meet 4.5:1 (normal) or 3:1 (large/bold) against background
- **Semantic HTML:** Use `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`, `<label>` — not just `<div>` everywhere
- **Keyboard navigation:** Every interactive element must be reachable and operable via keyboard. Test by pressing Tab through your UI.
- **Focus states:** Never do `outline: none` without providing a custom visible focus style
- **Images:** Every `<img>` needs a meaningful `alt` attribute (or `alt=""` if purely decorative)
- **Form labels:** Every input needs an associated `<label>` — not just placeholder text
- **ARIA attributes:** Use `aria-label`, `aria-expanded`, `aria-describedby` where native semantics fall short

```html
<!-- Wrong -->
<div onclick="toggle()">Menu</div>

<!-- Right -->
<button aria-expanded="false" aria-controls="nav-menu" onclick="toggle()">Menu</button>
```

---

## Phase 11: Performance

Performance is a feature. Slow UIs lose users and damage client trust.

**Critical habits:**
- Use `font-display: swap` to prevent invisible text during font load
- Avoid layout shift (CLS): always define `width` and `height` on images
- Lazy load images below the fold: `<img loading="lazy">`
- Minimize DOM depth — deeply nested elements slow paint and make CSS harder
- Use CSS transforms (`translate`, `scale`) for animations — not `top`/`left`/`width` which trigger layout reflow
- Avoid importing entire libraries for one function — import only what you need

---

## Phase 12: Implementation Standards

### HTML/CSS Artifacts
- Single `.html` file with inline `<style>` and `<script>` tags
- External scripts from `https://cdnjs.cloudflare.com` only
- No `<form>` tags — use event listeners (`onclick`, `onsubmit`) instead

### React Artifacts (`.jsx`)
- Single file, default export, no required props (or all props have defaults)
- Tailwind core utility classes only — no custom config
- Import hooks explicitly: `import { useState, useEffect } from "react"`

**Available libraries:**

| Library | Import | Use for |
|---|---|---|
| `lucide-react@0.263.1` | `import { Icon } from 'lucide-react'` | Icons |
| `recharts` | `import { LineChart } from 'recharts'` | Charts |
| `d3` | `import * as d3 from 'd3'` | Data viz |
| `three` (r128) | `import * as THREE from 'three'` | 3D (no OrbitControls, no CapsuleGeometry) |
| `tone` | `import * as Tone from 'tone'` | Audio |
| `shadcn/ui` | `import { Button } from '@/components/ui/button'` | UI primitives (tell user if used) |
| `mathjs` | `import * as math from 'mathjs'` | Math |
| `lodash` | `import _ from 'lodash'` | Utilities |

### Storage
- **Never use `localStorage` or `sessionStorage`** — unsupported in Claude.ai artifacts
- Use `useState` / `useReducer` for React, or JS in-memory objects for HTML artifacts

---

## Anti-Patterns: Real-World Edition

| ❌ Don't | ✅ Do Instead |
|---|---|
| Inter / Roboto / Arial as default | Distinctive, intentional font pairing |
| Purple gradient on white | Context-appropriate palette with clear token system |
| Hardcoded hex values in components | CSS variables / design tokens |
| No loading / error / empty states | Handle all three states for every data-driven component |
| `outline: none` on focus | Custom visible focus style |
| `<div onclick>` for interactive elements | Semantic `<button>` or `<a>` with proper ARIA |
| Arbitrary spacing values (13px, 27px) | Consistent spacing scale (multiples of 4 or 8) |
| Business logic inside UI components | Separate concerns — UI renders, logic lives elsewhere |
| Same aesthetic across projects | Different tone, palette, font, layout every time |
| Animations ignoring `prefers-reduced-motion` | Always wrap animations in motion media query |
| Desktop-only layout thinking | Mobile-first, responsive by default |

---

## Pre-Ship Checklist

### Design Quality
- [ ] Aesthetic direction is clear and fully committed (not vague or mixed)
- [ ] Typography uses a distinctive, intentional heading + body pairing
- [ ] Color palette uses tokens/variables — no hardcoded hex in components
- [ ] Layout has at least one unexpected spatial choice (asymmetry, overlap, etc.)
- [ ] Background has depth — not just a flat solid color
- [ ] At least one meaningful animation or motion effect is present

### Engineering Quality
- [ ] All three states handled for dynamic content: loading, error, empty
- [ ] Spacing follows a consistent scale — no arbitrary pixel values
- [ ] No business logic inside UI components
- [ ] Mobile-first responsive layout confirmed

### Accessibility
- [ ] Color contrast passes WCAG AA (4.5:1 for body text)
- [ ] Semantic HTML used throughout (`<nav>`, `<main>`, `<button>`, `<label>`)
- [ ] All interactive elements are keyboard-accessible
- [ ] Focus states are visible and styled
- [ ] All images have `alt` attributes
- [ ] `prefers-reduced-motion` is respected

### Performance
- [ ] `font-display: swap` on web fonts
- [ ] Images have defined dimensions (no layout shift)
- [ ] Animations use CSS `transform` — not positional properties
- [ ] No unnecessary full-library imports

---

## Client Handoff Notes

When delivering to a client or team, always confirm:

1. **Browser support** — Which browsers need to be supported? IE11 still exists in enterprise.
2. **CMS or static?** — Will a non-developer edit content? If so, hardcoded text is a problem.
3. **Brand guidelines** — Does the client have existing fonts, colors, or logo usage rules?
4. **Hosting context** — Where will this live? Some environments restrict external font loading.
5. **Maintenance plan** — Who owns this after delivery? Write code that someone else can read.

> The best frontend work isn't just the one that looks great in the browser — it's the one that's still running cleanly two years later with someone else maintaining it.
