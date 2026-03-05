# Testing Skill — Production Grade (Complete)

## When to Use
Trigger this skill for any request involving:
- "How do I test this component / hook / function?"
- Vitest or Jest setup for React projects
- Testing Library — queries, interactions, async patterns
- MSW — Mock Service Worker, API mocking strategy
- Testing custom hooks with renderHook
- Testing forms, modals, async flows end to end
- Testing with React Query, Zustand, or Context
- test.each / parametrized tests for business logic
- Test data factories and builders
- Next.js Server Component testing strategy
- Playwright — E2E, page objects, multi-role auth, network interception
- Accessibility testing — axe, keyboard navigation, aria-live regions
- Visual regression testing
- Flaky test identification and quarantine
- CI — parallel runs, sharding, coverage thresholds, monorepos
- "Why are my tests breaking when I refactor?"
- "What should I actually test?"

---

## The Testing Mindset

**Test behavior, not implementation.**

The single most common cause of brittle test suites is testing how something is implemented rather than what it does. Tests that break when you rename a state variable, extract a helper, or change a CSS class — while the user experience stays identical — are not tests worth having. They slow down refactoring and erode trust in the suite.

The question every test should answer: **"Does this work the way the user or system expects?"** Not: "Does this component have a specific internal variable with a specific value?"

**The Testing Trophy**

```
           /\
          /E2E\          ← Few — critical user journeys only
         /------\
        /        \
       /Integration\     ← Most tests live here
      /  (component) \   ← Components WITH their real dependencies
     /----------------\
    /      Unit        \ ← Pure functions, hooks, utilities
   /--------------------\
  /       Static         \ ← TypeScript + ESLint — free, always on
 /------------------------\

Integration tests give more confidence per test than unit tests.
A test that renders a form, fills it, submits it, and checks the
result tells you more than 10 tests of internal form functions.
```

**Three rules that govern everything:**

1. **If you can refactor the implementation and tests still pass, the tests are good.** If a rename breaks a test, the test was testing the wrong thing.
2. **Mock as little as possible.** Every mock is a place where tests diverge from reality. MSW at the network level means your component's actual fetch call is tested. `vi.mock("../api")` is not.
3. **Tests are documentation that runs.** A new developer reading your tests should understand what the feature does. Test names are specifications: *"submits form data when user fills required fields and clicks Save."*

---

## Phase 1: What to Test — and What Not To

### Test These

```
User interactions and their outcomes:
  User fills a form and submits → data sent, success state shown
  User clicks delete → confirmation dialog appears
  User types in search → results filter correctly
  User presses Escape → modal closes, focus returns to trigger

Business logic in pure functions:
  validateEmail("bad") → false
  formatCurrency(1234.5, "USD") → "$1,234.50"
  calculateDiscount(price, coupon) → correct discounted price

All component states:
  Loading → skeleton shown
  Success → correct data shown
  Error   → error message shown, retry available
  Empty   → empty state UI shown, not a crash

Accessibility:
  No axe violations on every component state
  Keyboard navigation flows work correctly
  aria-live regions announce dynamic changes

Integration flows:
  User authenticates → redirected to dashboard
  Form submits → optimistic update → server confirms → UI settles
  Admin user sees controls regular user does not
```

### Do NOT Test These

```
Implementation details:
  State variable names or values
  Internal function calls
  Component method names
  CSS class names (except classes tied to behavior)
  Number of times a function was called (usually)

Third-party library behavior:
  That React renders correctly (React's job)
  That React Query retries on failure (React Query's tests)
  That Tailwind applies correct styles (Tailwind's job)
  That Zod validates schema correctly (Zod's tests)

Trivial pass-through components:
  A styled div with no behavior
  A layout wrapper with no logic

Snapshot tests of entire component trees:
  They break on any render change, get committed without review
  They test nothing about behavior — just that nothing changed
  EXCEPTION: snapshot a specific computed/transformed value
```

---

## Phase 2: Setup — Vitest + Testing Library

### Install

```bash
npm install -D vitest @vitest/coverage-v8 jsdom
npm install -D @testing-library/react @testing-library/user-event
npm install -D @testing-library/jest-dom
npm install -D msw
npm install -D jest-axe @types/jest-axe
npm install -D vite-tsconfig-paths @vitejs/plugin-react

# For Next.js — use vitest with the Next.js plugin or Jest with next/jest
# Vitest is preferred for speed; next/jest for full RSC support
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react           from "@vitejs/plugin-react";
import tsconfigPaths   from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals:     true,
    setupFiles:  ["./src/test/setup.ts"],

    // Exclude E2E — they run separately via Playwright
    exclude: ["**/node_modules/**", "**/e2e/**"],

    coverage: {
      provider:  "v8",
      reporter:  ["text", "html", "lcov", "json-summary"],
      include:   ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.stories.*",
        "src/**/*.d.ts",
        "src/test/**",
        "src/types/**",
        "src/**/__mocks__/**",
        "src/app/**",       // Next.js pages — covered by E2E
        "src/middleware.ts",
      ],
      thresholds: {
        lines:      80,
        functions:  80,
        branches:   75,
        statements: 80,
      },
    },

    // Run test files in parallel — significant speed improvement
    pool:        "forks",
    poolOptions: { forks: { singleFork: false } },
  },
});
```

```typescript
// src/test/setup.ts — runs before every test file
import "@testing-library/jest-dom";
import { expect, afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup }           from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { server }            from "./mocks/server";

// Extend expect
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
expect.extend(toHaveNoViolations);

// Clean up DOM after each test
afterEach(() => cleanup());

// MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
// "error" = fail the test if a request has no handler
// Use "warn" during development when building new features
afterEach(() => server.resetHandlers()); // handlers reset between tests
afterAll(()  => server.close());

// Mock browser APIs not available in jsdom
// Each in its own beforeEach so tests can override per-test

// IntersectionObserver
vi.stubGlobal("IntersectionObserver", vi.fn(() => ({
  observe:    vi.fn(),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
})));

// ResizeObserver
vi.stubGlobal("ResizeObserver", vi.fn(() => ({
  observe:    vi.fn(),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
})));

// matchMedia — override per-test with specific matches value
vi.stubGlobal("matchMedia", vi.fn().mockImplementation(query => ({
  matches:              false,
  media:                query,
  onchange:             null,
  addListener:          vi.fn(),
  removeListener:       vi.fn(),
  addEventListener:     vi.fn(),
  removeEventListener:  vi.fn(),
  dispatchEvent:        vi.fn(),
})));

// scrollTo — called in many components
vi.stubGlobal("scrollTo", vi.fn());
```

### renderWithProviders — The Correct Implementation

The most common mistake: creating a new `QueryClient` inside the wrapper function causes it to be recreated on every render, losing cache state mid-test.

```tsx
// src/test/render.tsx
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter }  from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { ReactNode } from "react";

// Fresh QueryClient per test — called ONCE per test, not per render
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry:    false,        // fail fast — no retry delays
        staleTime: Infinity,    // never refetch during tests
        gcTime:    Infinity,    // keep data for whole test
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log:   console.log,
      warn:  console.warn,
      error: () => {},         // suppress React Query error logs in tests
    },
  });
}

type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  route?:       string;        // initial route
  queryClient?: QueryClient;   // provide your own for shared state tests
};

export function renderWithProviders(
  ui: React.ReactElement,
  {
    route       = "/",
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="light">
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient, // expose for test assertions on cache state
  };
}

// Re-export everything — import from here, not from @testing-library/react
export * from "@testing-library/react";
export { renderWithProviders as render };
```

---

## Phase 3: Test Data Factories

