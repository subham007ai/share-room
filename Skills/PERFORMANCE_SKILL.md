# Performance Skill — Production Grade

## When to Use
Trigger this skill for any request involving:
- "My app feels slow" or "improve performance"
- Core Web Vitals: LCP, CLS, INP scores
- Lighthouse score improvement
- JavaScript bundle too large, slow load times
- React rerender optimization, memo, useMemo, useCallback
- Image optimization, lazy loading, responsive images
- Font loading — CLS from fonts, FOIT, FOUT
- Third-party scripts slowing down the page (analytics, chat, etc.)
- Code splitting, dynamic imports, lazy loading routes
- Next.js performance — SSG, SSR, ISR, React Server Components, streaming
- Virtualization for long lists
- Memory leaks — event listeners, intervals, growing heap
- CSS render-blocking, critical CSS
- Caching, CDN, HTTP headers
- Performance budgets and CI enforcement
- Animation performance — janky scrolling, dropped frames
- Network optimization — preload, prefetch, preconnect

---

## The Performance Mindset

**Measure first. Always.**

The single most common performance mistake is optimizing the wrong thing. Adding `React.memo` everywhere, splitting every component into `useMemo` — these are low-impact interventions that make code harder to read. The actual performance killers in production are almost always: a large unoptimized LCP image, a render-blocking font, a third-party script loading synchronously, or a JavaScript bundle that is 3x larger than it needs to be.

Before writing a single line of performance code, measure. Find the actual bottleneck. Fix the biggest thing first.

**Three rules that govern everything:**

1. **Field data beats lab data.** Lighthouse runs in a controlled lab environment on a fast machine. Real users are on slow Android phones on 4G networks. The Chrome User Experience Report (CrUX) measures what real users actually experience. Both matter, but field data is what Google uses for rankings and what actually reflects user experience.
2. **The biggest wins are almost never React-specific.** Shipping less JavaScript, loading images correctly, not blocking render with fonts and stylesheets — these move scores by 20-40 points. `React.memo` moves scores by 1-2 points on a good day. Prioritize accordingly.
3. **Performance is a process, not a one-time fix.** Without budgets and CI enforcement, performance regresses. Every feature ships JavaScript. Every third-party integration ships JavaScript. The only way to maintain performance is to make regression impossible to ship accidentally.

---

## Phase 1: Measure Before Touching Anything

Never optimize without a baseline. Never trust intuition about where the bottleneck is.

### The Right Tools for Each Problem

```
Field data (real users):
  Chrome User Experience Report (CrUX)
    -> PageSpeed Insights: https://pagespeed.web.dev
    -> Shows p75 values — 75th percentile of real users
    -> This is what Google Search ranking uses
    -> Need enough traffic for data to appear (28-day rolling window)

  Web Vitals JS library — measure in production
    -> npm install web-vitals
    -> Reports LCP, CLS, INP, TTFB, FCP to your analytics

Lab data (controlled, reproducible):
  Lighthouse (in Chrome DevTools → Lighthouse tab)
    -> Simulated throttling: Moto G4 on slow 4G
    -> Good for development iteration, not for production truth
    -> Run 3x and average — single runs vary significantly

  WebPageTest: https://webpagetest.org
    -> Real device testing on real network conditions
    -> Waterfall chart — the most valuable performance visualization
    -> Visual comparison, filmstrip view

  Chrome DevTools:
    Performance panel    -> Record runtime, find long tasks, JS execution
    Network panel        -> Waterfall, resource sizes, cache behavior
    Coverage panel       -> Unused JavaScript and CSS (Cmd+Shift+P -> Coverage)
    Memory panel         -> Heap snapshots, memory leaks
    Rendering panel      -> Paint flashing, layout shift regions, FPS meter
```

### Core Web Vitals — The Three Metrics That Matter

```
LCP — Largest Contentful Paint
  What: Time until largest visible element renders (image, video, text block)
  Good: <= 2.5s  |  Needs work: 2.5s-4s  |  Poor: > 4s
  Almost always: the hero image or above-fold image
  Primary causes:
    - Image not preloaded
    - Image format not optimized (PNG instead of WebP/AVIF)
    - Image too large (3000px wide served to a 400px phone)
    - Render-blocking resources delaying everything
    - Slow server response (TTFB > 800ms)

CLS — Cumulative Layout Shift
  What: Total unexpected visual movement of page content
  Good: <= 0.1  |  Needs work: 0.1-0.25  |  Poor: > 0.25
  Primary causes:
    - Images without width/height attributes
    - Fonts loading and changing text size (FOUT)
    - Dynamic content inserted above existing content
    - Ads or embeds without reserved space
    - Animations using top/left instead of transform

INP — Interaction to Next Paint  (replaced FID in March 2024)
  What: Responsiveness — time from user interaction to next visual update
        Measures ALL interactions during page lifetime, reports worst p98
  Good: <= 200ms  |  Needs work: 200-500ms  |  Poor: > 500ms
  Primary causes:
    - Long JavaScript tasks blocking the main thread (> 50ms = long task)
    - Expensive React renders triggered by interaction
    - Synchronous operations in event handlers
    - Heavy third-party scripts competing for main thread
    - No input debouncing on frequent events (scroll, resize, type)

TTFB — Time to First Byte (supporting metric)
  What: Time until first byte received from server
  Good: <= 800ms
  Causes: slow server, no CDN, database queries in critical path
```

### Reading a Lighthouse Report

```
Priority order when reading results:
1. Opportunities section — actionable items sorted by estimated savings
2. Diagnostics section — supporting metrics (not directly scored)
3. Passed audits — confirm what is already working

Do NOT optimize:
  Items already green (>= 90 score)
  Items with < 0.1s estimated savings
  Accessibility issues in performance tab (different problem)

Common trap: chasing the Lighthouse score number.
The number is a lab score on a simulated slow device.
Real user improvement comes from fixing real user data (CrUX/PageSpeed).
They often differ significantly.
```

### Web Vitals in Production

```typescript
// Measure real user Core Web Vitals and send to analytics
// Add to your app entry point (app/layout.tsx, _app.tsx, main.tsx)

import { onLCP, onCLS, onINP, onFCP, onTTFB } from "web-vitals";

type MetricName = "LCP" | "CLS" | "INP" | "FCP" | "TTFB";

function sendToAnalytics(metric: {
  name:  MetricName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id:    string;
}) {
  // Send to your analytics provider
  // Example: Google Analytics 4
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      value:         Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      metric_id:     metric.id,
      metric_value:  metric.value,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }

  // Example: custom endpoint
  navigator.sendBeacon("/api/vitals", JSON.stringify(metric));
}

// Report all vitals
onLCP(sendToAnalytics);
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

---

## Phase 2: LCP — The Highest-Impact Fix

LCP is the most important Core Web Vital for most sites. A poor LCP score almost always comes from one of three things: the LCP image is not preloaded, it is the wrong format, or it is the wrong size.

### Identify the LCP Element

```javascript
// Find LCP element in DevTools console
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const last    = entries[entries.length - 1];
  console.log("LCP element:", last.element);
  console.log("LCP time:",    last.startTime);
}).observe({ type: "largest-contentful-paint", buffered: true });

