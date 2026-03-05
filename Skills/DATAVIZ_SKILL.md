# Data Visualization Skill — Production Grade

## When to Use
Trigger this skill for any request involving:
- Charts, graphs, plots, or diagrams from data
- Dashboards with multiple data views
- CSV, JSON, or tabular data that needs to be visualized
- Comparisons, trends, distributions, or relationships in data
- Infographics, reports, or data storytelling
- Real-time or interactive data displays

---

## Phase 1: Understand the Data and the Question

Data visualization is **applied communication**, not decoration. Every decision must serve the question the data is answering.

Before touching a library or choosing a chart type, answer:

- **What is the question?** "Show me sales over time" and "show me which product is underperforming" are different questions that require different charts.
- **Who is the audience?** An analyst wants raw detail and interactivity. An executive wants a single clear takeaway in 5 seconds. A general public audience needs zero jargon.
- **What type of data is it?**
  - *Quantitative* — numerical, measurable (revenue, temperature, age)
  - *Categorical* — named groups (country, product category, status)
  - *Temporal* — time-based (dates, timestamps, durations)
  - *Relational* — connections between entities (networks, hierarchies)
  - *Geographical* — location-based (countries, coordinates, regions)
- **What is the insight?** The chart should make one thing unmistakably clear. If you can't state the insight in one sentence, the chart isn't ready.
- **How much data?** 5 data points vs. 50,000 require completely different approaches.

> **Rule:** A chart that requires explanation has failed. Design until the insight is self-evident.

---

## Phase 2: Choose the Right Chart Type

This is the most common failure point. The wrong chart type actively misleads readers.

### The Chart Selection Framework

**To show CHANGE OVER TIME:**
| Goal | Chart Type | Notes |
|---|---|---|
| One metric over time | Line chart | The default for time series. Never use bar for smooth trends. |
| Multiple metrics over time | Multi-line chart | Max 5–6 lines before it becomes unreadable |
| Part-to-whole over time | Stacked area chart | Good for composition change; avoid if values are close |
| Discrete time periods | Bar chart (vertical) | Use when periods are few and comparison matters |
| Cumulative growth | Area chart | Fill under line shows volume |

**To show COMPARISON:**
| Goal | Chart Type | Notes |
|---|---|---|
| Compare values across categories | Bar chart (vertical) | Best default for most comparisons |
| Many categories, long labels | Bar chart (horizontal) | Easier to read long category names |
| Ranking | Sorted horizontal bar | Always sort — unsorted bars are almost useless |
| Two variables compared | Scatter plot | Reveals correlation instantly |
| Before/after comparison | Paired bar or slope chart | Slope charts are underused and very powerful |

**To show PART-TO-WHOLE:**
| Goal | Chart Type | Notes |
|---|---|---|
| Simple proportion (2–5 parts) | Donut chart | Never use pie chart — donut center can carry a KPI value |
| Many parts | Treemap | Good for hierarchical proportions |
| 100% composition | Stacked bar (100%) | Better than pie for comparing composition across groups |
| Avoid | Pie chart | Hard to compare slices accurately. Use sparingly, max 4 slices. |

**To show DISTRIBUTION:**
| Goal | Chart Type | Notes |
|---|---|---|
| Shape of data spread | Histogram | Use for continuous data; choose bin size carefully |
| Distribution + outliers | Box plot | Excellent for comparing distributions across groups |
| Distribution with density | Violin plot | More informative than box plot for large datasets |
| Spread across two variables | Scatter plot | Add trend line for correlation |

**To show RELATIONSHIPS:**
| Goal | Chart Type | Notes |
|---|---|---|
| Correlation between two variables | Scatter plot | Add regression line if appropriate |
| Correlation matrix | Heatmap | Color encodes correlation strength |
| Network/connections | Force-directed graph (D3) | Only when relationships are the actual story |
| Hierarchy | Sunburst or treemap | Good for nested categories |

**To show GEOGRAPHIC DATA:**
| Goal | Chart Type | Notes |
|---|---|---|
| Value by region | Choropleth map | Use sequential or diverging color scale |
| Point data | Bubble map | Size encodes quantity |
| Flow / movement | Flow map | Arrows/curves between locations |

### Hard Rules on Chart Selection
- **Never use 3D charts** — the perspective distorts values and misleads readers. Always.
- **Never use pie charts with more than 5 slices** — use a sorted bar chart instead.
- **Never use dual-axis charts** unless the two metrics are directly and meaningfully related — they are almost always misleading.
- **Never use radar/spider charts** for most comparisons — bar charts communicate the same thing more clearly.