As a project grows, building test data inline in every test becomes unmaintainable. Factories give you consistent, typed test data with sensible defaults you can override.

```typescript
// src/test/factories/index.ts

// ─── Type-safe factory builder ────────────────────
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

let idCounter = 1;
export const nextId = () => String(idCounter++);
beforeEach(() => { idCounter = 1; }); // reset between tests

// ─── User factory ─────────────────────────────────
export const buildUser = (overrides: DeepPartial<User> = {}): User => ({
  id:        nextId(),
  name:      "Jane Smith",
  email:     "jane@example.com",
  role:      "member",
  createdAt: "2026-01-01T00:00:00.000Z",
  avatar:    null,
  ...overrides,
});

export const buildAdminUser = (overrides: DeepPartial<User> = {}): User =>
  buildUser({ role: "admin", name: "Admin User", ...overrides });

// ─── Product factory ──────────────────────────────
export const buildProduct = (overrides: DeepPartial<Product> = {}): Product => ({
  id:          nextId(),
  name:        "Test Widget",
  description: "A widget for testing",
  price:       9.99,
  category:    "widgets",
  stock:       100,
  imageUrl:    "https://example.com/widget.jpg",
  createdAt:   "2026-01-01T00:00:00.000Z",
  ...overrides,
});

export const buildProductList = (
  count:     number,
  overrides: DeepPartial<Product> = {}
): Product[] =>
  Array.from({ length: count }, (_, i) =>
    buildProduct({ name: `Widget ${i + 1}`, ...overrides })
  );

// ─── Order factory ────────────────────────────────
export const buildOrderItem = (overrides: DeepPartial<OrderItem> = {}): OrderItem => ({
  id:        nextId(),
  productId: nextId(),
  name:      "Test Widget",
  price:     9.99,
  quantity:  1,
  ...overrides,
});

export const buildOrder = (overrides: DeepPartial<Order> = {}): Order => ({
  id:        nextId(),
  userId:    nextId(),
  status:    "pending",
  items:     [buildOrderItem()],
  total:     9.99,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

// ─── API response wrappers ────────────────────────
export const buildPaginatedResponse = <T>(
  items:   T[],
  options: { page?: number; pageSize?: number; total?: number } = {}
) => ({
  data:     items,
  page:     options.page     ?? 1,
  pageSize: options.pageSize ?? 20,
  total:    options.total    ?? items.length,
  hasMore:  (options.total ?? items.length) > (options.page ?? 1) * (options.pageSize ?? 20),
});

// Usage in tests:
// const user = buildUser({ role: "admin" });
// const products = buildProductList(5, { category: "gadgets" });
// const order = buildOrder({ status: "completed", items: [buildOrderItem({ quantity: 3 })] });
```

---

## Phase 4: MSW — API Mocking at the Network Level

MSW intercepts at the network layer — your component's actual `fetch` call runs, gets intercepted, returns mock data. This is categorically better than `vi.mock("../api")`, which bypasses your fetch logic entirely and tests nothing about how data flows through your component.

### Organize Handlers by Domain

```
src/test/mocks/
  handlers/
    users.ts       ← /api/users endpoints
    products.ts    ← /api/products endpoints
    orders.ts      ← /api/orders endpoints
    auth.ts        ← /api/auth endpoints
  index.ts         ← combines all handlers
  server.ts        ← Node.js test server
  browser.ts       ← browser dev mode worker
```

```typescript
// src/test/mocks/handlers/products.ts
import { http, HttpResponse, delay } from "msw";
import { buildProduct, buildProductList, buildPaginatedResponse } from "@/test/factories";

export const productHandlers = [
  // List products — supports filtering and pagination
  http.get("/api/products", ({ request }) => {
    const url      = new URL(request.url);
    const category = url.searchParams.get("category");
    const page     = parseInt(url.searchParams.get("page") ?? "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20");

    const all = buildProductList(50);
    const filtered = category
      ? all.filter(p => p.category === category)
      : all;

    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json(
      buildPaginatedResponse(items, { page, pageSize, total: filtered.length })
    );
  }),

  // Get single product
  http.get("/api/products/:id", ({ params }) => {
    if (params.id === "not-found") {
      return HttpResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return HttpResponse.json(buildProduct({ id: params.id as string }));
  }),

  // Create product
  http.post("/api/products", async ({ request }) => {
    const body = await request.json() as Partial<Product>;
    return HttpResponse.json(buildProduct(body), { status: 201 });
  }),

  // Update product
  http.patch("/api/products/:id", async ({ request, params }) => {
    const body = await request.json() as Partial<Product>;
    return HttpResponse.json(buildProduct({ id: params.id as string, ...body }));
  }),

  // Delete product
  http.delete("/api/products/:id", () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

```typescript
// src/test/mocks/handlers/index.ts
import { userHandlers }    from "./users";
import { productHandlers } from "./products";
import { orderHandlers }   from "./orders";
import { authHandlers }    from "./auth";

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...productHandlers,
  ...orderHandlers,
];
```

```typescript
// src/test/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers }    from "./handlers";

export const server = setupServer(...handlers);
```

### MSW Request Inspection

```typescript
// Verify what was sent to the API — without vi.mock
it("sends correct payload when form is submitted", async () => {
  const user = userEvent.setup();

  let capturedRequest: unknown;

  // Intercept and capture the request body
  server.use(
    http.post("/api/products", async ({ request }) => {
      capturedRequest = await request.json();
      return HttpResponse.json(buildProduct(), { status: 201 });
    })
  );

  render(<CreateProductForm />);

  await user.type(screen.getByRole("textbox", { name: /name/i }),  "My Widget");
  await user.type(screen.getByRole("spinbutton", { name: /price/i }), "29.99");
  await user.selectOptions(screen.getByRole("combobox", { name: /category/i }), "widgets");
  await user.click(screen.getByRole("button", { name: /create product/i }));

  await screen.findByText(/product created/i);

  expect(capturedRequest).toEqual({
    name:     "My Widget",
    price:    29.99,
    category: "widgets",
  });
});
```

---

## Phase 5: Queries — Finding Elements the Right Way

### Query Priority

```
Priority 1 — Accessible to everyone (use first):
  getByRole          — the most important. Matches ARIA role + accessible name.
  getByLabelText     — form fields associated with a label
  getByPlaceholderText — fallback for inputs without labels (also an a11y issue)
  getByText          — visible text content
  getByDisplayValue  — current value of input/select/textarea

Priority 2 — Semantic:
  getByAltText       — images with meaningful alt text
  getByTitle         — title attribute (less common)

Priority 3 — Test ID (last resort):
  getByTestId        — only when no semantic query works
  // If you need testId often, the component likely has accessibility problems

Never:
  container.querySelector(".class-name")  — tests CSS, not behavior
  getByClassName                          — does not exist in RTL

Debug what is available:
  screen.debug()                          — prints current DOM
  import { logRoles } from "@testing-library/dom"
  logRoles(container)                     — prints all roles and their names
```

### getByRole Reference

```tsx
// Buttons and links
getByRole("button",   { name: /save changes/i })
getByRole("link",     { name: /learn more/i })

// Form inputs — name comes from associated <label>
getByRole("textbox",    { name: /email address/i })
getByRole("spinbutton", { name: /quantity/i })         // number inputs
getByRole("checkbox",   { name: /agree to terms/i })
getByRole("radio",      { name: /monthly billing/i })
getByRole("combobox",   { name: /country/i })          // <select>
getByRole("switch",     { name: /dark mode/i })

// Status and alerts
getByRole("alert")         // role="alert" or aria-live="assertive" — errors
getByRole("status")        // role="status" or aria-live="polite" — loading/success