// Or: Lighthouse report > LCP audit > "LCP element" link
// Or: DevTools Performance panel > record > find LCP marker
```

### Preload the LCP Image — Single Biggest LCP Win

```html
<!-- In <head> — before any stylesheets or scripts -->
<!-- This tells browser to fetch LCP image immediately, not after parsing -->
<link
  rel="preload"
  as="image"
  href="/hero-800.jpg"
  imagesrcset="/hero-400.jpg 400w, /hero-800.jpg 800w, /hero-1600.jpg 1600w"
  imagesizes="(max-width: 640px) 100vw, 800px"
  fetchpriority="high"
/>

<!-- And on the img element itself -->
<img
  src="/hero-800.jpg"
  srcset="/hero-400.jpg 400w, /hero-800.jpg 800w, /hero-1600.jpg 1600w"
  sizes="(max-width: 640px) 100vw, 800px"
  alt="Hero image"
  width="800"
  height="450"
  fetchpriority="high"   <!-- tells browser this is highest priority -->
  decoding="sync"        <!-- decode synchronously for LCP image -->
  loading="eager"        <!-- never lazy-load the LCP image -->
/>
```

### Next.js Image Component — LCP Configuration

```tsx
import Image from "next/image";

// LCP image — above fold, highest priority
<Image
  src="/hero.jpg"
  alt="Hero"
  width={800}
  height={450}
  priority                    // generates <link rel="preload"> automatically
  quality={85}
  sizes="(max-width: 640px) 100vw, 800px"
  // DO NOT use loading="lazy" or placeholder="blur" on LCP image
  // blur placeholder delays render — bad for LCP
/>

// Below-fold images — lazy load
<Image
  src="/feature.jpg"
  alt="Feature"
  width={600}
  height={400}
  loading="lazy"              // default — fine for below-fold
  placeholder="blur"          // safe here, not LCP
  blurDataURL="data:..."
  sizes="(max-width: 768px) 100vw, 600px"
/>
```

### Image Format and Compression — Enormous Size Savings

```
Format selection order (best to acceptable):
  AVIF  — 50% smaller than WebP, 80% smaller than PNG. Chrome 85+, Safari 16+
  WebP  — 30% smaller than PNG/JPEG. All modern browsers
  JPEG  — acceptable for photos, no transparency
  PNG   — only when transparency needed and WebP not used
  SVG   — only for icons, logos, illustrations

Compression targets (quality vs size balance):
  AVIF:  quality 60-70 — visually identical to JPEG 85
  WebP:  quality 75-85
  JPEG:  quality 75-85

Dimension sizing — the most common mistake:
  NEVER serve a 3000px image in a 400px container
  Create multiple sizes: 400w, 800w, 1200w, 1600w, 2000w
  Use srcset + sizes so browser picks correct size

Tools:
  Squoosh: https://squoosh.app — browser-based, free, excellent
  Sharp (Node.js): automated image processing in build pipeline
  ImageMagick: convert -quality 85 -strip input.jpg output.webp
  Next.js Image: automatic format conversion, resizing, optimization

Size targets:
  Hero image: < 200KB (AVIF/WebP)
  Card thumbnail: < 50KB
  Icon/logo: SVG or < 10KB WebP
  Background image: < 150KB, consider CSS gradient instead
```

---

## Phase 3: Render-Blocking Resources

Resources that block rendering delay FCP and LCP. The browser cannot render anything until render-blocking CSS and synchronous scripts are processed.

### CSS — Render-Blocking by Default

```html
<!-- Bad: large stylesheet blocks all rendering -->
<link rel="stylesheet" href="/all-styles.css">

<!-- Good: inline critical CSS, load rest async -->
<style>
  /* Critical CSS — above-fold styles only */
  /* Generated by: npx critical index.html --inline > index-critical.html */
  body { margin: 0; font-family: system-ui; background: #fff; }
  .header { display: flex; padding: 1rem; }
  .hero { min-height: 50vh; }
</style>

<!-- Non-critical CSS loads without blocking render -->
<link rel="preload" href="/styles.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/styles.css"></noscript>

<!-- Tools for critical CSS extraction: -->
<!-- npm install critical — extracts above-fold CSS automatically -->
<!-- Vite plugin: vite-plugin-critical -->
<!-- Next.js handles this automatically for its CSS modules -->
```

### Scripts — Async and Defer

```html
<!-- Bad: blocks HTML parsing and rendering -->
<script src="/app.js"></script>

<!-- Good: defer — executes after HTML parsed, in order -->
<script src="/app.js" defer></script>

<!-- Good: async — downloads in parallel, executes immediately when ready -->
<!-- Use for independent scripts (analytics) that don't depend on DOM -->
<script src="/analytics.js" async></script>

<!-- Best for third-party: type="module" implies defer -->
<script type="module" src="/app.js"></script>

<!-- Loading order reference:
  No attribute:  blocks HTML parsing, executes immediately
  defer:         downloads in parallel, executes after HTML, in order
  async:         downloads in parallel, executes immediately when ready, out of order
  type="module": defer behavior by default

  Rule: all your scripts should be defer or type="module"
  Third-party analytics/tracking: async (they should not depend on DOM)
  Never use no attribute for external scripts
-->
```

---

## Phase 4: Font Loading — CLS and LCP Killer

Fonts are one of the top causes of both CLS and LCP degradation. The browser cannot render text until the font downloads unless you handle this correctly.

### The Complete Font Loading Strategy

```html
<!-- Step 1: Preconnect to font CDN (start DNS + TCP early) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Step 2: Preload the specific font files you need -->
<!-- Only preload the most critical weight/style (usually Regular 400) -->
<link rel="preload"
      href="/fonts/inter-var.woff2"
      as="font"
      type="font/woff2"
      crossorigin>
```

```css
/* Step 3: font-display: swap — show fallback immediately, swap when loaded */
/* This prevents FOIT (flash of invisible text) */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var.woff2") format("woff2");
  font-weight:  100 900;
  font-style:   normal;
  font-display: swap;        /* show fallback immediately */
}

/* Step 4: size-adjust — eliminate CLS from font swap */
/* When Inter loads, it displaces fallback text causing layout shift. */
/* size-adjust makes the fallback font the same size as Inter. */
/* Generate values at: https://screenspan.net/fallback */
@font-face {
  font-family: "Inter-Fallback";
  src: local("Arial");          /* use system font as fallback */
  size-adjust:        96.52%;   /* match Inter x-height */
  ascent-override:    90.2%;
  descent-override:   22.48%;
  line-gap-override:  0%;
}

body {
  /* Fallback chain: Inter -> sized Arial -> system-ui -> sans-serif */
  font-family: "Inter", "Inter-Fallback", system-ui, sans-serif;
}
```

### Next.js Font Optimization

```typescript
// app/layout.tsx — Next.js handles preload, self-hosting, CLS automatically
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets:  ["latin"],
  display:  "swap",          // font-display: swap
  variable: "--font-sans",   // expose as CSS variable for design tokens
  // Next.js automatically:
  //   - self-hosts the font (no Google DNS lookup)
  //   - generates @font-face with size-adjust to prevent CLS
  //   - adds <link rel="preload"> in <head>
  //   - serves as woff2 (optimal format)
});