---

## Phase 3: Data Preparation

Garbage in, garbage out. Clean data before visualizing it.

### Always Check For:
- **Missing values** — decide: omit, interpolate, or show as gaps? Never silently drop without noting it.
- **Outliers** — are they errors or meaningful? Don't remove without flagging it.
- **Inconsistent formats** — date formats, capitalization, units (km vs miles, USD vs EUR)
- **Correct data types** — dates parsed as dates, numbers as numbers, not strings
- **Aggregation level** — raw rows vs. grouped vs. summarized: choose what the question requires

### Data Shaping Patterns

```javascript
// Group and aggregate
const grouped = d3.rollup(data, v => d3.sum(v, d => d.value), d => d.category);

// Sort for ranked charts (always sort bar charts)
const sorted = data.sort((a, b) => b.value - a.value);

// Normalize to percentage (for 100% stacked)
const total = d3.sum(data, d => d.value);
const normalized = data.map(d => ({ ...d, pct: d.value / total }));

// Time parsing
const parseDate = d3.timeParse("%Y-%m-%d");
data.forEach(d => { d.date = parseDate(d.date); });
```

---

## Phase 4: Visual Encoding Hierarchy

Not all visual channels communicate with equal accuracy. Use stronger channels for more important data.

**From most to least accurate (Cleveland & McGill, 1984):**

1. **Position** (x/y axis) — most accurate. Use for the most important comparison.
2. **Length** (bar height/width) — very accurate. Good for quantities.
3. **Angle** — less accurate. (Why pie charts underperform.)
4. **Area** — less accurate. Use carefully in bubble charts.
5. **Color hue** — categorical only. Not for ordered data.
6. **Color saturation/lightness** — for sequential/ordered data.
7. **Shape** — for categorical grouping only.
8. **Texture / opacity** — weak signal. Use sparingly.

> **Rule:** The most important data dimension should always use the most accurate encoding (position). Never bury the key insight in color or size alone.

---

## Phase 5: Color in Data Visualization

Color in dataviz is fundamentally different from color in UI design. It encodes information — misuse actively misleads.

### Three Types of Color Scales

**Sequential** — for ordered data with one direction (low to high):
```javascript
// Examples: revenue, temperature, age, score
const scale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxValue]);

// Good sequential palettes:
// Blues, Greens, Oranges (single hue)
// Viridis, Plasma, Cividis (perceptually uniform, colorblind-safe)
```

**Diverging** — for data with a meaningful midpoint (e.g., profit/loss, above/below average):
```javascript
// Examples: profit vs loss, temperature anomaly, sentiment score
const scale = d3.scaleDiverging(d3.interpolateRdBu).domain([min, 0, max]);

// Good diverging palettes:
// RdBu (red-blue), PuOr (purple-orange), RdYlGn (red-yellow-green)
// AVOID RdYlGn for colorblind users — use PuOr or RdBu instead
```

**Categorical** — for unordered groups:
```javascript
// Examples: product categories, countries, departments
const scale = d3.scaleOrdinal(d3.schemeTableau10);

// Good categorical palettes:
// Tableau10, Observable10 — designed for data, perceptually distinct
// AVOID: Rainbow/Jet colormap — perceptually non-uniform and misleading
```

### Colorblind Safety (Non-Negotiable)
**8% of men and 0.5% of women have color vision deficiency.** Red-green is the most common.

- **Never rely on red vs. green alone** to encode a data difference
- Use shape or pattern as a secondary encoding alongside color
- Test with a colorblind simulator (Coblis, Viz Palette)
- **Safe palette for categorical data:** Okabe-Ito palette

```javascript
// Okabe-Ito — colorblind safe categorical palette
const okabeIto = ["#E69F00", "#56B4E9", "#009E73", "#F0E442",
                   "#0072B2", "#D55E00", "#CC79A7", "#000000"];
```

### Color Rules
- **One data dimension = one color encoding.** Don't double-encode (same color AND same shape for same category).
- **Gray is your friend.** Use color to highlight, not to decorate every element.
- **Never use color to represent quantity on a categorical axis** — use bar length instead.
- **Sequential scales must be perceptually uniform** — avoid rainbow colormaps that distort perceived magnitude.

---

## Phase 6: Axes, Labels, and Annotation

The most underrated skill in dataviz. This is what separates professional from amateur work.