// Structure
getByRole("dialog")        // modals
getByRole("navigation")
getByRole("main")
getByRole("heading",       { name: /product details/i })
getByRole("heading",       { level: 1 })               // specifically h1

// Lists
getAllByRole("listitem")

// Tables
getByRole("table")
getByRole("columnheader",  { name: /price/i })
getByRole("cell",          { name: /29.99/i })

// Tabs
getByRole("tab",           { name: /overview/i, selected: true })
getByRole("tabpanel")
```

### get vs query vs find

```typescript
// getBy*   — throws if not found. Use when element MUST exist.
const btn = screen.getByRole("button", { name: "Submit" });

// queryBy* — returns null if not found. Use to assert absence.
expect(screen.queryByRole("alert")).not.toBeInTheDocument();

// findBy*  — async, polls until found or timeout. Use after async ops.
const result = await screen.findByText(/success/i);

// All*     — multiple elements
const items = screen.getAllByRole("listitem");
expect(items).toHaveLength(3);

// Timeout — increase for legitimately slow operations
await screen.findByText(/loaded/i, {}, { timeout: 3000 });
```

---

## Phase 6: userEvent — Always Over fireEvent

`fireEvent` dispatches one raw DOM event. `userEvent.click()` dispatches the full sequence a real browser does: `pointerover`, `pointerenter`, `mouseover`, `mouseenter`, `pointermove`, `mousemove`, `pointerdown`, `mousedown`, `focus`, `pointerup`, `mouseup`, `click`. Tests that use `fireEvent` miss bugs that real users would hit.

```typescript
// ALWAYS set up userEvent at the top of describe — NOT inside it()
// This creates an isolated instance with its own keyboard state
describe("MyComponent", () => {
  const user = userEvent.setup();

  it("...", async () => {
    // use user.click(), user.type(), etc.
  });
});

// With fake timers — MUST pass advanceTimers or userEvent hangs
describe("Debounced input", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(()  => vi.useRealTimers());

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
});
```

```typescript
// ─── Clicking ────────────────────────────────────
await user.click(screen.getByRole("button", { name: /submit/i }));
await user.dblClick(element);
await user.pointer({ keys: "[MouseRight]", target: element }); // right-click

// ─── Typing ──────────────────────────────────────
await user.type(screen.getByRole("textbox", { name: /email/i }), "jane@example.com");
await user.clear(input);
await user.type(input, "new value");

// Keyboard only
await user.keyboard("{Enter}");
await user.keyboard("{Escape}");
await user.keyboard("{Tab}");
await user.keyboard("{ArrowDown}");
await user.keyboard("{Home}");
await user.keyboard("{End}");
await user.keyboard("[ShiftLeft>]A[/ShiftLeft]"); // Shift+A

// ─── Select ──────────────────────────────────────
await user.selectOptions(
  screen.getByRole("combobox", { name: /country/i }),
  "Canada"
);

// ─── Checkbox / radio ────────────────────────────
await user.click(screen.getByRole("checkbox", { name: /agree/i }));
await user.check(screen.getByRole("checkbox", { name: /newsletter/i }));
await user.uncheck(screen.getByRole("checkbox", { name: /newsletter/i }));

// ─── File upload ─────────────────────────────────
const file = new File(["content"], "photo.png", { type: "image/png" });
await user.upload(screen.getByLabelText(/upload photo/i), file);

// Multiple files
const files = [
  new File(["a"], "a.png", { type: "image/png" }),
  new File(["b"], "b.png", { type: "image/png" }),
];
await user.upload(screen.getByLabelText(/upload/i), files);

// ─── Hover ───────────────────────────────────────
await user.hover(screen.getByRole("button", { name: /info/i }));
await screen.findByRole("tooltip");
await user.unhover(screen.getByRole("button", { name: /info/i }));

// ─── Tab navigation ──────────────────────────────
await user.tab();
expect(firstInput).toHaveFocus();
await user.tab();
expect(secondInput).toHaveFocus();
await user.tab({ shift: true }); // Shift+Tab backwards
```

---

## Phase 7: Async Testing

```typescript
// findBy* — preferred for elements appearing after async operation
const msg = await screen.findByText(/saved successfully/i);

// waitFor — for assertions needing to wait
await waitFor(() => {
  expect(screen.getByRole("status")).toHaveTextContent("3 items");
});

// waitFor with multiple assertions — all must pass together
await waitFor(() => {
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  expect(screen.getByText("jane@example.com")).toBeInTheDocument();
});

// waitForElementToBeRemoved — assert disappearance
// Use instead of: await waitFor(() => expect(el).not.toBeInTheDocument())
await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));

// Or pass an element reference:
const spinner = screen.getByRole("progressbar");
await waitForElementToBeRemoved(spinner);
```

### Fake Timers — Debounce, Throttle, Date-Dependent UI

```typescript
import { vi } from "vitest";

describe("SearchInput with debounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(()  => vi.useRealTimers());

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  it("debounces — fires once after typing stops", async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole("searchbox"), "react hooks");

    // Has not fired — debounce not elapsed
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith("react hooks");
    expect(onSearch).toHaveBeenCalledTimes(1); // not once per keystroke
  });
});

// vi.setSystemTime — for date-dependent components
// Calendar pickers, "3 days ago" labels, expiry countdowns
describe("ExpiryBadge", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(()  => vi.useRealTimers());

  it("shows 'Expires today' when expiry is today", () => {
    vi.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
    render(<ExpiryBadge expiresAt="2026-03-15T23:59:59.000Z" />);
    expect(screen.getByText(/expires today/i)).toBeInTheDocument();
  });

  it("shows 'Expires in 3 days'", () => {
    vi.setSystemTime(new Date("2026-03-15T00:00:00.000Z"));
    render(<ExpiryBadge expiresAt="2026-03-18T00:00:00.000Z" />);
    expect(screen.getByText(/expires in 3 days/i)).toBeInTheDocument();
  });

  it("shows 'Expired' when past expiry", () => {
    vi.setSystemTime(new Date("2026-03-20T00:00:00.000Z"));
    render(<ExpiryBadge expiresAt="2026-03-15T00:00:00.000Z" />);
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
  });
});
```

---

## Phase 8: test.each — Parametrized Tests

`test.each` eliminates copy-paste tests for the same behavior with different inputs. Essential for business logic with multiple valid/invalid cases.

```typescript
// ─── Table syntax — most readable ────────────────
describe("validateEmail", () => {
  it.each([
    // [input,              expected, description]
    ["jane@example.com",   true,  "standard email"],
    ["user+tag@domain.co", true,  "email with plus tag"],
    ["user@sub.domain.com",true,  "subdomain email"],
    ["",                   false, "empty string"],
    ["not-an-email",       false, "no @ symbol"],
    ["@domain.com",        false, "missing local part"],
    ["user@",              false, "missing domain"],
    ["user @domain.com",   false, "space in email"],
  ])("returns %s for '%s' (%s)", (input, expected) => {
    expect(validateEmail(input)).toBe(expected);
  });
});

// ─── Template literal syntax — self-documenting test names ─
describe("formatCurrency", () => {
  it.each`
    amount     | currency  | expected
    ${0}       | ${"USD"}  | ${"$0.00"}
    ${1234.5}  | ${"USD"}  | ${"$1,234.50"}
    ${-50}     | ${"USD"}  | ${"-$50.00"}
    ${1000}    | ${"EUR"}  | ${"€1,000.00"}
    ${0.001}   | ${"USD"}  | ${"$0.00"}
  `("formats $amount $currency as $expected", ({ amount, currency, expected }) => {
    expect(formatCurrency(amount, currency)).toBe(expected);
  });
});