const mono = JetBrains_Mono({
  subsets:  ["latin"],
  display:  "swap",
  variable: "--font-mono",
  weight:   ["400", "500"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Self-Hosting Fonts (Best Performance)

```bash
# Download font files locally — eliminates external DNS lookup
# Tool: https://google-webfonts-helper.herokuapp.com

# Or with npm:
npm install @fontsource-variable/inter
```

```css
/* Self-hosted — fastest possible font loading */
@import "@fontsource-variable/inter/woffs2.css";
/* Or for CSS custom property approach: */
@import "@fontsource-variable/inter";
```

---

## Phase 5: JavaScript Bundle Optimization

After images and render-blocking resources, JavaScript bundle size is the next biggest lever. Every KB of JavaScript costs parse time, not just download time.

### Analyze the Bundle First

```bash
# Next.js — built-in bundle analyzer
npm install @next/bundle-analyzer

# next.config.ts
import withBundleAnalyzer from "@next/bundle-analyzer";
export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})({
  // your next config
});

# Run: ANALYZE=true npm run build
# Opens treemap — shows every module, its size, who imported it

# Vite — rollup-plugin-visualizer
npm install rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";
export default defineConfig({
  plugins: [visualizer({ open: true, gzipSize: true })],
});

# What to look for:
  Large node_modules (moment.js, lodash, date-fns)
  Modules imported in multiple chunks (duplication)
  Unexpectedly large chunks
  Libraries with smaller alternatives
```

### Code Splitting and Dynamic Imports

```typescript
// Bad: entire app in one bundle — all JS downloaded before anything renders
import { HeavyChart }    from "@/components/HeavyChart";
import { DataTable }     from "@/components/DataTable";
import { RichTextEditor } from "@/components/RichTextEditor";

// Good: split heavy components — only downloaded when needed
import dynamic from "next/dynamic";

// Lazy load heavy components with loading fallback
const HeavyChart = dynamic(
  () => import("@/components/HeavyChart"),
  {
    loading: () => <ChartSkeleton />,
    ssr:     false,  // client-only components (uses window, etc.)
  }
);

const RichTextEditor = dynamic(
  () => import("@/components/RichTextEditor"),
  {
    loading: () => <EditorSkeleton />,
    ssr:     false,
  }
);

// React.lazy (non-Next.js apps)
import { lazy, Suspense } from "react";
const HeavyChart = lazy(() => import("@/components/HeavyChart"));

// Usage — Suspense required
<Suspense fallback={<ChartSkeleton />}>
  <HeavyChart data={data} />
</Suspense>

// Lazy load on interaction — best for non-critical features
const loadEditor = async () => {
  const { RichTextEditor } = await import("@/components/RichTextEditor");
  return RichTextEditor;
};
// Trigger on button click, not on route load
```

### Tree Shaking — Stop Importing Entire Libraries

```typescript
// Bad: imports entire lodash (531KB minified)
import _ from "lodash";
const result = _.groupBy(items, "category");

// Good: import only what you need (< 1KB)
import groupBy from "lodash/groupBy";

// Best: use native JavaScript (zero bundle cost)
const result = Object.groupBy(items, item => item.category);

// Bad: imports entire date-fns (300KB+)
import { format, parseISO } from "date-fns";

// Good: same import, but verify tree-shaking works
// Check with: ANALYZE=true npm run build — date-fns should be < 50KB

// Bad: Moment.js — 232KB gzipped. Replace with:
//   date-fns      — tree-shakeable, < 15KB for common operations
//   dayjs         — 2KB gzipped, Moment.js API compatible
//   Temporal API  — native, zero bundle cost (Chrome 127+, Safari preview)

// Bad: entire icon library
import { IconA, IconB } from "@heroicons/react/24/solid";
// This is fine — Heroicons is tree-shakeable
// NOT fine: import * from "@mui/icons-material" (5000+ icons)

// Rule: after every new dependency, check bundle analyzer
// A single bad import can add 200KB+ to your bundle
```

### Bundle Size Limits — Concrete Targets

```
Total JavaScript (gzipped) budget:
  Initial bundle (above-fold):  < 100KB
  Total first load:             < 200KB
  Per route chunk:              < 50KB
  Third-party scripts total:    < 100KB (often the hardest)

Single dependency size limits:
  If a library > 50KB gzipped, find an alternative or lazy load it
  date-fns: ~15KB for common ops   ✓
  lodash-es: ~10KB tree-shaken     ✓
  moment.js: ~72KB gzipped         ✗ replace with date-fns or dayjs
  chart.js:  ~62KB gzipped         — lazy load it
  monaco editor: ~2MB              — definitely lazy load, client-only

Check any package at: https://bundlephobia.com
```

---

## Phase 6: Third-Party Scripts — The Biggest Real-World Killer

In production apps, third-party scripts from analytics, chat, A/B testing, and tracking are often responsible for 40-70% of JavaScript. They compete for main thread time, delay LCP, and damage INP scores.

### Inventory Your Third-Party Scripts

```javascript
// Paste in DevTools console — shows all third-party scripts and sizes
const thirdPartyScripts = performance
  .getEntriesByType("resource")
  .filter(e => e.initiatorType === "script")
  .filter(e => !e.name.includes(window.location.hostname))
  .map(e => ({
    url:          e.name,
    size:         Math.round(e.transferSize / 1024) + "KB",
    duration:     Math.round(e.duration) + "ms",
    blockingTime: Math.round(e.responseEnd - e.fetchStart) + "ms",
  }))
  .sort((a, b) => parseInt(b.size) - parseInt(a.size));

console.table(thirdPartyScripts);
```

### The Strategy: Delay Everything Non-Critical

```typescript
// Next.js Script component — built-in loading strategy
import Script from "next/script";

// afterInteractive (default) — loads after page becomes interactive
// Good for: analytics, tag managers
<Script
  src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXX"
  strategy="afterInteractive"
/>

// lazyOnload — loads during browser idle time
// Good for: chat widgets, support tools, A/B testing
<Script
  src="https://widget.intercom.io/widget/xxx"
  strategy="lazyOnload"
/>

// worker — runs in web worker (Partytown integration)
// Good for: tag managers, marketing pixels — zero main thread cost
<Script
  src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXX"
  strategy="worker"   // requires @builder.io/partytown
/>

// beforeInteractive — use SPARINGLY (blocks hydration)
// Only for: consent managers that must run first
<Script
  src="/consent-manager.js"
  strategy="beforeInteractive"
/>
```

### Partytown — Offload Tag Managers to Web Workers

```typescript
// Move Google Tag Manager, Meta Pixel, etc. off main thread entirely
// npm install @builder.io/partytown

// next.config.ts
import { partytownSnippet } from "@builder.io/partytown/integration";

// app/layout.tsx
import { Partytown } from "@builder.io/partytown/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Partytown debug={false} forward={["dataLayer.push", "fbq"]} />
      </head>
      <body>
        {children}
        {/* GTM now runs in web worker — zero main thread cost */}
        <Script
          src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXX"
          strategy="worker"
        />
      </body>
    </html>
  );
}
```

### Facade Pattern — Defer Until Interaction

```tsx
// Instead of loading heavy widget on page load,
// show a screenshot/placeholder and load the real thing on click

const IntercomChat = () => {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    return (
      <button
        onClick={() => setLoaded(true)}
        className="chat-button-placeholder"
        aria-label="Open support chat"
      >
        <ChatIcon />
        <span>Chat with us</span>
      </button>
    );
  }

  return (
    <Script
      src="https://widget.intercom.io/widget/xxx"
      strategy="afterInteractive"
      onLoad={() => window.Intercom("boot", { app_id: "xxx" })}
    />
  );
};

// YouTube embed facade — saves 400KB+ on page load
const YouTubeEmbed = ({ videoId, title }) => {
  const [play, setPlay] = useState(false);

  if (play) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title={title}
        allow="autoplay"
        loading="lazy"
      />
    );
  }

  return (
    <div
      className="youtube-facade"
      onClick={() => setPlay(true)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title}`}
      style={{
        backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)`,
      }}
    >
      <PlayIcon />
    </div>
  );
};
```

---

## Phase 7: CLS — Cumulative Layout Shift

Every unexpected layout shift is visible to the user as content jumping around. It is jarring and suggests a poorly built page.

### Images and Media — Always Reserve Space

```html
<!-- Bad: no dimensions — browser does not know size until image loads
     Page reflows when image appears, shifting everything below it -->
<img src="/photo.jpg" alt="Photo">

<!-- Good: explicit dimensions — browser reserves space immediately -->
<img src="/photo.jpg" alt="Photo" width="800" height="450">

<!-- Good: aspect ratio via CSS — works for responsive images too -->
<div style="aspect-ratio: 16/9; overflow: hidden;">
  <img src="/photo.jpg" alt="Photo" style="width: 100%; height: 100%; object-fit: cover;">
</div>

<!-- CSS aspect-ratio — modern approach -->
.image-wrapper {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Dynamic Content — Reserve Space or Append Below

```tsx
// Bad: inserting content above existing content causes massive CLS
const Banner = ({ show }) => show
  ? <div className="promo-banner">Free shipping this weekend!</div>
  : null;

// Insert at top of page AFTER render: shifts everything down = high CLS

// Good: reserve space so shift does not occur
const Banner = ({ show }) => (
  <div
    className="promo-banner"
    style={{
      height:     "48px",
      visibility: show ? "visible" : "hidden",
      // Space is always reserved — no layout shift when content appears
    }}
  >
    {show && "Free shipping this weekend!"}
  </div>
);

// Good: append at bottom — user has already seen above-fold content
// Toast notifications, cookie banners — anchor to bottom of screen
// position: fixed bottom: 0 — does not affect document flow
```

### Skeleton Screens — Prevent CLS from Dynamic Content

```tsx
// Skeleton prevents CLS from data loading in
// because the space is reserved with the right dimensions

const UserCardSkeleton = () => (
  <div className="user-card" aria-busy="true" aria-label="Loading user">
    <div className="skeleton avatar" style={{ width: 48, height: 48, borderRadius: "50%" }} />
    <div className="skeleton-lines">
      <div className="skeleton line" style={{ width: "60%", height: 16 }} />
      <div className="skeleton line" style={{ width: "40%", height: 12, marginTop: 8 }} />
    </div>
  </div>
);

// CSS for skeleton animation — no layout shift version
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-muted) 25%,
    var(--color-bg-emphasis) 50%,
    var(--color-bg-muted) 75%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-component-sm);
}