### Axes
- **Always label axes** with the metric name AND unit: `Revenue (USD millions)`, not just `Revenue`
- **Start bar charts at zero** — truncating the axis exaggerates differences and misleads
- **Line charts may have non-zero baselines** when showing change, but note it clearly
- **Tick marks:** use the minimum needed to orient the reader — too many = visual noise
- **Date formatting:** match granularity to data — `Jan 2024` for monthly, `Q1 2024` for quarterly, `2020` for yearly

```javascript
// Smart date axis formatting based on data range
const formatAxis = d3.timeFormat(
  range > 365 * 2 ? "%Y" :         // multi-year: show year
  range > 60     ? "%b %Y" :        // months: show month + year
                   "%b %d"          // days: show month + day
);
```

### Titles and Subtitles
Every chart needs two text elements:
- **Title:** State the insight, not the topic. `"Revenue grew 34% YoY in Q4"` beats `"Q4 Revenue"`.
- **Subtitle:** Provide context — data source, time range, methodology note, unit clarification.

```
✅ Title:    "Northeast region is the only territory missing its Q3 target"
   Subtitle: "Sales targets vs. actuals by region, Q3 2024. Source: Salesforce."

❌ Title:    "Regional Sales"
   Subtitle: (none)
```

### Annotations
Annotations turn a chart into a story. Use them to:
- Mark significant events on a time series (`"Product launch"`, `"Policy change"`)
- Highlight the max, min, or most important data point
- Call out an outlier and explain it
- Show a target/benchmark line with a label

```javascript
// D3 annotation example
svg.append("line")
  .attr("class", "benchmark")
  .attr("x1", 0).attr("x2", width)
  .attr("y1", y(target)).attr("y2", y(target))
  .style("stroke-dasharray", "4,4")
  .style("stroke", "#666");

svg.append("text")
  .attr("x", width - 4)
  .attr("y", y(target) - 6)
  .attr("text-anchor", "end")
  .text("2024 Target");
```

### Gridlines
- Use **horizontal gridlines only** for most charts (they guide the eye along the value axis)
- Make them light gray (`#e5e7eb`) and behind the data — never competing with it
- **Remove all chart junk:** unnecessary borders, tick marks, background fills, 3D effects

---

## Phase 7: Interactivity

Interactivity should reveal more information — not just be a technical demonstration.

### When to Add Interactivity
- **Tooltips:** Always. Show the exact value on hover for every chart. Design tooltips carefully — they're often the first thing users interact with.
- **Filtering/highlighting:** When there are many series and the user needs to focus on one
- **Zoom/pan:** Only for time series with large date ranges where detail matters
- **Drill-down:** For hierarchical data where high-level context + detail are both needed
- **Animated transitions:** When showing state changes (filtering, sorting, time progression)

### Tooltip Design
A good tooltip answers: *"What exactly am I looking at?"*

```javascript
// Recharts custom tooltip example
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
      color: '#f1f5f9'
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      {payload.map(entry => (
        <p key={entry.name} style={{ color: entry.color, margin: '2px 0' }}>
          <strong>{entry.name}:</strong> {formatValue(entry.value)}
        </p>
      ))}
    </div>
  );
};
```

### Animation Principles
- **Enter animations:** Bars grow from zero, lines draw left to right, areas fill upward
- **Transition duration:** 300–600ms for state changes, 800–1200ms for dramatic reveals
- **Easing:** `d3.easeCubicOut` for natural deceleration — never linear for data animations
- **Always respect `prefers-reduced-motion`** — disable animations when set

```javascript
// D3 enter animation for bars
bars.attr("height", 0).attr("y", height)
    .transition().duration(600).ease(d3.easeCubicOut)
    .attr("height", d => height - y(d.value))
    .attr("y", d => y(d.value));
```

---

## Phase 8: Library Selection

### Decision Framework

```
Is the data simple and the chart type standard?
  → Yes: Use Recharts (React) or Chart.js (HTML)

Do you need custom layouts, unique chart types, or fine-grained control?
  → Yes: Use D3.js

Is this a Python environment (Jupyter, script)?
  → Use matplotlib / seaborn for static, plotly for interactive

Is this a dashboard with multiple charts + filters?
  → Use Recharts or Plotly (React), or Observable Plot
```

### Library Reference