// ─── Component rendering — test multiple variants ─
describe("Badge", () => {
  it.each([
    ["success", /success badge/i],
    ["warning", /warning badge/i],
    ["error",   /error badge/i],
    ["info",    /info badge/i],
  ])("renders %s variant accessibly", async (variant, _label) => {
    const { container } = render(
      <Badge variant={variant as BadgeVariant}>Status</Badge>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

// ─── Error cases ──────────────────────────────────
describe("calculateDiscount", () => {
  it.each([
    ["SAVE10",  100,  90,   "10% off coupon"],
    ["SAVE25",  100,  75,   "25% off coupon"],
    ["FREESHIP", 50,  50,   "free shipping — no price change"],
    ["INVALID",  100, 100,  "invalid coupon — no discount"],
    ["SAVE10",   0,   0,    "zero price — stays zero"],
  ])("%s coupon on $%d price → $%d (%s)", (coupon, price, expected) => {
    expect(calculateDiscount(price, coupon)).toBe(expected);
  });
});

// ─── Form validation with multiple invalid inputs ─
describe("ProductForm validation", () => {
  const user = userEvent.setup();

  it.each([
    { field: "name",  value: "",    error: /name is required/i },
    { field: "name",  value: "a",   error: /name must be at least 2 characters/i },
    { field: "price", value: "-1",  error: /price must be positive/i },
    { field: "price", value: "abc", error: /price must be a number/i },
  ])("shows error for invalid $field: '$value'", async ({ field, value, error }) => {
    render(<ProductForm />);

    const input = screen.getByRole(
      field === "price" ? "spinbutton" : "textbox",
      { name: new RegExp(field, "i") }
    );

    if (value) await user.type(input, value);
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(error)).toBeInTheDocument();
  });
});
```

---

## Phase 9: Component Tests — Core Patterns

### Form — Complete Test

```tsx
import { render, screen, waitFor, waitForElementToBeRemoved }
  from "@/test/render";
import userEvent from "@testing-library/user-event";
import { server }        from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { axe }           from "jest-axe";
import { ContactForm }   from "./ContactForm";

describe("ContactForm", () => {
  const user = userEvent.setup();

  it("renders all required fields", () => {
    render(<ContactForm />);
    expect(screen.getByRole("textbox",  { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox",  { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox",  { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole("button",   { name: /send message/i })).toBeInTheDocument();
  });

  it("shows validation errors on submit with empty fields", async () => {
    render(<ContactForm />);
    await user.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });

  it("validates email format on blur", async () => {
    render(<ContactForm />);
    await user.type(screen.getByRole("textbox", { name: /email/i }), "bad-email");
    await user.tab();
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it("submits successfully and shows confirmation", async () => {
    render(<ContactForm />);

    await user.type(screen.getByRole("textbox", { name: /name/i }),    "Jane Smith");
    await user.type(screen.getByRole("textbox", { name: /email/i }),   "jane@example.com");
    await user.type(screen.getByRole("textbox", { name: /message/i }), "Hello there");

    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Loading state
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    // Success — form replaced by confirmation
    await screen.findByText(/message sent/i);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("shows error and keeps form when submission fails", async () => {
    server.use(
      http.post("/api/contact", () =>
        HttpResponse.json({ message: "Server error" }, { status: 500 })
      )
    );

    render(<ContactForm />);
    await user.type(screen.getByRole("textbox", { name: /name/i }),    "Jane");
    await user.type(screen.getByRole("textbox", { name: /email/i }),   "jane@example.com");
    await user.type(screen.getByRole("textbox", { name: /message/i }), "Hello");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await screen.findByText(/failed to send/i);
    // Form still present — user can retry
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ContactForm />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations in error state", async () => {
    render(<ContactForm />);
    await user.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText(/name is required/i);
    const { container } = render(<ContactForm />); // re-render to capture error state
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### Modal — Focus, Escape, Restoration

```tsx
describe("DeleteConfirmModal", () => {
  const user     = userEvent.setup();
  const onDelete = vi.fn();
  const onClose  = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("does not render when closed", () => {
    render(<DeleteConfirmModal isOpen={false} onDelete={onDelete} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus inside modal when opened", () => {
    render(<DeleteConfirmModal isOpen={true} onDelete={onDelete} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement);
  });

  it("closes and fires onClose when Escape pressed", async () => {
    render(<DeleteConfirmModal isOpen={true} onDelete={onDelete} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("fires onDelete when confirmed", async () => {
    render(<DeleteConfirmModal isOpen={true} onDelete={onDelete} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: /confirm delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <DeleteConfirmModal isOpen={true} onDelete={onDelete} onClose={onClose} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### File Upload — Size, Type, Multiple Files

```tsx
describe("FileUpload", () => {
  const user = userEvent.setup();

  const makeFile = (name: string, size: number, type: string) => {
    const content = "x".repeat(size);
    return new File([content], name, { type });
  };

  it("accepts valid image files", async () => {
    const onUpload = vi.fn();
    render(<FileUpload onUpload={onUpload} accept="image/*" maxSizeMB={5} />);

    const file = makeFile("photo.jpg", 1024, "image/jpeg");
    await user.upload(screen.getByLabelText(/upload/i), file);

    expect(onUpload).toHaveBeenCalledWith([file]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows error for file exceeding size limit", async () => {
    render(<FileUpload accept="image/*" maxSizeMB={1} />);

    const bigFile = makeFile("large.jpg", 2 * 1024 * 1024, "image/jpeg"); // 2MB
    await user.upload(screen.getByLabelText(/upload/i), bigFile);

    expect(await screen.findByRole("alert")).toHaveTextContent(/file too large/i);
  });

  it("shows error for wrong file type", async () => {
    render(<FileUpload accept="image/*" />);

    const pdf = makeFile("doc.pdf", 1024, "application/pdf");
    await user.upload(screen.getByLabelText(/upload/i), pdf);

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid file type/i);
  });

  it("accepts multiple files and shows file list", async () => {
    render(<FileUpload accept="image/*" multiple />);

    const files = [
      makeFile("a.jpg", 1024, "image/jpeg"),
      makeFile("b.png", 2048, "image/png"),
    ];
    await user.upload(screen.getByLabelText(/upload/i), files);

    expect(screen.getByText("a.jpg")).toBeInTheDocument();
    expect(screen.getByText("b.png")).toBeInTheDocument();
  });
});
```

### Pagination and Infinite Scroll

```tsx
describe("ProductList — pagination", () => {
  const user = userEvent.setup();

  it("loads first page on mount", async () => {
    render(<ProductList />);
    await screen.findByText("Widget 1");
    expect(screen.getAllByRole("listitem")).toHaveLength(20); // pageSize
  });

  it("loads next page when Next is clicked", async () => {
    render(<ProductList />);
    await screen.findByText("Widget 1");

    await user.click(screen.getByRole("button", { name: /next page/i }));

    await screen.findByText("Widget 21"); // page 2 starts at 21
    expect(screen.queryByText("Widget 1")).not.toBeInTheDocument();
  });

  it("disables Previous on first page", async () => {
    render(<ProductList />);
    await screen.findByText("Widget 1");
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("disables Next on last page", async () => {
    // Override to return last page
    server.use(
      http.get("/api/products", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") ?? "1");
        // 3 pages of 20, on page 3
        return HttpResponse.json(
          buildPaginatedResponse(buildProductList(10), { page: 3, pageSize: 20, total: 50 })
        );
      })
    );

    render(<ProductList initialPage={3} />);
    await screen.findByText("Widget 1");
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});

describe("InfiniteScrollFeed", () => {
  it("loads more items when sentinel enters viewport", async () => {
    // Control IntersectionObserver to trigger load more
    let intersectCallback: (entries: IntersectionObserverEntry[]) => void;

    vi.stubGlobal("IntersectionObserver", vi.fn((callback) => {
      intersectCallback = callback;
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    }));

    render(<InfiniteScrollFeed />);
    await screen.findByText("Item 1");
    expect(screen.getAllByRole("listitem")).toHaveLength(20);

    // Simulate sentinel entering viewport
    act(() => {
      intersectCallback!([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    await waitFor(() => {
      expect(screen.getAllByRole("listitem")).toHaveLength(40);
    });
  });
});
```

### aria-live Region Testing

```tsx
// Testing that status announcements actually happen
// axe does not catch this — it requires explicit assertion

describe("FormSubmitStatus aria-live", () => {
  const user = userEvent.setup();

  it("announces success to screen readers", async () => {
    render(<ContactForm />);

    await user.type(screen.getByRole("textbox", { name: /name/i }),    "Jane");
    await user.type(screen.getByRole("textbox", { name: /email/i }),   "jane@example.com");
    await user.type(screen.getByRole("textbox", { name: /message/i }), "Hello");
    await user.click(screen.getByRole("button", { name: /send/i }));

    // The live region must exist in DOM — screen readers announce its content
    // role="status" = aria-live="polite", role="alert" = aria-live="assertive"
    const liveRegion = await screen.findByRole("status");
    expect(liveRegion).toHaveTextContent(/message sent successfully/i);
  });

  it("announces error to screen readers", async () => {
    server.use(
      http.post("/api/contact", () =>
        HttpResponse.json({ message: "Error" }, { status: 500 })
      )
    );

    render(<ContactForm />);
    await user.type(screen.getByRole("textbox", { name: /name/i }),    "Jane");
    await user.type(screen.getByRole("textbox", { name: /email/i }),   "jane@example.com");
    await user.type(screen.getByRole("textbox", { name: /message/i }), "Hello");
    await user.click(screen.getByRole("button", { name: /send/i }));

    // role="alert" announces immediately (assertive)
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/failed to send/i);
  });
});
```

---

## Phase 10: Testing Hooks

```tsx
import { renderHook, act, waitFor } from "@testing-library/react";

// ─── Simple stateful hook ────────────────────────
describe("useCounter", () => {
  it("initializes with default", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it("increments", () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });

  it("respects min boundary", () => {
    const { result } = renderHook(() => useCounter(0, { min: 0 }));
    act(() => result.current.decrement());
    expect(result.current.count).toBe(0); // clamped at min
  });
});

// ─── Hook using context — provide wrapper ─────────
describe("useAuth", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("returns null user when unauthenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("updates after login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("jane@example.com", "password");
    });

    expect(result.current.user?.email).toBe("jane@example.com");
    expect(result.current.isAuthenticated).toBe(true);
  });
});

// ─── Hook with async data fetching ────────────────
describe("useProduct", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  it("fetches product data", async () => {
    const { result } = renderHook(() => useProduct("1"), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.product?.name).toBe("Test Widget");
    expect(result.current.isError).toBe(false);
  });

  it("handles 404 error", async () => {
    const { result } = renderHook(() => useProduct("not-found"), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
    expect(result.current.product).toBeUndefined();
  });
});

// ─── Hook cleanup — verify no memory leaks ────────
describe("useWebSocket", () => {
  it("closes connection on unmount", () => {
    const mockWs = {
      close:     vi.fn(),
      send:      vi.fn(),
      onmessage: null,
      onclose:   null,
      onerror:   null,
    };
    vi.stubGlobal("WebSocket", vi.fn(() => mockWs));

    const { unmount } = renderHook(() => useWebSocket("wss://example.com"));
    unmount();

    expect(mockWs.close).toHaveBeenCalledTimes(1);
  });
});
```

---

## Phase 11: Testing React Query and Zustand

### React Query — Mutations with Optimistic Updates

```tsx
describe("ProductList with optimistic delete", () => {
  const user = userEvent.setup();

  it("removes item optimistically, confirms on success", async () => {
    render(<ProductList />);
    await screen.findByText("Widget 1");

    await user.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    // Item gone after successful delete
    await waitFor(() =>
      expect(screen.queryByText("Widget 1")).not.toBeInTheDocument()
    );
  });

  it("restores item on API error (rollback)", async () => {
    server.use(
      http.delete("/api/products/:id", () =>
        HttpResponse.json({ message: "Error" }, { status: 500 })
      )
    );

    render(<ProductList />);
    await screen.findByText("Widget 1");

    await user.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    // Item reappears after rollback
    await screen.findByText("Widget 1");
    // Error notification shown
    await screen.findByText(/failed to delete/i);
  });

  it("refetches when category filter changes", async () => {
    render(<ProductList />);
    await screen.findByText("Widget 1");

    await user.selectOptions(
      screen.getByRole("combobox", { name: /category/i }),
      "gadgets"
    );

    await screen.findByText("Gadget A");
    expect(screen.queryByText("Widget 1")).not.toBeInTheDocument();
  });
});
```

### Zustand — Reset Pattern + Component Tests

```typescript
// CRITICAL: Zustand persists between tests by default
// Always reset in beforeEach

import { useCartStore } from "@/stores/cartStore";
import { buildProduct } from "@/test/factories";

// Get the initial state once — use it to reset
const initialState = useCartStore.getState();

describe("CartStore", () => {
  beforeEach(() => useCartStore.setState(initialState));

  it("starts empty", () => {
    const { result } = renderHook(() => useCartStore());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it("adds item", () => {
    const product = buildProduct({ price: 9.99 });
    const { result } = renderHook(() => useCartStore());
    act(() => result.current.addItem(product, 1));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(9.99);
  });

  it("increments quantity when same item added twice", () => {
    const product = buildProduct({ price: 9.99 });
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.addItem(product, 1);
      result.current.addItem(product, 1);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBeCloseTo(19.98);
  });
});

describe("CartIcon (reads from Zustand)", () => {
  beforeEach(() => useCartStore.setState(initialState));

  it("shows count badge with total quantity", () => {
    useCartStore.setState({
      items: [
        { ...buildProduct(), quantity: 2 },
        { ...buildProduct(), quantity: 1 },
      ],
      total: 39.97,
    });

    render(<CartIcon />);
    expect(screen.getByRole("status", { name: /cart/i })).toHaveTextContent("3");
  });

  it("hides badge when cart is empty", () => {
    render(<CartIcon />);
    expect(screen.queryByRole("status", { name: /cart/i }))
      .not.toBeInTheDocument();
  });
});
```

---

## Phase 12: Accessibility Testing

### axe — Automated Audit

```tsx
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

// Test every meaningful component state — not just default
describe("Button accessibility", () => {
  it.each([
    ["default",     <Button>Click me</Button>],
    ["disabled",    <Button disabled>Click me</Button>],
    ["loading",     <Button isLoading loadingText="Saving...">Save</Button>],
    ["destructive", <Button variant="destructive">Delete</Button>],
    ["icon-only",   <Button size="icon" aria-label="Settings"><SettingsIcon aria-hidden="true" /></Button>],
  ])("%s state has no violations", async (_state, element) => {
    const { container } = render(element);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// axe catches: missing alt text, missing labels, insufficient contrast,
//   missing document language, duplicate IDs, invalid ARIA, missing landmarks

// axe does NOT catch: wrong focus order, missing focus ring,
//   confusing interaction patterns, aria-live region content
// Those require keyboard tests and manual testing
```

### Keyboard Navigation Tests

```tsx
describe("Tabs keyboard navigation", () => {
  const user = userEvent.setup();

  const renderTabs = () => render(
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Overview</TabsTrigger>
        <TabsTrigger value="tab2">Analytics</TabsTrigger>
        <TabsTrigger value="tab3" disabled>Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Overview content</TabsContent>
      <TabsContent value="tab2">Analytics content</TabsContent>
    </Tabs>
  );

  it("arrow keys navigate between tabs", async () => {
    renderTabs();
    screen.getByRole("tab", { name: "Overview" }).focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Analytics" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("skips disabled tab with arrow keys", async () => {
    renderTabs();
    screen.getByRole("tab", { name: "Analytics" }).focus();

    // ArrowRight from Analytics skips disabled Settings, wraps to Overview
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
  });

  it("Home/End jump to first/last enabled tab", async () => {
    renderTabs();
    screen.getByRole("tab", { name: "Analytics" }).focus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();

    await user.keyboard("{End}");
    // End goes to last enabled tab (not the disabled one)
    expect(screen.getByRole("tab", { name: "Analytics" })).toHaveFocus();
  });
});

describe("Dialog keyboard behavior", () => {
  const user = userEvent.setup();

  it("Escape closes dialog and restores focus to trigger", async () => {
    render(<DialogWithTrigger />);

    const trigger = screen.getByRole("button", { name: /open dialog/i });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus(); // focus restored
  });

  it("Tab cycles focus inside dialog without escaping", async () => {
    render(<DialogWithTrigger />);
    await user.click(screen.getByRole("button", { name: /open/i }));

    const dialog = screen.getByRole("dialog");
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
    );

    // Tab through all focusable elements — should wrap within dialog
    for (let i = 0; i < focusable.length; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement);
    }
  });
});
```

---

## Phase 13: Next.js — Server Components and RSC Testing

React Server Components cannot be rendered by Testing Library — they are server-only by definition. Here is the correct testing strategy.

```
Testing strategy by component type:

Server Component (no "use client"):
  Option 1: Unit test the data-fetching function separately
            test the presentational output with mocked data
  Option 2: E2E test with Playwright (most reliable)
  NOT possible: Testing Library render() — RSC is async generators,
                not React components in the jsdom sense

Client Component ("use client"):
  Testing Library works normally
  MSW works for any fetch calls

Shared/Universal Component:
  Test as client component — behavior is identical
  Testing Library + MSW

Page components (app/page.tsx):
  E2E only — they compose server + client components
  Playwright tests the full page behavior
```

```typescript
// Pattern 1: Test the data layer and presentational layer separately
// Instead of testing the Server Component directly, test its parts

// The server component:
// async function ProductPage({ id }: { id: string }) {
//   const product = await getProduct(id);  ← test this function
//   return <ProductDetail product={product} />;  ← test this component
// }

// Test the data function:
describe("getProduct", () => {
  it("returns product data for valid id", async () => {
    // MSW works for fetch in Node.js test environment
    const product = await getProduct("1");
    expect(product.name).toBe("Test Widget");
    expect(product.price).toBe(9.99);
  });

  it("throws NotFoundError for invalid id", async () => {
    server.use(
      http.get("/api/products/not-found", () =>
        HttpResponse.json({ message: "Not found" }, { status: 404 })
      )
    );
    await expect(getProduct("not-found")).rejects.toThrow("Not found");
  });
});

// Test the presentational component:
describe("ProductDetail", () => {
  const product = buildProduct({ name: "My Widget", price: 29.99 });

  it("renders product information", () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByRole("heading", { name: "My Widget" })).toBeInTheDocument();
    expect(screen.getByText("$29.99")).toBeInTheDocument();
  });
});

// Pattern 2: E2E test the full page
// e2e/products.spec.ts
// test("product page shows correct data", async ({ page }) => {
//   await page.goto("/products/1");
//   await expect(page.getByRole("heading", { name: /widget/i })).toBeVisible();
// });
```

---

## Phase 14: Mocking — Strategies and Patterns

```typescript
// ─── When to use what ────────────────────────────
/*
  MSW (always prefer for HTTP):
    Your own REST/GraphQL API calls
    Third-party API calls
    Any fetch/XHR in your components or hooks

  vi.mock for modules:
    Browser APIs unavailable in jsdom (IntersectionObserver, ResizeObserver)
    Third-party SDKs you cannot intercept (analytics.track, Stripe.js)
    Date/time utilities you need to control (or use vi.setSystemTime)
    Modules with complex setup not worth running in tests

  vi.spyOn:
    Watch calls without changing behavior
    Override behavior temporarily for one test
    Restore after test (spy.mockRestore())
*/

// ─── Module mock ─────────────────────────────────
vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  identify:   vi.fn(),
  page:       vi.fn(),
}));

import { trackEvent } from "@/lib/analytics";

it("tracks button click", async () => {
  const user = userEvent.setup();
  render(<SignupButton />);
  await user.click(screen.getByRole("button", { name: /sign up/i }));
  expect(vi.mocked(trackEvent)).toHaveBeenCalledWith(
    "signup_clicked",
    expect.objectContaining({ source: "header" })
  );
});

// ─── Partial mock — keep real behavior except one function ─
vi.mock("@/lib/date-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/date-utils")>();
  return {
    ...actual,                                            // keep all real functions
    getCurrentDate: vi.fn(() => new Date("2026-01-15")), // override one
  };
});

// ─── Spy — watch without replacing ───────────────
it("warns about deprecated prop", () => {
  const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  render(<Button isPrimary>Old prop</Button>); // deprecated prop
  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining("isPrimary is deprecated")
  );
  consoleSpy.mockRestore();
});

// ─── Environment variables ────────────────────────
it("uses production API URL", () => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.prod.example.com");
  const { result } = renderHook(() => useApiUrl());
  expect(result.current).toBe("https://api.prod.example.com");
  vi.unstubAllEnvs();
});

// ─── navigator.clipboard ────────────────────────
it("copies text to clipboard", async () => {
  const user = userEvent.setup();
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });

  render(<CopyButton text="some text" />);
  await user.click(screen.getByRole("button", { name: /copy/i }));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith("some text");
  await screen.findByText(/copied/i);
});
```

---

## Phase 15: Playwright — E2E Tests

### Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir:       "./e2e",
  fullyParallel: true,
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 2 : 0,
  workers:       process.env.CI ? 4 : undefined,

  reporter: [
    ["html"],
    process.env.CI ? ["github"] : ["list"],
  ],

  use: {
    baseURL:    "http://localhost:3000",
    trace:      "on-first-retry",
    screenshot: "only-on-failure",
    video:      "retain-on-failure",
  },

  projects: [
    // Auth setup — runs first, saves session state
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // Authenticated tests — depend on setup
    {
      name:         "authenticated",
      testDir:      "./e2e/authenticated",
      dependencies: ["setup"],
      use: { storageState: "e2e/.auth/user.json" },
    },

    // Admin tests — separate auth state
    {
      name:         "admin",
      testDir:      "./e2e/admin",
      dependencies: ["setup"],
      use: { storageState: "e2e/.auth/admin.json" },
    },

    // Public tests — no auth needed
    { name: "public", testDir: "./e2e/public" },

    // Mobile
    {
      name: "mobile",
      testDir: "./e2e/authenticated",
      dependencies: ["setup"],
      use: {
        ...devices["iPhone 14"],
        storageState: "e2e/.auth/user.json",
      },
    },
  ],

  webServer: {
    command:             "npm run build && npm run start",
    url:                 "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Auth Setup — Multiple Roles

```typescript
// e2e/auth.setup.ts
import { test as setup } from "@playwright/test";

// Regular user
setup("authenticate as user", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("user@example.com");
  await page.getByLabel(/password/i).fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});

// Admin user — different auth state file
setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@example.com");
  await page.getByLabel(/password/i).fill("admin-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/dashboard");
  await page.context().storageState({ path: "e2e/.auth/admin.json" });
});
```

### Page Object Model

```typescript
// e2e/pages/ProductsPage.ts
import { type Page, type Locator, expect } from "@playwright/test";

export class ProductsPage {
  readonly page:          Page;
  readonly heading:       Locator;
  readonly createButton:  Locator;
  readonly searchInput:   Locator;
  readonly productList:   Locator;
  readonly emptyState:    Locator;

  constructor(page: Page) {
    this.page         = page;
    this.heading      = page.getByRole("heading", { name: /products/i });
    this.createButton = page.getByRole("button",  { name: /create product/i });
    this.searchInput  = page.getByRole("searchbox");
    this.productList  = page.getByRole("list",    { name: /products/i });
    this.emptyState   = page.getByText(/no products found/i);
  }

  async goto() {
    await this.page.goto("/products");
    await expect(this.heading).toBeVisible();
  }

  // Returns locator for a specific product row
  productRow(name: string) {
    return this.page.getByRole("row", { name });
  }

  async createProduct(data: { name: string; price: string; category: string }) {
    await this.createButton.click();
    const dialog = this.page.getByRole("dialog");

    await dialog.getByLabel(/name/i).fill(data.name);
    await dialog.getByLabel(/price/i).fill(data.price);
    await dialog.getByLabel(/category/i).selectOption(data.category);
    await dialog.getByRole("button", { name: /create/i }).click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible();
    // Wait for new product in list
    await expect(this.productRow(data.name)).toBeVisible();
  }

  async deleteProduct(name: string) {
    await this.productRow(name)
      .getByRole("button", { name: /delete/i })
      .click();

    // Confirm in dialog
    await this.page.getByRole("button", { name: /confirm delete/i }).click();
    await expect(this.productRow(name)).not.toBeVisible();
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press("Enter");
  }
}
```

### Multi-Role Authorization Tests

```typescript
// e2e/authenticated/products.spec.ts — regular user
import { test, expect }    from "@playwright/test";
import { ProductsPage }    from "../pages/ProductsPage";

test.describe("Regular user — products", () => {
  test("can view products", async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    await expect(products.productList).toBeVisible();
  });

  test("cannot see delete buttons", async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();
    // Regular users have no delete permission
    await expect(
      page.getByRole("button", { name: /delete/i }).first()
    ).not.toBeVisible();
  });

  test("cannot access admin panel", async ({ page }) => {
    await page.goto("/admin");
    // Should redirect to dashboard or show 403
    await expect(page).not.toHaveURL("/admin");
  });
});

// e2e/admin/products.spec.ts — admin user (uses admin.json auth)
test.describe("Admin user — products", () => {
  test("can create, edit, and delete products", async ({ page }) => {
    const products = new ProductsPage(page);
    await products.goto();

    await products.createProduct({
      name:     "E2E Test Widget",
      price:    "99.99",
      category: "widgets",
    });

    // Edit
    await products.productRow("E2E Test Widget")
      .getByRole("button", { name: /edit/i })
      .click();
    await page.getByLabel(/price/i).fill("89.99");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(products.productRow("E2E Test Widget"))
      .toContainText("$89.99");

    // Delete
    await products.deleteProduct("E2E Test Widget");
  });

  test("can access admin panel", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
  });
});
```

### Network Interception in Playwright

```typescript
test("shows error state when API fails", async ({ page }) => {
  await page.route("**/api/products", route =>
    route.fulfill({ status: 500, body: JSON.stringify({ message: "Error" }) })
  );

  await page.goto("/products");
  await expect(page.getByRole("alert")).toContainText(/failed to load/i);
  await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
});

test("shows loading state while API is slow", async ({ page }) => {
  let resolve: () => void;
  const delayed = new Promise<void>(r => { resolve = r; });

  await page.route("**/api/products", async route => {
    await delayed;
    route.continue();
  });

  await page.goto("/products");
  await expect(page.getByRole("progressbar")).toBeVisible();

  resolve!();
  await expect(page.getByRole("list")).toBeVisible();
});

// expect.soft — collect all failures, not just first
test("product page has all required elements", async ({ page }) => {
  await page.goto("/products/1");

  await expect.soft(page.getByRole("heading")).toBeVisible();
  await expect.soft(page.getByText(/price/i)).toBeVisible();
  await expect.soft(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  await expect.soft(page.getByRole("img", { name: /product/i })).toBeVisible();

  // All soft assertions are checked — not short-circuited on first failure
});
```

### Visual Regression

```typescript
test("product card visual baseline", async ({ page }) => {
  await page.goto("/products/1");
  await page.waitForLoadState("networkidle"); // wait for images

  await expect(page.getByRole("article")).toHaveScreenshot(
    "product-card.png",
    { maxDiffPixelRatio: 0.01 }
  );
});

test("dark mode dashboard", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("dashboard-dark.png", { fullPage: true });
});
```

---

## Phase 16: Flaky Test Management

Flaky tests — tests that sometimes pass and sometimes fail without code changes — are more dangerous than no tests. They erode trust until the team starts ignoring failures.

```
Causes of flaky tests (in frequency order):

1. Missing await — asserting before async operation completes
   Fix: use findBy* and waitFor — never getBy* after async operations

2. Timer/date dependency — test passes at 11:59pm, fails at midnight
   Fix: vi.setSystemTime to pin the date

3. Random data — test depends on order of items that may change
   Fix: factories with deterministic IDs, sort before asserting

4. MSW handler not reset — test A sets up a handler, test B uses it
   Fix: afterEach(() => server.resetHandlers()) — already in setup.ts

5. State not reset between tests — Zustand store leaks
   Fix: beforeEach reset with initial state

6. Race conditions — multiple async operations complete in different orders
   Fix: await specific DOM changes, not setTimeout

7. Viewport-dependent — passes at 1920px, fails at 1366px
   Fix: explicit viewport in Playwright config or per-test

8. Resource-dependent in CI — slower than local
   Fix: increase timeout specifically for that test, not globally
```

```typescript
// Quarantine pattern — isolate flaky tests without deleting them
// Prevents them from blocking CI while you fix them

// vitest
it.skip("FLAKY: this test is being investigated", async () => {
  // moved to flaky-tests.spec.ts while being fixed
});

// Playwright — skip in CI only
test("sometimes flaky on CI", async ({ page }) => {
  test.skip(!!process.env.CI, "Flaky on CI — tracked in issue #123");
  // runs locally, skipped in CI
});

// Track flaky tests — never just delete them
// Add a comment with: why it is flaky, issue number, expected fix date

// Retry specific known-flaky tests (Playwright only)
test("known intermittent on slow CI", async ({ page }) => {
  test.slow(); // triples the timeout for this test
  // ...
});
```

---

## Phase 17: CI — Parallel Tests, Coverage, Reporting

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  # ─── Unit + Integration — fast, parallel ─────────
  unit:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci

      - name: Run tests with coverage
        run: npx vitest run --coverage
        # Coverage thresholds in vitest.config.ts fail build if not met

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: true

  # ─── E2E — sharded across 4 runners ──────────────
  e2e:
    name: E2E (${{ matrix.shard }}/${{ strategy.job-total }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Build
        run: npm run build

      - name: Run E2E shard ${{ matrix.shard }}/4
        run: npx playwright test
          --shard=${{ matrix.shard }}/4
          --reporter=blob
        env:
          BASE_URL: http://localhost:3000

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report/
          retention-days: 1

  # ─── Merge E2E reports ────────────────────────────
  e2e-report:
    name: Merge E2E Reports
    needs: e2e
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci

      - uses: actions/download-artifact@v4
        with:
          pattern:        blob-report-*
          path:           blob-reports/
          merge-multiple: true

      - run: npx playwright merge-reports --reporter html ./blob-reports

      - uses: actions/upload-artifact@v4
        with:
          name:              playwright-report
          path:              playwright-report/
          retention-days:    30
```

### Monorepo — Only Run Affected Tests

```yaml
# Only run tests for packages affected by the PR
- name: Get affected packages
  id: affected
  run: |
    echo "packages=$(npx nx affected:libs --base=origin/main --plain)" >> $GITHUB_OUTPUT

- name: Run affected tests
  run: npx nx affected:test --base=origin/main --parallel=3
  # Only packages with changed files run — massive CI speedup on large monorepos
```

---

## Anti-Patterns: The Testing Hall of Shame

| Do Not | Do Instead |
|---|---|
| `fireEvent.click(btn)` | `await user.click(btn)` — real browser event sequence |
| `vi.mock("../api/users")` for HTTP | MSW — tests actual fetch logic, not a stub |
| Snapshot entire component trees | Test behavior — snapshots become noise after first commit |
| `container.querySelector(".class")` | `screen.getByRole()` — accessibility-first queries |
| Testing state variable values | Test what the user sees as a result |
| `getByText("Submit")` for buttons | `getByRole("button", { name: /submit/i })` |
| `createTestQueryClient()` inside wrapper function | Create once per test, pass as option — prevents rerenders losing cache |
| Zustand state between tests | `useStore.setState(initialState)` in `beforeEach` |
| Missing `afterEach(() => server.resetHandlers())` | MSW handlers bleed — always reset |
| All handlers in one file | Organize by domain: handlers/users.ts, handlers/products.ts |
| `await new Promise(r => setTimeout(r, 500))` | `await waitFor(...)` or `await screen.findBy...()` |
| Fake timers without `advanceTimers` in userEvent | `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` |
| Date-dependent tests without `vi.setSystemTime` | Pin dates — tests must pass at any time of day/year |
| Hardcoded test data inline in every test | Factories with `buildUser()`, `buildProduct()` — consistent, typed, overridable |
| Testing RSC with Testing Library | Test data layer + presentational component separately, E2E for full page |
| One giant test covering everything | Separate `it()` per behavior — name tells you exactly what broke |
| E2E tests without Page Object Model | POM keeps selectors in one place — refactoring does not break 40 tests |
| Single auth state for all E2E tests | Separate auth files per role — test authorization boundaries |
| `vi.spyOn` without `mockRestore()` | Spy bleeds between tests — always restore |
| Ignoring flaky tests | Quarantine + track in issue — never delete, never ignore |
| No `test.each` for multiple similar cases | `it.each` — eliminates copy-paste, one failure tells you exactly which case |
| Running all E2E tests serially in CI | Shard across 4 workers — 4x faster |

---

## Pre-Ship Testing Checklist

### Setup
- [ ] `renderWithProviders` has all providers (QueryClient, Router, Theme)
- [ ] `createTestQueryClient()` called once per test — NOT inside wrapper function
- [ ] MSW server in `setup.ts` with `onUnhandledRequest: "error"`
- [ ] `server.resetHandlers()` in `afterEach`
- [ ] Zustand store reset in `beforeEach` for affected tests
- [ ] `userEvent.setup()` at describe level — not inside `it()`
- [ ] Test data factories defined — not hardcoded inline

### Unit and Component Coverage
- [ ] Every pure function has unit tests with `it.each` for multiple inputs
- [ ] Every component has: happy path, error state, loading state, empty state
- [ ] Every form has: renders, validation errors, successful submission, failed submission
- [ ] Every modal/dialog has: opens, Escape closes, focus inside, focus restores
- [ ] Custom hooks tested with `renderHook` and appropriate providers

### Async
- [ ] `findBy*` used for elements appearing after async operations
- [ ] `waitForElementToBeRemoved` used for disappearance
- [ ] No `setTimeout` in tests — use `waitFor` and `findBy`
- [ ] Fake timers use `userEvent.setup({ advanceTimers })`
- [ ] Date-dependent tests use `vi.setSystemTime`

### Accessibility
- [ ] `axe(container)` run on every meaningful state of every component
- [ ] Keyboard navigation tested for: Tabs, Modal, Dropdown, Form, any custom widget
- [ ] `aria-live` regions tested — screen reader announcements verified
- [ ] Focus management tested for modals (focus in, Escape, focus restored)

### API and MSW
- [ ] Success path tested with default handler
- [ ] Error path tested with overridden handler returning 4xx/5xx
- [ ] Request payload verified with handler inspection (not vi.mock)
- [ ] Loading state tested (appears before response, disappears after)

### E2E
- [ ] Critical user journeys covered end to end
- [ ] Auth state saved and reused — not logging in per test
- [ ] Admin vs regular user flows both tested
- [ ] Authorization boundaries tested (user cannot access admin routes)
- [ ] Page Object Model used — no raw selectors in test files
- [ ] `expect.soft` for multi-assertion page audits
- [ ] Sharding configured — 4 workers in CI

### CI
- [ ] Unit tests run on every PR
- [ ] E2E tests sharded in CI
- [ ] Coverage thresholds enforced — build fails below threshold
- [ ] Test reports uploaded as artifacts
- [ ] Flaky tests quarantined with issue tracking, not deleted

---

## Quick Reference: Decision Tree

```
What kind of test do I need?

Pure function or utility?
  → Unit test — import and call directly, it.each for multiple inputs

Custom hook?
  → renderHook
  → Wrap with providers if hook uses context/query
  → act() for state mutations

Component (no API calls)?
  → renderWithProviders
  → userEvent for interactions
  → getByRole as primary query

Component with API calls?
  → renderWithProviders
  → MSW handles the requests automatically
  → Test: loading → success, loading → error

Form?
  → Fill with userEvent.type
  → Submit with userEvent.click
  → Test: validation errors, success, API error

Modal or dialog?
  → Test: opens on click, Escape closes,
          focus moves in, focus returns on close
  → axe with dialog open

Multiple similar test cases (validation, formatting)?
  → it.each — eliminates copy-paste

Date-dependent component?
  → vi.setSystemTime to pin the date

Debounced/throttled behavior?
  → vi.useFakeTimers + userEvent.setup({ advanceTimers })

aria-live announcement?
  → Assert role="status" or role="alert" has expected text

React Server Component?
  → Test data function with unit tests
  → Test presentational component with mock data
  → Full page behavior: Playwright E2E

Critical user journey?
  → Playwright E2E with Page Object Model

Multi-role authorization?
  → Separate storageState per role
  → Test what each role can and cannot do

Test is flaky?
  → Find root cause (missing await, leaked state, date dependency)
  → Quarantine with test.skip + issue number while fixing
  → Never just delete it
```

---

> **Tests are not a tax on development — they are documentation that runs. A test suite you trust changes everything: you refactor without fear, you ship without dread, you add features without wondering what broke. The difference between a test suite you trust and one you do not is almost always: testing behavior not implementation, MSW instead of module mocks, factories instead of hardcoded data, and a culture where flaky tests get fixed rather than ignored.**