@media (prefers-reduced-motion: no-preference) {
  .skeleton { animation: shimmer 1.5s infinite; }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Phase 8: INP — Interaction Responsiveness

INP replaced FID in March 2024. It measures how responsive the page is to ALL interactions, not just the first one. Poor INP feels like a laggy, unresponsive app even if it loads fast.

### Find Long Tasks

```javascript
// Long tasks — JS execution > 50ms blocks the main thread
// This prevents the browser from responding to user input

new PerformanceObserver((list) => {
  list.getEntries().forEach(entry => {
    if (entry.duration > 50) {
      console.warn("Long task:", {
        duration: Math.round(entry.duration) + "ms",
        start:    Math.round(entry.startTime) + "ms",
        // For attribution in Chrome 112+:
        scripts:  entry.scripts?.map(s => ({ name: s.sourceURL, fn: s.functionName })),
      });
    }
  });
}).observe({ type: "longtask", buffered: true });
```

### Break Up Long Tasks

```typescript
// Bad: one long synchronous operation blocks the main thread
function processLargeDataset(items: Item[]) {
  // 200ms of synchronous work — blocks all input during this time
  return items
    .filter(expensiveFilter)
    .map(expensiveTransform)
    .sort(expensiveSort);
}

// Good: yield to browser between chunks
async function processLargeDataset(items: Item[]) {
  const CHUNK_SIZE = 100;
  const results: Item[] = [];

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    results.push(...chunk.filter(expensiveFilter).map(expensiveTransform));

    // Yield — let browser handle pending input events before next chunk
    await scheduler.yield();
    // Fallback for older browsers:
    // await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results.sort(expensiveSort);
}

// scheduler.yield() — new API (Chrome 115+)
// More semantically correct than setTimeout(0)
// Tells browser "I am yielding, prioritize pending tasks"
```

### Debounce and Throttle Frequent Events

```typescript
// Bad: runs expensive operation on every keystroke
<input onChange={e => runExpensiveSearch(e.target.value)} />

// Good: debounce — waits until user stops typing
import { useDeferredValue, useState } from "react";

const SearchInput = () => {
  const [query,    setQuery]   = useState("");
  const deferredQuery = useDeferredValue(query); // built-in React debounce

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {/* Results render with deferred value — typing stays responsive */}
      <SearchResults query={deferredQuery} />
    </>
  );
};

// For non-React contexts — manual debounce
function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

// Throttle — for scroll/resize handlers
function throttle<T extends (...args: unknown[]) => unknown>(fn: T, ms: number) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

const onScroll  = throttle(handleScroll,  16);  // ~60fps
const onResize  = throttle(handleResize, 100);
window.addEventListener("scroll", onScroll,  { passive: true });
window.addEventListener("resize", onResize);
```

### React startTransition — Mark Non-Urgent Updates

```tsx
import { startTransition, useTransition } from "react";

// Mark state updates as non-urgent — browser can interrupt them
// to handle user input, keeping interactions responsive
const [isPending, startTransition] = useTransition();

const handleTabChange = (tab: string) => {
  // Urgent: update which tab appears selected immediately
  setSelectedTab(tab);

  // Non-urgent: render tab content — can be interrupted
  startTransition(() => {
    setTabContent(heavyContent[tab]);
  });
};

// isPending = true while transition is in progress
// Use to show a loading indicator in the background
{isPending && <Spinner className="absolute top-2 right-2" />}
```

---

## Phase 9: React-Specific Performance

React rerenders are not inherently expensive. A component that rerenders in < 1ms is irrelevant to performance. Optimize React when profiling shows a specific component causing > 16ms renders (one frame).

### Profile Before Optimizing

```
React DevTools Profiler — the right way to find React performance issues:

1. Install React DevTools browser extension
2. Open DevTools → Profiler tab
3. Click "Record"
4. Perform the slow interaction
5. Click "Stop"
6. Look for:
   - Bars > 16ms (one frame = one drop)
   - Components that rerender when they should not
   - The "Why did this render?" (click a bar, see "Why did this render?")

Do NOT optimize components that:
  Render in < 1ms
  Rerender rarely
  Are not in a list or table
  Are not causing visible jank

DO optimize components that:
  Take > 16ms to render
  Rerender dozens of times per user interaction
  Are rendered in lists of 100+ items
```

### React.memo — When It Actually Helps

```tsx
// React.memo prevents rerender when props have not changed
// ONLY worth it when:
//   1. Component renders expensively (> 1ms)
//   2. Parent rerenders frequently
//   3. Props are stable (primitives or memoized objects)

// Bad use of memo — child renders in < 0.1ms, memo overhead exceeds benefit
const SimpleLabel = React.memo(({ text }: { text: string }) => (
  <span>{text}</span>
));

// Good use of memo — expensive list item, parent rerenders on every keystroke
const DataRow = React.memo(
  ({ row, onSelect }: { row: Row; onSelect: (id: string) => void }) => {
    // Imagine this renders a complex row with many cells
    return (
      <tr onClick={() => onSelect(row.id)}>
        {row.cells.map(cell => <td key={cell.id}>{cell.value}</td>)}
      </tr>
    );
  },
  // Custom comparison — only rerender if id or cells change
  (prev, next) => prev.row.id === next.row.id
    && prev.row.cells === next.row.cells
    && prev.onSelect === next.onSelect
);
```

### useMemo and useCallback — The Rules

```tsx
// useMemo: memoize expensive computation result
// ONLY worth it when:
//   The computation is genuinely expensive (> 1ms measured)
//   Dependencies are stable

// Bad: memoizing trivial computation — memo overhead > computation
const count = useMemo(() => items.length, [items]);        // never do this
const doubled = useMemo(() => value * 2, [value]);         // never do this
const filtered = useMemo(() => items.filter(Boolean), [items]); // probably not worth it

// Good: genuinely expensive computation
const expensiveStats = useMemo(() => {
  // This actually takes > 5ms — worth memoizing
  return computeRegressionAnalysis(dataPoints);
}, [dataPoints]);

// Good: stable reference for memo'd child (the main use case)
const memoizedData = useMemo(
  () => rawData.map(transformItem),
  [rawData]
);
// Now DataGrid does not rerender when parent rerenders for other reasons
<DataGrid data={memoizedData} />;

// useCallback: memoize function reference
// ONLY worth it when passing callbacks to memo'd children

// Bad: useCallback on function not passed to memo'd child
const handleClick = useCallback(() => setCount(c => c + 1), []);

// Good: callback passed to memo'd child — prevents child rerender
const handleRowSelect = useCallback(
  (id: string) => setSelectedId(id),
  [] // stable — no deps
);
<DataRow row={row} onSelect={handleRowSelect} />;

// Rule of thumb:
//   If you remove memo/useMemo/useCallback and nothing measurably slows down
//   in the profiler, the optimization was not worth the complexity cost.
```

### Virtualization — The Real Fix for Long Lists

```tsx
// When a list has > 100 items and renders slowly:
// DO NOT React.memo every item — you are still rendering 1000 DOM nodes
// DO virtualize — only render items in the viewport

// TanStack Virtual — lightweight, headless virtualization
import { useVirtualizer } from "@tanstack/react-virtual";

const VirtualList = ({ items }: { items: Item[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count:           items.length,
    getScrollElement: () => parentRef.current,
    estimateSize:    () => 64,         // estimated row height in px
    overscan:        5,                // render 5 extra items above/below viewport
  });

  return (
    <div
      ref={parentRef}
      style={{ height: "600px", overflow: "auto" }}
    >
      {/* Total height spacer — makes scrollbar correct size */}
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position:  "absolute",
              top:       virtualItem.start,
              left:      0,
              width:     "100%",
              height:    virtualItem.size,
            }}
          >
            <ListItem item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};

// react-window — simpler API for fixed-size lists
import { FixedSizeList } from "react-window";

const SimpleVirtualList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={64}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <ListItem item={items[index]} />
      </div>
    )}
  </FixedSizeList>
);

// When to virtualize:
//   > 100 items AND list is visibly slow in profiler
//   Infinite scroll feeds
//   Data tables with 1000+ rows
//   NOT needed for < 100 items in most cases
```

### Context — Why It Causes Rerenders and How to Fix It

```tsx
// Problem: every context value change rerenders ALL consumers
// Even if the consumer only uses one value from the context

// Bad: one context with all app state
const AppContext = createContext({ user, theme, cart, notifications });
// Every notification update rerenders every user/theme consumer

// Good: split contexts by update frequency
const UserContext        = createContext<User | null>(null);
const ThemeContext        = createContext<"light" | "dark">("light");
const CartContext         = createContext<Cart>({ items: [], total: 0 });
const NotificationContext = createContext<Notification[]>([]);

// Good: memoize context value to prevent unnecessary rerenders
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Without useMemo: new object every render = all consumers rerender
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Good: Zustand instead of context for frequently-updating state
// Zustand uses subscriptions — only components using the changed value rerender
import { create } from "zustand";

const useNotificationStore = create<NotificationState>(set => ({
  notifications: [],
  add:    n  => set(s => ({ notifications: [...s.notifications, n] })),
  remove: id => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}));

// Only this component rerenders when notifications change
// Not the entire tree under a context provider
const NotificationCount = () => {
  const count = useNotificationStore(s => s.notifications.length);
  return <span>{count}</span>;
};
```

---

## Phase 10: Next.js Performance — Rendering Strategies

### Choose the Right Rendering Strategy

```
Static Generation (SSG) — the default, fastest possible
  When: content does not change per request (marketing, blog, docs)
  How:  export default function Page() {} — no async, no fetch
  Result: HTML generated at build time, served from CDN, zero server time

Incremental Static Regeneration (ISR) — static with periodic updates
  When: content changes occasionally (product pages, news)
  How:
    // App Router
    fetch(url, { next: { revalidate: 60 } })  // regenerate every 60s
    // or: export const revalidate = 60;

    // On-demand revalidation (when data changes):
    import { revalidatePath, revalidateTag } from "next/cache";
    revalidatePath("/products");

Server-Side Rendering (SSR) — render per request
  When: content is personalized or must be fresh (dashboard, user data)
  How:
    // App Router — any async Server Component is SSR
    async function Page() {
      const data = await fetch(url, { cache: "no-store" });
      return <Component data={data} />;
    }
  Cost: adds server latency — every request hits your server

React Server Components (RSC) — server-only by default in App Router
  When: components that fetch data but have no interactivity
  Benefit: zero JS sent to browser for server components
  How:
    // Default — runs on server, sends HTML only
    async function ProductCard({ id }) {
      const product = await db.products.find(id);
      return <div>{product.name}</div>;   // no JS in bundle
    }

    // Client component — has interactivity, sends JS
    "use client";
    function AddToCart({ productId }) {
      const [added, setAdded] = useState(false);
      return <button onClick={() => setAdded(true)}>Add to cart</button>;
    }

  Rule: push "use client" as deep in the tree as possible
  Goal: server components for layout/data, client components for interaction only
```

### Streaming — Fix Slow TTI

```tsx
// Without streaming: page waits for ALL data before sending HTML
// With streaming: page sends HTML progressively as data becomes available
// Result: users see content sooner even on slow data

// app/dashboard/page.tsx
import { Suspense } from "react";

// This page streams — fast parts render immediately
export default function DashboardPage() {
  return (
    <main>
      {/* Static header — renders immediately */}
      <DashboardHeader />

      {/* Suspense boundaries — stream independently */}
      <div className="grid grid-cols-3 gap-4">
        <Suspense fallback={<MetricSkeleton />}>
          <RevenueMetric />      {/* fetches from DB */}
        </Suspense>

        <Suspense fallback={<MetricSkeleton />}>
          <OrderMetric />        {/* fetches from DB */}
        </Suspense>

        <Suspense fallback={<MetricSkeleton />}>
          <CustomerMetric />     {/* fetches from DB */}
        </Suspense>
      </div>

      {/* This streams separately — does not block metrics */}
      <Suspense fallback={<TableSkeleton />}>
        <RecentOrdersTable />    {/* slow query */}
      </Suspense>
    </main>
  );
}

// Each Suspense child is a separate async Server Component
async function RevenueMetric() {
  const revenue = await db.getRevenue();  // runs in parallel with other fetches
  return <MetricCard value={revenue} label="Revenue" />;
}

// Parallel data fetching — do not await sequentially
async function DashboardData() {
  // Bad: sequential — total time = sum of all queries
  const revenue = await getRevenue();
  const orders  = await getOrders();

  // Good: parallel — total time = slowest query only
  const [revenue, orders] = await Promise.all([getRevenue(), getOrders()]);
}
```

### Next.js Caching Layers

```typescript
// Understanding Next.js App Router cache layers

// 1. Request Memoization — automatic within one request
//    Same fetch URL called twice in one render = one actual request
async function Page() {
  // Both calls hit the same memoized result — one HTTP request
  const user = await getUser(id);
  const data = await getPageData(id); // internally calls getUser(id) again — cached
}

// 2. Data Cache — persists across requests (server-side)
fetch(url, { cache: "force-cache" });   // cache indefinitely (default for static)
fetch(url, { cache: "no-store" });      // never cache (SSR behavior)
fetch(url, { next: { revalidate: 60 }}); // revalidate every 60 seconds

// 3. Full Route Cache — cached HTML of static routes (build time)
// Automatic for static pages — served from CDN

// 4. Router Cache — client-side cache of visited routes
// Automatic — navigating back to a page uses cached version

// Granular cache tags — invalidate specific data
fetch(url, { next: { tags: ["products", `product-${id}`] }});
// In server action or API route:
revalidateTag("products");      // invalidates all product fetches
revalidateTag(`product-${id}`); // invalidates one product
```

---

## Phase 11: Animation Performance

Janky animations are one of the most visible performance problems. The cause is almost always animating properties that trigger layout or paint instead of using the compositor.

### The Compositor Thread — Why It Matters

```
Browser rendering pipeline:
  JavaScript → Style → Layout → Paint → Composite

Each step can trigger the ones after it:
  Changing width/height/top/left   → Layout + Paint + Composite (slow)
  Changing background-color/color  → Paint + Composite (medium)
  Changing transform/opacity       → Composite only (fast, on GPU)

Rule: ONLY animate transform and opacity for smooth 60fps animation
      These bypass Layout and Paint — handled entirely by GPU compositor

Fast (compositor-only, 60fps):
  transform: translateX, translateY, scale, rotate
  opacity
  filter (with hardware acceleration)

Slow (triggers layout — causes jank):
  top, left, right, bottom
  width, height, margin, padding
  font-size, line-height

Medium (triggers paint):
  background-color, color, border-color
  box-shadow
```

```css
/* Bad: animates top/left — triggers layout on every frame */
.card:hover {
  transition: top 0.2s, left 0.2s;
  top:  -4px;
  left: -4px;
}

/* Good: animates transform — compositor only, 60fps */
.card:hover {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  transform:  translateY(-4px);
}

/* Bad: animates width for expand/collapse */
.panel {
  transition: height 0.3s;
  height: 0;
  overflow: hidden;
}
.panel.open { height: 200px; }

/* Good: use transform: scaleY or max-height (less bad) */
/* Best: use CSS @starting-style + transition-behavior: allow-discrete */
/* Or: JS with Web Animations API + transform */

/* will-change — hints browser to promote to compositor layer */
/* Use SPARINGLY — each layer consumes GPU memory */
.animated-element {
  will-change: transform; /* only when animation is about to happen */
}
/* Remove after animation completes to free GPU memory */

/* Better: let browser decide with contain: layout */
.animation-container {
  contain: layout style; /* isolates layout impact */
}
```

### requestAnimationFrame — JS Animations

```typescript
// Bad: setInterval for animations — not synchronized with paint
let pos = 0;
setInterval(() => {
  element.style.left = (pos++) + "px"; // triggers layout every 16ms
}, 16);

// Good: requestAnimationFrame — synchronized with browser paint
let pos = 0;
let rafId: number;

function animate(timestamp: number) {
  pos += 2;
  element.style.transform = `translateX(${pos}px)`; // compositor only
  rafId = requestAnimationFrame(animate);
}

rafId = requestAnimationFrame(animate);

// Cleanup — always cancel on unmount
cancelAnimationFrame(rafId);

// React hook for rAF animations
function useAnimationFrame(callback: (deltaTime: number) => void, isRunning: boolean) {
  const rafRef  = useRef<number>(0);
  const prevRef = useRef<number>(0);

  useEffect(() => {
    if (!isRunning) return;

    const animate = (time: number) => {
      const delta = time - prevRef.current;
      prevRef.current = time;
      callback(delta);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [callback, isRunning]);
}
```

---

## Phase 12: Memory Leaks — Detection and Prevention

Memory leaks in long-running apps cause progressive slowdown and crashes. They are invisible until they become severe.

### Common Sources of Memory Leaks

```typescript
// ─── Leak 1: Event listeners not removed ─────────
// Bad: adds listener every render, never removes
useEffect(() => {
  window.addEventListener("resize", handleResize);
  // Missing cleanup — listener accumulates with every render
});

// Good: cleanup in effect return
useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);  // run once, cleanup on unmount

// ─── Leak 2: Timers not cleared ───────────────────
// Bad: interval runs forever, keeps reference to component
useEffect(() => {
  const interval = setInterval(poll, 5000);
  // Missing cleanup — interval keeps component alive after unmount
});

// Good: clear on unmount
useEffect(() => {
  const interval = setInterval(poll, 5000);
  return () => clearInterval(interval);
}, []);

// ─── Leak 3: Async operations completing after unmount ─
// Bad: sets state after component unmounts — React error + potential leak
useEffect(() => {
  fetchData().then(data => setData(data));
  // If component unmounts before fetch completes: error + possible leak
});

// Good: AbortController cancels pending requests on unmount
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal })
    .then(data => setData(data))
    .catch(err => {
      if (err.name !== "AbortError") throw err;
    });

  return () => controller.abort();
}, []);

// ─── Leak 4: WebSocket / SSE not closed ──────────
useEffect(() => {
  const ws = new WebSocket("wss://api.example.com/live");
  ws.onmessage = e => setMessages(m => [...m, JSON.parse(e.data)]);

  return () => ws.close(); // must close on unmount
}, []);

// ─── Leak 5: Observable / subscription not unsubscribed ─
useEffect(() => {
  const sub = observable$.subscribe(value => setState(value));
  return () => sub.unsubscribe();
}, []);

// ─── Leak 6: Closures capturing large objects ─────
// Bad: event handler closure captures entire large array
const LargeList = ({ items }) => {  // items: 10,000 element array
  useEffect(() => {
    const handler = () => {
      console.log(items.length); // closure captures items
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [items]); // if items reference changes, old listener + old items stay alive briefly
};
```

### Detecting Memory Leaks in DevTools

```
Chrome DevTools Memory panel:

Method 1: Heap Snapshot
  1. Take snapshot (before action)
  2. Perform action (navigate, open/close dialog, etc.)
  3. Take snapshot (after action)
  4. Select "Comparison" view between snapshots
  5. Look for: objects with + delta that should have been GC'd

Method 2: Allocation Timeline
  1. Select "Allocation instrumentation on timeline"
  2. Start recording
  3. Perform the leaking action several times
  4. Stop recording
  5. Look for: blue bars that never get GC'd (never turn grey)

Method 3: Quick heap check
  In console: performance.memory (Chrome only)
  Watch usedJSHeapSize over time
  If it grows monotonically without leveling off, there is a leak

Signs of a memory leak in production:
  - Page gets slower the longer it is open
  - Browser tab uses ever-increasing RAM (check Task Manager)
  - Performance degrades after navigating many routes
  - Crash after extended use
```

---

## Phase 13: Network Optimization

### Resource Hints — Start Things Early

```html
<head>
  <!-- dns-prefetch: resolve DNS for external domains early -->
  <!-- Cost: ~20-120ms per domain on first connection -->
  <link rel="dns-prefetch" href="https://fonts.gstatic.com">
  <link rel="dns-prefetch" href="https://api.example.com">

  <!-- preconnect: DNS + TCP + TLS handshake early -->
  <!-- Use for critical external resources (fonts, API) -->
  <!-- Only 2-3 domains max — each consumes network resources -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- preload: highest priority fetch for critical resources -->
  <!-- Use for: LCP image, critical fonts, above-fold CSS -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/hero.jpg" as="image" fetchpriority="high">

  <!-- prefetch: low priority fetch for next navigation resources -->
  <!-- Use for: likely next page, lazy-loaded chunks -->
  <link rel="prefetch" href="/dashboard.js" as="script">

  <!-- prerender: full page prerender (Chrome only, expensive) -->
  <!-- Only for near-certain next navigation -->
  <link rel="prerender" href="/dashboard">

  Priority order: preconnect > preload > prefetch > prerender (by urgency)
  preconnect = "I will need this domain soon"
  preload    = "I will need this file on this page"
  prefetch   = "I might need this file on the next page"
</head>
```

### HTTP Caching Headers

```
Cache-Control strategies:

Immutable assets (JS/CSS with content hash in filename):
  Cache-Control: public, max-age=31536000, immutable
  Rationale: filename changes when content changes, so can cache forever

HTML pages (never cache — always check for updates):
  Cache-Control: no-cache
  Rationale: "no-cache" means "revalidate before using" — NOT "do not cache"
  Note: "no-store" means truly never cache (rare use case)

API responses (short cache, revalidate):
  Cache-Control: public, max-age=60, stale-while-revalidate=300
  Rationale: serve stale for 300s while revalidating in background

User-specific data:
  Cache-Control: private, max-age=300
  Rationale: private = CDN does not cache, browser does

Static assets without hash (images, fonts without versioning):
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  Rationale: fresh for 1 day, serve stale for 1 week while revalidating

Cloudflare / CDN specific:
  Vary: Accept-Encoding   — serve different responses for gzip vs br
  Vary: Accept            — serve different format per Accept header (WebP)
```

### Compression

```
Brotli vs Gzip:
  Brotli (br):  20-26% better compression than gzip, supported in all modern browsers
  Gzip:         universal fallback

Enable in Next.js (already on by default):
  // next.config.ts
  export default { compress: true }; // enables gzip — br requires reverse proxy

Enable Brotli in Nginx:
  brotli on;
  brotli_comp_level 6;
  brotli_types text/html text/css application/javascript application/json;

Size targets after compression:
  HTML: < 15KB gzipped
  CSS:  < 30KB gzipped
  JS initial bundle: < 100KB gzipped
  Fonts: serve woff2 (already compressed — do not gzip woff2)
```

---

## Phase 14: Performance Budgets and CI Enforcement

Measuring performance once is not a performance culture. Without budgets and enforcement, performance regresses with every feature.

### Define Budgets

```javascript
// lighthouse-budget.json — enforced in CI
[
  {
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-paint",  "budget": 1500 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "total-blocking-time",      "budget": 200  },
      { "metric": "cumulative-layout-shift",  "budget": 0.1  }
    ],
    "resourceSizes": [
      { "resourceType": "script",     "budget": 200 },
      { "resourceType": "total",      "budget": 800 },
      { "resourceType": "image",      "budget": 400 },
      { "resourceType": "stylesheet", "budget": 50  },
      { "resourceType": "font",       "budget": 100 }
    ],
    "resourceCounts": [
      { "resourceType": "third-party", "budget": 10 }
    ]
  }
]
```

### CI Enforcement — GitHub Actions

```yaml
# .github/workflows/performance.yml
name: Performance

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: npm ci && npm run build

      - name: Start server
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: ./lighthouserc.json
          budgetPath:  ./lighthouse-budget.json
          uploadArtifacts: true
          temporaryPublicStorage: true
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```javascript
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000", "http://localhost:3000/dashboard"],
      "numberOfRuns": 3
    },
    "assert": {
      "budgetFile": "./lighthouse-budget.json",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "uses-rel-preconnect": "warn",
        "render-blocking-resources": ["error", { "maxLength": 0 }],
        "uses-optimized-images": "warn",
        "uses-webp-images": "warn"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### Bundle Size CI — Catch Regressions Before Merge

```yaml
# Add to GitHub Actions — fails PR if bundle grows > threshold
- name: Check bundle size
  uses: andresz1/size-limit-action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

```javascript
// .size-limit.json
[
  {
    "name":    "Initial JS",
    "path":    ".next/static/chunks/pages/index*.js",
    "limit":   "100 KB",
    "gzip":    true
  },
  {
    "name":    "Total CSS",
    "path":    ".next/static/css/*.css",
    "limit":   "30 KB",
    "gzip":    true
  }
]
```

---

## Phase 15: CSS Performance

### Remove Unused CSS

```bash
# PurgeCSS — removes unused CSS classes from production build
npm install @fullhuman/postcss-purgecss

# postcss.config.js
module.exports = {
  plugins: [
    process.env.NODE_ENV === "production" &&
      require("@fullhuman/postcss-purgecss")({
        content:  ["./src/**/*.{html,jsx,tsx}"],
        defaultExtractor: content =>
          content.match(/[\w-/:]+(?<!:)/g) || [],
      }),
  ],
};

# Tailwind already does this automatically with content config
# Just ensure content paths are correct — zero unused CSS in production

# Check unused CSS with DevTools Coverage panel:
# 1. Open DevTools → Cmd+Shift+P → "Coverage"
# 2. Reload page
# 3. Sort by "Unused Bytes"
# Target: < 10% unused CSS on any given page
```

### CSS Containment

```css
/* contain: layout — browser does not need to check outside element for layout impact */
/* Significant perf win for complex components that update frequently */

.data-table {
  contain: layout;          /* isolate layout calculations */
}

.widget {
  contain: layout style;    /* isolate layout + style recalc */
}

.isolated-component {
  contain: strict;          /* layout + style + paint + size */
  /* Most isolated — use for completely self-contained widgets */
}

/* content-visibility: auto — skip rendering off-screen content */
/* Huge win for long pages with many sections */
.page-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 600px; /* estimated height to prevent CLS */
}
/* Browser skips rendering this until it approaches the viewport */
/* Up to 7x rendering improvement on long content pages */
```

---

## Anti-Patterns: The Performance Hall of Shame

| Do Not | Do Instead |
|---|---|
| Optimize before measuring | Profile first, fix the bottleneck identified by data |
| Add React.memo everywhere | Profile first — use memo only where profiler shows > 1ms renders |
| Chase Lighthouse score without fixing field data | Fix PageSpeed Insights (CrUX) — that is what real users and Google see |
| Lazy-load the LCP image | `priority` / `fetchpriority="high"` / `loading="eager"` on LCP image |
| `loading="lazy"` on above-fold images | Only lazy-load below-fold images |
| Load Google Tag Manager synchronously | `strategy="afterInteractive"` or Partytown worker |
| No `width`/`height` on images | Always set both — prevents CLS |
| Animate `top`/`left`/`width` | Animate `transform` and `opacity` only — compositor thread |
| Import entire lodash | Import specific functions or use native JavaScript equivalents |
| Use Moment.js | date-fns (tree-shakeable) or dayjs (2KB) |
| No code splitting on heavy routes | `dynamic()` or `React.lazy()` for routes and heavy components |
| No `font-display: swap` on custom fonts | Always set `font-display: swap` + preload critical font |
| Fonts without size-adjust | Fonts shift layout on swap — size-adjust makes fallback same size |
| Sequential `await` for parallel data | `Promise.all([...])` for independent queries |
| Every context update rerenders entire tree | Split contexts by update frequency, memoize provider values |
| Render 1000 list items in DOM | Virtualize with TanStack Virtual or react-window |
| useEffect without cleanup | Always return cleanup for event listeners, timers, subscriptions |
| No performance budget in CI | Lighthouse CI + size-limit — fail the PR, not the user |
| `will-change` on everything | Use sparingly — each promoted layer consumes GPU memory |
| No SSG/ISR for static content | Static pages serve from CDN — fastest possible response |

---

## Pre-Ship Performance Checklist

### Measurement
- [ ] Baseline measured with PageSpeed Insights (field data, not just lab)
- [ ] Lighthouse run 3x and averaged — not trusting a single run
- [ ] LCP element identified (DevTools Performance or Lighthouse)
- [ ] Long tasks identified if INP is poor (DevTools Performance panel)
- [ ] Bundle analyzed (ANALYZE=true npm run build)

### LCP
- [ ] LCP image preloaded (`<link rel="preload">` or Next.js `priority`)
- [ ] LCP image has `fetchpriority="high"` and `loading="eager"`
- [ ] LCP image served as WebP or AVIF
- [ ] LCP image sized correctly for viewport (not 3000px on mobile)
- [ ] TTFB under 800ms (CDN configured, no DB queries in critical path)

### CLS
- [ ] All images have explicit `width` and `height` attributes
- [ ] Custom fonts use `font-display: swap` + `size-adjust` on fallback
- [ ] No content inserted above existing above-fold content
- [ ] Dynamic content has reserved space or appears below fold

### INP
- [ ] No long tasks > 50ms in critical interaction path (measured)
- [ ] Frequent events (scroll, resize, input) are debounced/throttled
- [ ] `startTransition` used for non-urgent state updates
- [ ] Third-party scripts not competing for main thread during interactions

### JavaScript
- [ ] Bundle analyzed — no unexpectedly large dependencies
- [ ] Heavy routes/components use `dynamic()` or `React.lazy()`
- [ ] Lodash/Moment/large libraries replaced or tree-shaken
- [ ] Third-party scripts use `strategy="afterInteractive"` or `lazyOnload`
- [ ] No unused JavaScript > 50KB on any page (DevTools Coverage)

### Images
- [ ] All images served as WebP or AVIF
- [ ] All images have correct `srcset` and `sizes`
- [ ] All below-fold images have `loading="lazy"`
- [ ] No image larger than necessary for its displayed size

### Fonts
- [ ] Fonts are self-hosted or use Next.js `next/font`
- [ ] Critical font weight preloaded
- [ ] `font-display: swap` on all @font-face
- [ ] Fallback font has `size-adjust` to prevent CLS

### Network
- [ ] `preconnect` for critical external domains (max 3)
- [ ] Immutable assets (with hash) have `max-age=31536000, immutable`
- [ ] HTML has `no-cache` (revalidate, not cache-forever)
- [ ] Brotli compression enabled on server/CDN

### CSS
- [ ] No unused CSS in production (PurgeCSS or Tailwind content config)
- [ ] No render-blocking stylesheets (critical CSS inlined or preloaded async)

### Animation
- [ ] Only `transform` and `opacity` animated (no layout-triggering properties)
- [ ] `will-change` used sparingly and removed after animation
- [ ] `prefers-reduced-motion` respected

### Memory
- [ ] All `useEffect` event listeners have cleanup
- [ ] All `useEffect` timers/intervals have cleanup
- [ ] All `useEffect` async operations use AbortController
- [ ] All WebSocket / subscription cleanups verified

### CI Enforcement
- [ ] Lighthouse CI configured — PR fails below score threshold
- [ ] Bundle size limit configured — PR fails if bundle grows unexpectedly
- [ ] Web Vitals reporting to analytics in production

---

## Quick Reference: Decision Tree

```
Page is slow — where do I start?