| Library | Best For | Avoid When |
|---|---|---|
| **Recharts** | Standard charts in React, fast setup, responsive | Custom/unusual chart types |
| **D3.js** | Full custom control, unique layouts, animations | Simple standard charts (overkill) |
| **Chart.js** | HTML canvas charts, simple and fast | Complex interactivity or custom shapes |
| **Plotly** | Scientific/statistical charts, 3D, dashboards | Highly custom visual styling |
| **Visx** (Airbnb) | D3 power + React composability | Small projects (steep learning curve) |
| **Observable Plot** | Concise, opinionated, beautiful defaults | Full custom control needed |

### Claude.ai Artifact Library Usage

```jsx
// Recharts — recommended default for React artifacts
import {
  LineChart, BarChart, AreaChart, ScatterChart, PieChart,
  Line, Bar, Area, Scatter, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Brush
} from 'recharts';

// D3 — for custom/advanced visualizations
import * as d3 from 'd3';

// Plotly — for scientific/statistical
import * as Plotly from 'plotly';
```

---

## Phase 9: Responsive & Accessible Charts

### Responsive Design
Every chart must work at mobile width. The data shouldn't break, it should adapt.

```jsx
// Always wrap Recharts in ResponsiveContainer
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={data}>
    {/* chart content */}
  </LineChart>
</ResponsiveContainer>
```

**Responsive adaptations:**
- Reduce tick density on small screens
- Shorten axis labels (abbreviate months, truncate category names)
- Stack legend below chart (not beside it) on mobile
- Increase touch target size for interactive elements on mobile

### Accessibility for Charts
Charts are invisible to screen readers unless you add alternatives.

- **`role="img"` + `aria-label`** on the chart container with a text description of the insight
- **`<title>` and `<desc>`** inside SVG elements
- **Data table fallback:** Provide the underlying data in a `<table>` that is visually hidden but screen-reader accessible
- **Keyboard navigation** for interactive charts: arrow keys to navigate data points, Enter to drill down
- **Never use color alone** to encode critical information — add pattern, shape, or direct labels

```jsx
// Accessible chart container
<div
  role="img"
  aria-label="Line chart showing monthly revenue from Jan to Dec 2024.
               Revenue peaked in November at $2.4M, up 34% year over year."
>
  <ResponsiveContainer>
    {/* chart */}
  </ResponsiveContainer>
</div>
```

---

## Phase 10: Dashboard Composition

When combining multiple charts, the whole must communicate more than the sum of parts.

### Layout Hierarchy
```
Dashboard = Hero KPIs → Primary Chart → Supporting Charts → Detail Tables

Top:    3–5 KPI cards (single numbers with trend indicator)
Middle: One primary chart that answers the main question
Bottom: Supporting charts for breakdown, comparison, or drill-down
Last:   Raw data table (collapsible or paginated)
```

### KPI Card Design
Every KPI card needs: **metric name + current value + trend vs. prior period + sparkline (optional)**

```jsx
const KPICard = ({ title, value, change, trend }) => (
  <div style={{ padding: '20px 24px', background: 'var(--surface)', borderRadius: 12 }}>
    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{title}</p>
    <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>{value}</p>
    <p style={{ color: change >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontSize: 13 }}>
      {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs prior period
    </p>
  </div>
);
```

### Dashboard Composition Rules
- **One question per chart.** Don't try to answer two questions in one visualization.
- **Consistent color encoding across the dashboard.** If blue = "actual" in one chart, it must mean "actual" everywhere.
- **Consistent time ranges.** All charts on a dashboard should cover the same period unless explicitly noted.
- **Visual hierarchy through size.** The most important chart should be the largest.
- **White space is structure.** Use gap/padding to group related charts visually.

---

## Phase 11: Styling & Aesthetics

Data visualization has its own aesthetic rules distinct from general UI design.

### Typography for Charts
- **Chart title:** 15–18px, semibold, high contrast
- **Axis labels:** 11–13px, medium weight, muted color (`#64748b`)
- **Tick values:** 10–12px, regular weight, muted
- **Annotations:** 11–13px, italic or colored to distinguish from axis text
- **Tooltips:** 12–14px, slightly larger than tick text for readability at hover

### Chart Color Palette Tokens
```css
:root {
  /* Data series colors — perceptually distinct, colorblind-safe */
  --data-1: #3b82f6;  /* blue */
  --data-2: #f59e0b;  /* amber */
  --data-3: #10b981;  /* emerald */
  --data-4: #f43f5e;  /* rose */
  --data-5: #8b5cf6;  /* violet */
  --data-6: #06b6d4;  /* cyan */

  /* Semantic */
  --data-positive: #10b981;
  --data-negative: #f43f5e;
  --data-neutral:  #94a3b8;
  --data-highlight: #f59e0b;

  /* Structure */
  --chart-bg:       #0f172a;
  --chart-surface:  #1e293b;
  --chart-grid:     #1e293b;
  --chart-axis:     #334155;
  --chart-text:     #f1f5f9;
  --chart-muted:    #64748b;
}
```