Step 1: Measure
  Run PageSpeed Insights → what is the failing metric?

LCP > 2.5s?
  What is the LCP element? (Lighthouse audit or DevTools console observer)
  Is it an image?
    -> Add fetchpriority="high" + loading="eager" + preload link
    -> Convert to WebP/AVIF
    -> Ensure srcset serves correct size for viewport
    -> Check TTFB — if > 800ms, CDN and caching problem
  Is it a text block?
    -> Font loading delay — add font preload + font-display: swap

CLS > 0.1?
  Images without width/height?  -> Add explicit dimensions
  Font swap causing shift?       -> Add size-adjust to fallback font face
  Content injected above fold?   -> Reserve space or move to below fold

INP > 200ms?
  Find long tasks in DevTools Performance panel
  Long task in event handler?    -> Break up with scheduler.yield()
  Expensive React render?        -> Profile in React DevTools Profiler
                                    -> startTransition for non-urgent updates
                                    -> Virtualize if it is a long list
  Third-party script blocking?   -> Move to afterInteractive / Partytown

Bundle too large?
  Run bundle analyzer
  Large library?                 -> Find smaller alternative or lazy-load
  Code splitting missing?        -> dynamic() or React.lazy() for heavy routes
  Unused code?                   -> DevTools Coverage panel

Still slow after fixing the above?
  Check network waterfall (WebPageTest)
  Check render-blocking resources (Lighthouse)
  Check third-party scripts (console script inventory)
  Check memory usage over time (DevTools Memory panel)
```

---

> **Performance is not a feature you add before launch. It is a discipline you build into the process — measuring in production, catching regressions in CI, and always fixing the thing the data shows is actually slow rather than the thing that feels like it should be slow. The biggest wins are almost never where you think they are.**