### The Minimal Chart Aesthetic
The best data visualizations remove everything that doesn't carry information.

**Remove (chart junk):**
- Outer border/box around chart
- Background fills on plot area
- Unnecessary gridlines (especially vertical)
- Tick marks that duplicate gridlines
- Legends when direct labels work better
- Excessive decimal places

**Keep and refine:**
- Horizontal gridlines (light gray)
- Clean axis lines (or remove and use gridlines only)
- Direct data labels when the chart has few series
- Annotations that add meaning

---

## Anti-Patterns: The Dataviz Hall of Shame

| ❌ Don't | ✅ Do Instead |
|---|---|
| 3D charts of any kind | Flat 2D — always more accurate to read |
| Pie chart with 6+ slices | Sorted horizontal bar chart |
| Dual-axis chart | Two separate charts or normalized scale |
| Truncated y-axis on bar chart | Start at zero; use inset zoom for context |
| Rainbow colormap (Jet) | Viridis, Plasma, or Cividis |
| Red vs. green only | Add pattern/shape; use colorblind-safe palette |
| Chart title that names the topic | Chart title that states the insight |
| Unlabeled axes | Always label with metric + unit |
| No data source or date range | Always include source and time context |
| Animating every element | One orchestrated reveal; calm transitions |
| Overplotting in scatter (many points) | Use transparency, hexbin, or density plot |
| Same chart type for every dataset | Match chart type to data structure and question |
| Legends when direct labels work | Label the last point of each line directly |

---

## Pre-Ship Checklist

### Data Integrity
- [ ] Data is clean — no silent nulls, type mismatches, or unit inconsistencies
- [ ] Aggregation level is correct for the question being answered
- [ ] Outliers are handled and noted if removed
- [ ] Source, time range, and methodology are noted in the subtitle or footer

### Chart Design
- [ ] Chart type is the right choice for the data structure and question
- [ ] Y-axis starts at zero for bar charts
- [ ] Axes are labeled with metric name AND unit
- [ ] Title states the insight, not just the topic
- [ ] Color scale is appropriate (sequential / diverging / categorical)
- [ ] No 3D effects, unnecessary gridlines, or chart junk

### Accessibility & Inclusion
- [ ] Color encoding is colorblind-safe (tested or uses safe palette)
- [ ] Color is not the only encoding for critical data — shape or pattern added
- [ ] `aria-label` on chart container describes the insight in text
- [ ] Interactive charts are keyboard-navigable

### Interactivity
- [ ] Tooltips show exact values with proper formatting (commas, units, decimal places)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Filters/controls reset cleanly without breaking layout
- [ ] Responsive at mobile width — layout adapts, data doesn't break

### Dashboard-Specific
- [ ] Consistent color encoding across all charts
- [ ] Consistent time range across all charts (or differences are explicit)
- [ ] One clear primary chart; supporting charts are clearly subordinate
- [ ] KPI cards include trend direction and comparison period

---

## Quick Reference: Chart Type Decision Tree

```
What are you trying to show?
│
├── Change over time
│   ├── Continuous trend → Line chart
│   ├── Discrete periods → Bar chart (vertical)
│   └── Part-to-whole over time → Stacked area chart
│
├── Comparison across categories
│   ├── Few categories (≤8) → Vertical bar chart
│   ├── Many categories or long labels → Horizontal bar chart
│   ├── Ranking → Sorted horizontal bar
│   └── Before/after → Slope chart
│
├── Part-to-whole
│   ├── Few parts (≤5) → Donut chart
│   ├── Many parts or hierarchy → Treemap
│   └── Comparing composition across groups → 100% stacked bar
│
├── Distribution
│   ├── Single variable → Histogram
│   ├── Distribution + outliers → Box plot
│   └── Two variables → Scatter plot
│
├── Relationship / Correlation
│   ├── Two variables → Scatter plot
│   ├── Many variables → Heatmap / correlation matrix
│   └── Network → Force-directed graph (D3)
│
└── Geographic
    ├── Value by region → Choropleth map
    ├── Point data → Bubble map
    └── Flow / movement → Flow map
```

---

> **The goal of a visualization is not to display data. It is to produce understanding. Every pixel should either inform or make room for pixels that do.**
