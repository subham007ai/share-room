# State Management Skill — Production Grade

## When to Use
Trigger this skill for any request involving:
- React components with `useState`, `useReducer`, or `useContext`
- Global state: user session, cart, theme, permissions, notifications
- Server data fetching, caching, loading, and error states
- Shared state between sibling or distant components
- Real-time state: WebSockets, live updates, polling
- Complex local state: multi-step flows, undo/redo, optimistic updates
- Performance problems caused by unnecessary re-renders
- State in Next.js / SSR environments
- Testing stateful components or stores
- "Why is my component re-rendering too much?"
- "How do I share state between these two components?"
- "Should I use Redux / Zustand / Context for this?"

---

## The State Mindset

State is the hardest part of frontend engineering. Not because the tools are complex — they aren't. Because **the decisions about what to put in state, where to put it, what shape it should take, and what type it is** determine whether an application is maintainable or a mess.

Most state bugs are not bugs in the library. They are bugs in architecture — wrong level, wrong shape, wrong ownership, wrong type.

**Three rules that govern everything:**

1. **State should live as close to where it's used as possible.** Global state is not the default — it's the last resort. Start local. Lift only when you must.
2. **Derived state is not state.** If a value can be computed from existing state, computing it is always better than storing it. Stored derived state goes stale. Computed values cannot.
3. **Server state and client state are fundamentally different problems.** Mixing them in the same store is the root cause of more bugs than almost anything else in frontend development.

---

## Phase 1: Understand Before You Store Anything

Before reaching for any state solution, answer these questions in order:

### Is This Actually State?

Not everything that changes is state. Putting non-state into `useState` causes unnecessary re-renders, complexity, and bugs.

```
IS state (triggers re-render, persists across renders):
  ✓ User's selected tab
  ✓ Whether a modal is open
  ✓ Items in a shopping cart
  ✓ Current authenticated user
  ✓ Form field values (when not using RHF)
  ✓ Async operation status (loading/error/success)

IS NOT state:
  ✗ A value computed from other state   → compute it inline
  ✗ A DOM reference                     → useRef
  ✗ A mutable value that doesn't need   → useRef
    to trigger re-renders (timers, etc)
  ✗ A constant that never changes       → define outside component
  ✗ Data from a server/API              → React Query (server state)
```

### What TYPE of State Is This?

Getting the type wrong is the root cause of most state architecture mistakes.

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL UI STATE                                              │
│  Affects only one component or its direct children          │
│  Examples: modal open/closed, accordion, tab, hover         │
│  Solution: useState or useReducer inside the component      │
├─────────────────────────────────────────────────────────────┤
│  SHARED UI STATE                                             │
│  Needed by multiple components without direct relationship  │
│  Examples: sidebar collapsed, selected theme, language      │
│  Solution: lift to parent → Context → Zustand               │
├─────────────────────────────────────────────────────────────┤
│  SERVER / REMOTE STATE                                       │
│  Lives on a server, has loading state, can go stale         │
│  Examples: user profile, products, orders, notifications    │
│  Solution: React Query or SWR — NEVER useState + useEffect  │
├─────────────────────────────────────────────────────────────┤
│  GLOBAL APP STATE                                            │
│  Application-wide concerns needed anywhere in the tree      │
│  Examples: auth user, permissions, toasts, feature flags    │
│  Solution: Zustand (complex/frequent) or Context (simple)   │
└─────────────────────────────────────────────────────────────┘
```

### What SHAPE Should the State Be?

This is the most overlooked decision in state design. The wrong shape allows impossible states — states that can never occur in reality but your code has to handle anyway.

```typescript
// ❌ Three booleans — allows 8 combinations, but only 4 are valid
// Impossible states: isLoading=true + isSuccess=true simultaneously
const [isLoading, setIsLoading] = useState(false);
const [isError,   setIsError]   = useState(false);
const [isSuccess, setIsSuccess] = useState(false);

// ✅ Discriminated union — only valid states are representable
type Status = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<Status>('idle');

// Pattern: make impossible states unrepresentable
// Before: { user: User | null, isLoggedIn: boolean } → can be inconsistent
// After:  { user: User | null }  → isLoggedIn = !!user (derived, always consistent)

// Before: { items: Item[], isEmpty: boolean } → can be inconsistent
// After:  { items: Item[] }  → isEmpty = items.length === 0 (derived)

// Colocate related state that always changes together
// ❌ Three separate useState calls that always update together
const [lat, setLat]  = useState(0);
const [lng, setLng]  = useState(0);
const [zoom, setZoom] = useState(12);

// ✅ One object — they're conceptually one thing
const [viewport, setViewport] = useState({ lat: 0, lng: 0, zoom: 12 });
```

---

## Phase 2: The Decision Framework — Right Tool Every Time

```
What kind of state is it?
│
├── Can it be COMPUTED from existing state or props?
│   └── YES → Don't store it. Compute inline. useMemo if expensive.
│
├── Does it come from a SERVER / API?
│   └── YES → React Query (useQuery / useMutation)
│              NEVER useState + useEffect for server data
│
├── Used by ONE component only?
│   ├── Simple value (bool, string, number)    → useState
│   ├── Complex object / multiple sub-values   → useReducer
│   ├── DOM ref / timer / non-render value     → useRef
│   └── Expensive to compute from other state → useMemo
│
├── Used by a FEW NEARBY components?
│   ├── Try component composition first        → pass children/render props
│   └── Lift to nearest common parent          → props drilling (max 2 levels)
│
├── Used by MANY DISTANT components?
│   ├── Changes rarely (theme, locale, user)   → React Context
│   └── Changes often OR complex actions       → Zustand
│
├── Should survive PAGE REFRESH?
│   ├── Single simple value                    → useLocalStorage hook
│   └── Complex store                          → Zustand persist middleware
│
└── Should be SHAREABLE / BOOKMARKABLE?
    └── YES → URL state (useSearchParams)
              Filters, pagination, tabs, active view
```

> **Rule:** If you reach for Redux before considering `useState`, `useReducer`, or React Query, you've skipped the decision entirely. Redux is almost never the right answer for new projects.

---

## Phase 3: Local State — useState, useReducer, useRef

### useState — The Default

```tsx
// ─── Correct useState patterns ────────────────────

// Boolean toggle — always use functional update
const [isOpen, setIsOpen] = useState(false);
const toggle = () => setIsOpen(prev => !prev);

// Object — ALWAYS spread, never mutate directly
const [user, setUser] = useState({ name: '', email: '', role: 'user' });
const updateEmail = (email: string) =>
  setUser(prev => ({ ...prev, email }));   // spread preserves other fields
// NEVER: user.email = email; setUser(user) ← mutation, React won't re-render

// Array — always return new array
const [items, setItems] = useState<Item[]>([]);
const addItem    = (item: Item) =>
  setItems(prev => [...prev, item]);
const removeItem = (id: string) =>
  setItems(prev => prev.filter(i => i.id !== id));
const updateItem = (id: string, changes: Partial<Item>) =>
  setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));

// Lazy initialization — for expensive initial values
const [data, setData] = useState(() => {
  // Only runs once on mount, not on every render
  return JSON.parse(localStorage.getItem('data') || '[]');
});
```

### useReducer — When useState Becomes Painful

Switch to `useReducer` when you have 3+ related state values, state transitions have names, or next state depends on previous in complex ways.

```tsx
// ─── State machine with useReducer ────────────────

// Step 1: Define all valid states — no impossible combinations
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Step 2: Define all valid transitions
type AsyncAction<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'RESET' };

// Step 3: Pure reducer — no side effects, no async, always returns state
function asyncReducer<T>(
  state: AsyncState<T>,
  action: AsyncAction<T>
): AsyncState<T> {
  switch (action.type) {
    case 'FETCH_START':   return { status: 'loading' };
    case 'FETCH_SUCCESS': return { status: 'success', data: action.payload };
    case 'FETCH_ERROR':   return { status: 'error', error: action.payload };
    case 'RESET':         return { status: 'idle' };
    default:              return state;
  }
}

// Step 4: Use it — clear, named transitions
const UserProfile = ({ userId }: { userId: string }) => {
  const [state, dispatch] = useReducer(asyncReducer<User>, { status: 'idle' });

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    fetchUser(userId)
      .then(user => dispatch({ type: 'FETCH_SUCCESS', payload: user }))
      .catch(err  => dispatch({ type: 'FETCH_ERROR',  payload: err.message }));
  }, [userId]);

  // TypeScript narrows the type in each branch — full type safety
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error')   return <ErrorMessage message={state.error} />;
  if (state.status === 'idle')    return null;
  return <Profile user={state.data} />;  // TypeScript knows data exists here
};
```

### useRef — Mutable Values Without Re-renders

```tsx
// ─── useRef use cases ──────────────────────────────

// 1. DOM reference
const inputRef = useRef<HTMLInputElement>(null);
const focusInput = () => inputRef.current?.focus();

// 2. Persisting value across renders WITHOUT triggering re-render
const renderCount = useRef(0);
renderCount.current++;  // mutate directly — intentional

// 3. Previous value comparison
const prevValueRef = useRef(value);
useEffect(() => { prevValueRef.current = value; });
const prevValue = prevValueRef.current;

// 4. Timer / interval IDs (cleanup without re-render)
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const startTimer = () => { timerRef.current = setTimeout(doSomething, 3000); };
const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

// 5. Stable callback reference inside effects (avoids stale closure)
const callbackRef = useRef(onDataChange);
useEffect(() => { callbackRef.current = onDataChange; }); // always latest
// Then inside effects: callbackRef.current() always calls latest version

// 6. Track mounted state (avoid setState on unmounted component)
const isMountedRef = useRef(true);
useEffect(() => () => { isMountedRef.current = false; }, []);
// Guard: if (isMountedRef.current) setState(...)
```

### Derived State — Compute, Never Store

```tsx
// ❌ Wrong: stored derived state goes stale
const [items, setItems]               = useState<Item[]>([]);
const [totalCount, setTotalCount]     = useState(0);        // derived
const [hasItems, setHasItems]         = useState(false);    // derived
const [filteredItems, setFiltered]    = useState<Item[]>([]); // derived

// ✅ Correct: compute inline — always fresh, zero sync bugs
const [items,  setItems]  = useState<Item[]>([]);
const [filter, setFilter] = useState<string>('all');
const [query,  setQuery]  = useState('');

// Derived — computed every render, always correct
const totalCount    = items.length;
const hasItems      = items.length > 0;
const filteredItems = items.filter(i =>
  (filter === 'all' || i.status === filter) &&
  i.name.toLowerCase().includes(query.toLowerCase())
);
const completedPct  = items.length
  ? (items.filter(i => i.completed).length / items.length) * 100
  : 0;

// Expensive derived → useMemo (only when actually slow)
const sortedItems = useMemo(
  () => [...filteredItems].sort((a, b) => b.score - a.score),
  [filteredItems]
);
```

---

## Phase 4: Lifting State and Component Composition

### Lift Before You Reach for Context

Lifting state to the nearest common parent is always the first solution for shared state — before Context, before Zustand.

```tsx
// ❌ State trapped — siblings can't communicate
const TabList = () => {
  const [activeTab, setActiveTab] = useState('overview'); // trapped
  return <button onClick={() => setActiveTab('settings')}>Settings</button>;
};
const TabContent = () => {
  // Can't access activeTab from TabList
  return <div>???</div>;
};

// ✅ Lift to common parent
const Tabs = () => {
  const [activeTab, setActiveTab] = useState('overview'); // lifted

  return (
    <div>
      <TabList activeTab={activeTab} onTabChange={setActiveTab} />
      <TabContent activeTab={activeTab} />
    </div>
  );
};
```

### Component Composition — Often Eliminates Lifting Entirely

Before lifting state, try passing components as children. This often avoids the need to lift at all.

```tsx
// ❌ Prop drilling through intermediary that doesn't use the data
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  return <Layout user={user} onLogout={() => setUser(null)} />;
  // Layout just passes user/onLogout to Header — it never uses them itself
};

// ✅ Composition — Layout receives a rendered component, not raw data
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  return (
    <Layout
      header={<Header user={user} onLogout={() => setUser(null)} />}
    />
  );
};

const Layout = ({ header }: { header: React.ReactNode }) => (
  <div>
    {header}  {/* Layout renders whatever it receives */}
    <main>...</main>
  </div>
);
```

### When Prop Drilling Becomes a Problem

```
Acceptable (2 levels):    GrandParent → Parent → Child
Prop drilling (3+ levels): App → Layout → Page → Section → Widget → Button

Signs you have a problem:
  - Adding a prop to a component just to pass to its child (never uses it)
  - Updating 4+ files when a prop changes
  - Intermediate components have props they never reference

Solutions in order of preference:
  1. Component composition  — pass children/slots, avoid passing data through layers
  2. React Context          — for static/infrequently changing global values
  3. Zustand                — for frequently changing values or complex logic
```

---

## Phase 5: React Context — Global Singletons Done Right

### When Context IS Right
- Current authenticated user (changes once per session)
- Active theme / color scheme (changes rarely)
- Current language / locale (changes rarely)
- Feature flags (changes on deploy, not during session)

### When Context IS WRONG
- Frequently updating state → Every context update re-renders ALL consumers
- Shopping cart, notifications, real-time data → Use Zustand
- Server data → Use React Query
- Form state → Use React Hook Form

### Complete Context Pattern

```tsx
// ─── Theme Context — full production pattern ──────

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
};

// undefined default forces consumers to be inside a provider
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'; // SSR safe
    return (localStorage.getItem('theme') as Theme) ?? 'system';
  });

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme !== 'system') return theme;
    if (typeof window === 'undefined') return 'light'; // SSR safe default
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') localStorage.setItem('theme', t);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // Memoize value — prevents all consumers from re-rendering when
  // parent re-renders for unrelated reasons
  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook — throws helpful error if used outside provider
export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};
```

### Auth Context — Complete Implementation

```tsx
type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
};

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' };

type AuthContextType = {
  state: AuthState;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  login:  (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Check existing session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(user => setState(
        user
          ? { status: 'authenticated', user }
          : { status: 'unauthenticated' }
      ))
      .catch(() => setState({ status: 'unauthenticated' }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const user = await res.json();
    setState({ status: 'authenticated', user });
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setState({ status: 'unauthenticated' });
  }, []);

  const value = useMemo(() => ({
    state,
    isLoading:       state.status === 'loading',
    isAuthenticated: state.status === 'authenticated',
    user:            state.status === 'authenticated' ? state.user : null,
    login,
    logout,
  }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

// ─── Protected route ──────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading)       return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
```

### Split Contexts for Performance

```tsx
// ❌ One context — ALL consumers re-render on every notification
const AppContext = createContext({
  user: null,          // changes once per session
  theme: 'light',      // changes rarely
  notifications: [],   // changes constantly
  cartCount: 0,        // changes on every add/remove
});

// ✅ Split by update frequency — each consumer only re-renders for its data
const UserContext  = createContext(null); // re-renders: login/logout only
const ThemeContext = createContext(null); // re-renders: theme change only
const NotifContext = createContext(null); // re-renders: each notification

// Compose providers cleanly
const Providers = ({ children }: { children: React.ReactNode }) => (
  <UserContext.Provider value={userValue}>
    <ThemeContext.Provider value={themeValue}>
      <NotifContext.Provider value={notifValue}>
        {children}
      </NotifContext.Provider>
    </ThemeContext.Provider>
  </UserContext.Provider>
);
```

---

## Phase 6: Zustand — Lightweight Global State

### When to Choose Zustand Over Context
- State changes frequently (cart, notifications, UI preferences)
- Multiple components need to read AND write the same state
- State has complex update logic (multiple action types)
- State needs to be persisted across page refreshes
- You'd otherwise put a `useReducer` inside a Context

### Store Patterns

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ─── Simple store ─────────────────────────────────
type CounterStore = {
  count: number;
  increment:   () => void;
  decrement:   () => void;
  reset:       () => void;
  incrementBy: (n: number) => void;
};

const useCounterStore = create<CounterStore>()(
  devtools(
    (set) => ({
      count: 0,
      increment:     () => set(s => ({ count: s.count + 1 }), false, 'increment'),
      decrement:     () => set(s => ({ count: s.count - 1 }), false, 'decrement'),
      reset:         () => set({ count: 0 },                  false, 'reset'),
      incrementBy: (n) => set(s => ({ count: s.count + n }),  false, 'incrementBy'),
    }),
    { name: 'counter-store' }
  )
);

// ─── Cart store with persistence ─────────────────
type CartItem = { id: string; name: string; price: number; qty: number };

type CartStore = {
  items:      CartItem[];
  addItem:    (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: string) => void;
  updateQty:  (id: string, qty: number) => void;
  clearCart:  () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

const useCartStore = create<CartStore>()(
  persist(
    devtools(
      (set, get) => ({
        items: [],

        addItem: (product) => set(state => {
          const existing = state.items.find(i => i.id === product.id);
          return {
            items: existing
              ? state.items.map(i =>
                  i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
              : [...state.items, { ...product, qty: 1 }]
          };
        }, false, 'addItem'),

        removeItem: (id) => set(
          state => ({ items: state.items.filter(i => i.id !== id) }),
          false, 'removeItem'
        ),

        updateQty: (id, qty) => set(
          state => ({
            items: qty <= 0
              ? state.items.filter(i => i.id !== id)
              : state.items.map(i => i.id === id ? { ...i, qty } : i)
          }),
          false, 'updateQty'
        ),

        clearCart: () => set({ items: [] }, false, 'clearCart'),

        // Computed getters — use get(), never store these
        totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
        totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      }),
      { name: 'cart-store' }
    ),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // persist only data, not functions
    }
  )
);

// ─── Toast / notification store ───────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
type Toast     = { id: string; type: ToastType; message: string; duration?: number };

type ToastStore = {
  toasts:      Toast[];
  addToast:    (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll:    () => void;
};

const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
    if (toast.duration !== 0) {
      setTimeout(() => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
      }, toast.duration ?? 4000);
    }
  },

  removeToast: (id) =>
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  clearAll: () => set({ toasts: [] }),
}));

// Convenience hook
export const useToast = () => {
  const { addToast } = useToastStore();
  return {
    success: (msg: string) => addToast({ type: 'success', message: msg }),
    error:   (msg: string) => addToast({ type: 'error',   message: msg, duration: 0 }),
    warning: (msg: string) => addToast({ type: 'warning', message: msg }),
    info:    (msg: string) => addToast({ type: 'info',    message: msg }),
  };
};
```

### Zustand Slices — Scaling Large Stores

When a store grows beyond one logical concern, split it into slices and compose them.

```typescript
import { StateCreator } from 'zustand';

// ─── Define each slice independently ─────────────

type UserSlice = {
  user: User | null;
  setUser:   (user: User | null) => void;
  clearUser: () => void;
};

type SettingsSlice = {
  theme:     'light' | 'dark';
  language:  string;
  setTheme:  (theme: 'light' | 'dark') => void;
  setLang:   (lang: string) => void;
};

type UISlice = {
  isSidebarOpen:  boolean;
  toggleSidebar:  () => void;
};

// Slice creators — each is independent
const createUserSlice: StateCreator<
  UserSlice & SettingsSlice & UISlice, [], [], UserSlice
> = (set) => ({
  user:      null,
  setUser:   (user)  => set({ user }),
  clearUser: ()      => set({ user: null }),
});

const createSettingsSlice: StateCreator<
  UserSlice & SettingsSlice & UISlice, [], [], SettingsSlice
> = (set) => ({
  theme:    'light',
  language: 'en',
  setTheme: (theme) => set({ theme }),
  setLang:  (lang)  => set({ language: lang }),
});

const createUISlice: StateCreator<
  UserSlice & SettingsSlice & UISlice, [], [], UISlice
> = (set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),
});

// ─── Compose into one store ───────────────────────
const useAppStore = create<UserSlice & SettingsSlice & UISlice>()(
  devtools(
    persist(
      (...args) => ({
        ...createUserSlice(...args),
        ...createSettingsSlice(...args),
        ...createUISlice(...args),
      }),
      { name: 'app-storage', partialize: (s) => ({ theme: s.theme, language: s.language }) }
    ),
    { name: 'app-store' }
  )
);

// ─── Usage — selective subscriptions ─────────────
// Subscribe only to what the component needs
const theme         = useAppStore(s => s.theme);
const isSidebarOpen = useAppStore(s => s.isSidebarOpen);
const toggleSidebar = useAppStore(s => s.toggleSidebar); // stable reference

// Multiple fields — use shallow to prevent unnecessary re-renders
import { useShallow } from 'zustand/react/shallow';
const { theme, language } = useAppStore(
  useShallow(s => ({ theme: s.theme, language: s.language }))
);
```

---

## Phase 7: Server State — React Query

Server state is not the same problem as client state. It has loading, error, caching, refetching, and staleness concerns that no client state library handles well.

### Why useState + useEffect Is Wrong for Server Data

```tsx
// ❌ The naive approach — looks fine, has 7 hidden problems
const UserProfile = ({ userId }: { userId: string }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => { setUser(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [userId]);

  // Hidden problems:
  // 1. No caching — fetches on every mount even if data is seconds old
  // 2. No deduplication — two components mounting = two identical requests
  // 3. No background refresh — stale data after tab switch
  // 4. No retry logic on failure
  // 5. Race condition if userId changes rapidly
  // 6. Memory leak if component unmounts mid-fetch
  // 7. 20 lines of boilerplate for every data fetch in the app
};

// ✅ React Query — all 7 problems solved, 4 lines
const UserProfile = ({ userId }: { userId: string }) => {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', userId],
    queryFn:  () => fetch(`/api/users/${userId}`).then(r => r.json()),
  });

  if (isLoading) return <Skeleton />;
  if (error)     return <ErrorMessage message={(error as Error).message} />;
  return <Profile user={user} />;
};
```

### Setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 5,   // data fresh for 5 min
      gcTime:               1000 * 60 * 10,  // cache kept for 10 min
      retry:                3,
      retryDelay:           (n) => Math.min(1000 * 2 ** n, 30_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect:   true,
    },
    mutations: { retry: 0 }, // never retry mutations — side effects
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
    {process.env.NODE_ENV === 'development' && (
      <ReactQueryDevtools initialIsOpen={false} />
    )}
  </QueryClientProvider>
);
```

### Query Key Convention — Centralize to Eliminate Magic Strings

```typescript
// queryKeys.ts — single source of truth for all query keys
export const queryKeys = {
  users: {
    all:     ()           => ['users']              as const,
    detail:  (id: string) => ['users', id]          as const,
    posts:   (id: string) => ['users', id, 'posts'] as const,
  },
  products: {
    all:      ()              => ['products']           as const,
    filtered: (f: Filters)    => ['products', f]        as const,
    detail:   (id: string)    => ['products', id]       as const,
  },
};

// Usage — no magic strings scattered through codebase
const { data } = useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn:  () => api.getUser(userId),
});

// Hierarchical invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }); // invalidates ALL user queries
queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) }); // one user only
```

### Query Patterns — Every Scenario

```tsx
// ─── Basic ────────────────────────────────────────
const useUser = (userId: string) => useQuery({
  queryKey: queryKeys.users.detail(userId),
  queryFn:  () => api.getUser(userId),
  enabled:  !!userId,  // don't run if userId empty
});

// ─── With filters ─────────────────────────────────
const useProducts = (filters: Filters) => useQuery({
  queryKey: queryKeys.products.filtered(filters),
  queryFn:  () => api.getProducts(filters),
  placeholderData: keepPreviousData, // show stale data while new loads (pagination UX)
});

// ─── Dependent query ──────────────────────────────
const useUserPosts = (userId: string) => {
  const { data: user } = useUser(userId);
  return useQuery({
    queryKey: queryKeys.users.posts(userId),
    queryFn:  () => api.getUserPosts(userId),
    enabled:  !!user,  // only runs after user resolves
  });
};

// ─── Parallel queries ─────────────────────────────
const useDashboard = () => {
  const users    = useQuery({ queryKey: queryKeys.users.all(),    queryFn: api.getUsers });
  const products = useQuery({ queryKey: queryKeys.products.all(), queryFn: api.getProducts });
  return {
    isLoading: users.isLoading || products.isLoading,
    data: { users: users.data, products: products.data },
  };
};

// ─── Infinite scroll ──────────────────────────────
const useInfinitePosts = () => useInfiniteQuery({
  queryKey:        ['posts', 'infinite'],
  queryFn:         ({ pageParam }) => api.getPosts({ cursor: pageParam, limit: 20 }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

const PostFeed = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePosts();
  const posts = data?.pages.flatMap(p => p.posts) ?? [];

  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
};
```

### Mutations — Create, Update, Delete

```tsx
// ─── Mutation with optimistic update ─────────────
const useToggleTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api.updateTodo(id, { completed }),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const snapshot = queryClient.getQueryData<Todo[]>(['todos']);

      queryClient.setQueryData<Todo[]>(['todos'], old =>
        old?.map(t => t.id === id ? { ...t, completed } : t) ?? []
      );

      return { snapshot }; // returned as context for rollback
    },

    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['todos'], context.snapshot);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

// ─── Create mutation ──────────────────────────────
const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => api.createPost(input),
    onSuccess: (post) => {
      // Add to cache immediately — no refetch needed
      queryClient.setQueryData<Post[]>(
        queryKeys.products.all(),
        old => [post, ...(old ?? [])]
      );
    },
  });
};
```

---

## Phase 8: State in Next.js / SSR — The Missing Section

SSR changes everything about how state initializes. This is where most state patterns break when moved to Next.js App Router or any server-rendered environment.

### The Core SSR State Problems

```
Problem 1: localStorage / sessionStorage don't exist on the server
Problem 2: window / document don't exist on the server
Problem 3: React Query needs server-prefetched data to avoid loading flash
Problem 4: Zustand stores initialize fresh on every server render
Problem 5: Context initial values need to come from server, not hardcoded
```

### SSR-Safe useState Initialization

```tsx
// ❌ Crashes on server — localStorage doesn't exist in Node.js
const [theme, setTheme] = useState(
  localStorage.getItem('theme') ?? 'light'  // ReferenceError on server
);

// ✅ Lazy initializer with typeof check
const [theme, setTheme] = useState<'light' | 'dark'>(() => {
  if (typeof window === 'undefined') return 'light'; // server: safe default
  return (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light';
});

// ✅ useEffect for client-only initialization (no hydration mismatch)
const [mounted, setMounted] = useState(false);
const [theme, setTheme]     = useState<'light' | 'dark'>('light');

useEffect(() => {
  setMounted(true);
  setTheme((localStorage.getItem('theme') as 'light' | 'dark') ?? 'light');
}, []);

// Render server-compatible UI until mounted
if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>;
```

### React Query with Next.js App Router (Server Prefetching)

```tsx
// ─── Server Component — prefetch data ────────────
// app/users/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function UsersPage() {
  const queryClient = new QueryClient();

  // Prefetch on the server — data is in cache when client renders
  await queryClient.prefetchQuery({
    queryKey: queryKeys.users.all(),
    queryFn:  () => api.getUsers(), // server-side fetch
  });

  return (
    // Serialize and send cache to client
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserList /> {/* Client component — cache already populated */}
    </HydrationBoundary>
  );
}

// ─── Client Component — uses prefetched data ─────
// components/UserList.tsx
'use client';

const UserList = () => {
  const { data: users } = useQuery({
    queryKey: queryKeys.users.all(),
    queryFn:  api.getUsers,
    // Data is already in cache from server prefetch
    // No loading state flash — renders immediately
  });

  return <ul>{users?.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
};
```

### Zustand with SSR — Preventing Store Leaks

```tsx
// ─── Problem: Zustand store is a singleton
// In SSR, one store instance can bleed between different users' requests
// Solution: create store per request on the server

// store/counter.ts
import { createStore } from 'zustand';

type CounterStore = { count: number; increment: () => void };

// Factory function — creates a NEW store instance each time
export const createCounterStore = (initCount = 0) =>
  createStore<CounterStore>()((set) => ({
    count: initCount,
    increment: () => set(s => ({ count: s.count + 1 })),
  }));

// providers/CounterProvider.tsx
'use client';
import { createContext, useRef, useContext } from 'react';
import { useStore } from 'zustand';
import { createCounterStore } from '@/store/counter';

type CounterStoreApi = ReturnType<typeof createCounterStore>;
const CounterContext = createContext<CounterStoreApi | undefined>(undefined);

export const CounterProvider = ({
  children,
  initialCount = 0,
}: {
  children: React.ReactNode;
  initialCount?: number;
}) => {
  // useRef ensures one store instance per component tree, not per render
  const storeRef = useRef<CounterStoreApi | null>(null);
  if (!storeRef.current) {
    storeRef.current = createCounterStore(initialCount);
  }

  return (
    <CounterContext.Provider value={storeRef.current}>
      {children}
    </CounterContext.Provider>
  );
};

export const useCounterStore = <T,>(selector: (s: CounterStore) => T) => {
  const store = useContext(CounterContext);
  if (!store) throw new Error('useCounterStore must be used inside <CounterProvider>');
  return useStore(store, selector);
};
```

---

## Phase 9: Error Boundaries for Stateful Components

Error boundaries catch render errors caused by bad state — unexpected nulls, malformed data, missing context. Without them, a single state error crashes the entire app.

```tsx
// ─── Error Boundary class component ──────────────
// (Must be a class — no hooks equivalent for componentDidCatch)

type ErrorBoundaryState = {
  hasError:    boolean;
  error:       Error | null;
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onError?: (e: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to error tracking service
    console.error('ErrorBoundary caught:', error, info.componentStack);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert" style={{ padding: 24, color: '#dc2626' }}>
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Usage — wrap every data-driven section ───────
const Dashboard = () => (
  <ErrorBoundary fallback={<DashboardError />}>
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={reset}
          fallback={<button onClick={reset}>Retry</button>}
        >
          <DashboardContent />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  </ErrorBoundary>
);

// ─── React Query error boundary integration ───────
// Wrap React Query with suspense + error boundary for clean data fetching
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary onError={reset} fallback={<ErrorFallback onRetry={reset} />}>
        <Suspense fallback={<Skeleton />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
);
```

---

## Phase 10: Performance — Right Order, Right Tools

> **Critical rule:** The correct order is colocate → split context → memoize. Never jump to memoization first. It has overhead and masks architectural problems.

### Step 1: Colocate State First (Most Effective)

Moving state down to where it's used is the highest-leverage performance optimization — free, zero overhead, eliminates cascading re-renders.

```tsx
// ❌ State at top — entire app re-renders on every hover
const App = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <Layout>
      <Header />     {/* re-renders on hover — never uses hoveredId */}
      <Sidebar />    {/* re-renders on hover — never uses hoveredId */}
      <ProductGrid hoveredId={hoveredId} onHover={setHoveredId} />
    </Layout>
  );
};

// ✅ State colocated in ProductCard — only that card re-renders
const ProductCard = ({ product }: { product: Product }) => {
  const [isHovered, setIsHovered] = useState(false); // lives here now
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transform: isHovered ? 'scale(1.02)' : 'scale(1)' }}
    >
      {product.name}
    </div>
  );
};
```

### Step 2: Split Context If Still Re-rendering

Already covered in Phase 5. Separate contexts by update frequency.

### Step 3: Memoize — Only When Measured

```tsx
// useMemo — only for genuinely expensive computations
// ❌ Pointless — cheap operation
const doubled = useMemo(() => count * 2, [count]);

// ✅ Justified — expensive sort + filter on large list
const processedItems = useMemo(
  () => items
    .filter(i => i.category === filter)
    .sort((a, b) => b.score - a.score),
  [items, filter]
);

// useCallback — only when passing to memoized children or as effect deps
// ❌ Pointless if child is not memoized
const handleClick = useCallback(() => doSomething(id), [id]);

// ✅ Justified — child is React.memo'd
const handleDelete = useCallback(
  (id: string) => deleteItem(id),
  [deleteItem]
);
<MemoizedItem onDelete={handleDelete} />

// React.memo — only on expensive components that re-render often
// ✅ Justified — receives callbacks, renders a list, complex output
const TodoItem = React.memo(({ todo, onToggle, onDelete }: Props) => (
  <li>
    <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
    <span>{todo.text}</span>
    <button onClick={() => onDelete(todo.id)}>×</button>
  </li>
));
```

---

## Phase 11: Advanced Patterns

### useLocalStorage Hook

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue; // SSR safe
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = newValue instanceof Function ? newValue(prev) : newValue;
      try { localStorage.setItem(key, JSON.stringify(resolved)); }
      catch { /* storage full — fail silently */ }
      return resolved;
    });
  }, [key]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try { setValue(JSON.parse(e.newValue)); }
        catch { /* corrupt value */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [value, setStoredValue] as const;
}

// Usage
const [theme, setTheme]     = useLocalStorage<'light' | 'dark'>('theme', 'light');
const [sidebar, setSidebar] = useLocalStorage('sidebar-open', true);
```

### URL as State — Shareable, Bookmarkable

```tsx
import { useSearchParams } from 'react-router-dom';

function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const val = searchParams.get(key);
      if (val !== null) result[key] = val as T[typeof key];
    }
    return result;
  }, [searchParams]);

  const setState = useCallback((updates: Partial<T>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, val] of Object.entries(updates)) {
        if (val === defaults[key]) next.delete(key); // keep URL clean
        else next.set(key, String(val));
      }
      return next;
    }, { replace: true });
  }, [defaults, setSearchParams]);

  return [state, setState] as const;
}

// Usage — filters, pagination, sorting all in URL
const ProductList = () => {
  const [filters, setFilters] = useUrlState({
    category: 'all',
    sort:     'newest',
    page:     '1',
    q:        '',
  });

  // URL: /products?category=electronics&sort=price&page=2
  // Shareable ✅  Bookmarkable ✅  Browser back works ✅
};
```

### Undo / Redo

```tsx
function useUndoable<T>(initial: T) {
  const [history, dispatch] = useReducer(
    (state: { past: T[]; present: T; future: T[] }, action: { type: 'SET' | 'UNDO' | 'REDO'; payload?: T }) => {
      switch (action.type) {
        case 'SET':
          return {
            past:    [...state.past, state.present],
            present: action.payload as T,
            future:  [],
          };
        case 'UNDO':
          if (!state.past.length) return state;
          return {
            past:    state.past.slice(0, -1),
            present: state.past[state.past.length - 1],
            future:  [state.present, ...state.future],
          };
        case 'REDO':
          if (!state.future.length) return state;
          return {
            past:    [...state.past, state.present],
            present: state.future[0],
            future:  state.future.slice(1),
          };
        default: return state;
      }
    },
    { past: [], present: initial, future: [] }
  );

  return {
    state:   history.present,
    set:     (val: T) => dispatch({ type: 'SET', payload: val }),
    undo:    ()       => dispatch({ type: 'UNDO' }),
    redo:    ()       => dispatch({ type: 'REDO' }),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
```

### Real-Time State — WebSocket + React Query

```tsx
const useRealtimeData = <T extends { id: string }>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T[]>,
  wsUrl: string
) => {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey, queryFn });

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      const { type, payload } = JSON.parse(e.data) as {
        type: 'CREATED' | 'UPDATED' | 'DELETED';
        payload: T;
      };

      queryClient.setQueryData<T[]>(queryKey, old => {
        const current = old ?? [];
        switch (type) {
          case 'CREATED': return [payload, ...current];
          case 'UPDATED': return current.map(i => i.id === payload.id ? payload : i);
          case 'DELETED': return current.filter(i => i.id !== payload.id);
        }
      });
    };

    ws.onerror = () => {
      // Fallback: full refetch if WebSocket fails
      queryClient.invalidateQueries({ queryKey });
    };

    return () => ws.close();
  }, [queryKey, queryClient, wsUrl]);

  return query;
};
```

---

## Phase 12: Testing State — The Complete Guide

### Testing useState and useReducer

```tsx
import { renderHook, act } from '@testing-library/react';

// ─── Test a custom hook ───────────────────────────
describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => { result.current.increment(); });

    expect(result.current.count).toBe(1);
  });

  it('does not go below 0', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => { result.current.decrement(); });

    expect(result.current.count).toBe(0); // floored at 0
  });
});

// ─── Test a component with state ─────────────────
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('TodoList', () => {
  it('adds a new todo', async () => {
    const user = userEvent.setup();
    render(<TodoList />);

    await user.type(screen.getByPlaceholderText('Add todo...'), 'Write tests');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('Write tests')).toBeInTheDocument();
  });

  it('marks todo as complete', async () => {
    const user = userEvent.setup();
    render(<TodoList initialItems={[{ id: '1', text: 'Test', completed: false }]} />);

    await user.click(screen.getByRole('checkbox'));

    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
```

### Testing Zustand Stores

```tsx
import { act, renderHook } from '@testing-library/react';

// ─── Test store in isolation ──────────────────────
describe('useCartStore', () => {
  // Reset store before each test — critical to prevent test pollution
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({ id: '1', name: 'Widget', price: 9.99 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(1);
  });

  it('increments qty when same item added twice', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({ id: '1', name: 'Widget', price: 9.99 });
      result.current.addItem({ id: '1', name: 'Widget', price: 9.99 });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(2);
  });

  it('calculates total price correctly', () => {
    useCartStore.setState({
      items: [
        { id: '1', name: 'A', price: 10, qty: 2 },
        { id: '2', name: 'B', price: 5,  qty: 1 },
      ]
    });
    expect(useCartStore.getState().totalPrice()).toBe(25);
  });
});
```

### Testing Context

```tsx
// ─── Test helper: wrap with all providers ────────
const renderWithProviders = (
  ui: React.ReactElement,
  {
    user,
    theme = 'light',
  }: { user?: User; theme?: 'light' | 'dark' } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider initialUser={user}>
      <ThemeProvider initialTheme={theme}>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper });
};

// ─── Use in tests ─────────────────────────────────
describe('ProfilePage', () => {
  it('shows user name when authenticated', () => {
    const mockUser = { id: '1', name: 'Jane Doe', email: 'jane@example.com', role: 'user' as const };

    renderWithProviders(<ProfilePage />, { user: mockUser });

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('redirects to login when unauthenticated', () => {
    renderWithProviders(<ProfilePage />); // no user

    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
```

### Testing React Query

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw'; // mock service worker
import { setupServer } from 'msw/node';

// ─── Mock API server ──────────────────────────────
const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Jane Doe', email: 'jane@test.com' });
  }),
  http.post('/api/todos', async ({ request }) => {
    const body = await request.json() as { text: string };
    return HttpResponse.json({ id: '123', text: body.text, completed: false });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test helper: fresh QueryClient per test ──────
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,         // don't retry in tests — fail fast
      gcTime: Infinity,     // don't garbage collect during test
    },
  },
});

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

// ─── Tests ────────────────────────────────────────
describe('UserProfile', () => {
  it('shows loading state initially', () => {
    renderWithQuery(<UserProfile userId="1" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows user data after load', async () => {
    renderWithQuery(<UserProfile userId="1" />);
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/api/users/:id', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    );

    renderWithQuery(<UserProfile userId="1" />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
```

---

## Phase 13: Vanilla JS State (No Framework)

```html
<script>
// ─── Minimal reactive store for vanilla JS ────────
const createStore = (initialState, reducers) => {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState: () => ({ ...state }),  // return copy — prevent external mutation

    dispatch: (type, payload) => {
      const reducer = reducers[type];
      if (!reducer) { console.warn(`Unknown action: ${type}`); return; }
      const nextState = reducer(state, payload);
      if (nextState === state) return; // no change — skip re-render
      state = nextState;
      listeners.forEach(fn => fn(state));
    },

    subscribe: (fn) => {
      listeners.add(fn);
      fn(state); // call immediately with current state
      return () => listeners.delete(fn); // return unsubscribe function
    },
  };
};

// ─── Define store ─────────────────────────────────
const store = createStore(
  { todos: [], filter: 'all', isLoading: false },
  {
    ADD_TODO:    (s, text) => ({
      ...s,
      todos: [...s.todos, { id: Date.now().toString(), text, completed: false }]
    }),
    TOGGLE_TODO: (s, id) => ({
      ...s,
      todos: s.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }),
    DELETE_TODO: (s, id) => ({
      ...s,
      todos: s.todos.filter(t => t.id !== id)
    }),
    SET_FILTER:  (s, filter) => ({ ...s, filter }),
    SET_LOADING: (s, isLoading) => ({ ...s, isLoading }),
  }
);

// ─── Render function ──────────────────────────────
const render = ({ todos, filter, isLoading }) => {
  document.getElementById('loading').hidden = !isLoading;

  const filtered = filter === 'all'
    ? todos
    : todos.filter(t => t.completed === (filter === 'completed'));

  const list = document.getElementById('todo-list');
  list.innerHTML = filtered.map(todo => `
    <li style="text-decoration: ${todo.completed ? 'line-through' : 'none'}">
      <input type="checkbox" ${todo.completed ? 'checked' : ''}
             onchange="store.dispatch('TOGGLE_TODO', '${todo.id}')" />
      ${todo.text}
      <button onclick="store.dispatch('DELETE_TODO', '${todo.id}')">×</button>
    </li>
  `).join('');

  document.getElementById('count').textContent =
    `${todos.filter(t => !t.completed).length} remaining`;
};

store.subscribe(render);
</script>
```

---

## Anti-Patterns: The State Hall of Shame

| ❌ Don't | ✅ Do Instead |
|---|---|
| Store derived values | Compute inline or with `useMemo` |
| `useState + useEffect` for API data | React Query — always |
| One giant global state object | Colocate; split stores by concern |
| Context for frequently-changing state | Zustand — Context re-renders all consumers |
| `useEffect` to sync state to state | Compute derived values, never sync them |
| Mutate state directly | Return new objects/arrays always |
| Reach for Redux on new projects | `useState` → `useReducer` → Zustand → Redux |
| Store UI state (hover, open) globally | Keep local UI state in the component |
| Three booleans for async status | Discriminated union: `'idle' \| 'loading' \| 'success' \| 'error'` |
| Ignore loading/error/empty states | Handle all four states every time |
| Ignore URL for shareable state | Filters, pagination, tabs belong in URL |
| Store in state what belongs in URL | Use `useSearchParams` for shareable state |
| `localStorage` access without SSR guard | Always `typeof window !== 'undefined'` check |
| No error boundary around stateful sections | Wrap every data-driven section |
| One Zustand store for everything | Use slices or separate stores by domain |
| `useMemo`/`useCallback` everywhere | Measure first; memoize only what's slow |
| No `beforeEach` store reset in tests | Always reset Zustand stores between tests |
| Mock API responses with hardcoded data | Use MSW for realistic API mocking |

---

## Pre-Ship Checklist

### Architecture
- [ ] Correct tool per state type: local / shared / server / global
- [ ] No derived state stored — computed inline or with `useMemo`
- [ ] State colocated — lives as close to usage as possible
- [ ] Server state uses React Query — not `useState + useEffect`
- [ ] State shape uses discriminated unions — no impossible states
- [ ] No direct state mutation — always new objects/arrays

### Context
- [ ] Used only for infrequently changing global values
- [ ] `useMemo` on provider value — prevents unnecessary re-renders
- [ ] Custom hook with error throw if used outside provider
- [ ] Split into multiple contexts by update frequency

### Zustand
- [ ] Selective subscriptions — components subscribe to only what they need
- [ ] Large stores split into slices
- [ ] `partialize` on persisted stores — excludes functions from storage
- [ ] `devtools` middleware enabled for debugging
- [ ] Store reset in test `beforeEach`

### React Query
- [ ] `QueryClient` configured with appropriate `staleTime` and `gcTime`
- [ ] All query keys centralized in `queryKeys.ts`
- [ ] All variables that affect the result included in the query key
- [ ] Mutations invalidate or directly update cache on success
- [ ] Optimistic updates have rollback `onError`

### SSR / Next.js
- [ ] No `localStorage`/`window`/`document` access without `typeof window` guard
- [ ] Server data prefetched with `HydrationBoundary` — no loading flash
- [ ] Zustand stores created per-request — not singleton on server
- [ ] Context initial values SSR-safe

### Error Handling
- [ ] `ErrorBoundary` wraps every data-driven section
- [ ] React Query's `QueryErrorResetBoundary` used for retry behavior
- [ ] All four states handled: loading, error, empty, success

### Performance
- [ ] State colocated first — before reaching for memoization
- [ ] `useMemo` only on genuinely expensive computations
- [ ] `useCallback` only for callbacks passed to memoized children
- [ ] `React.memo` only on measured, expensive components

### Testing
- [ ] Custom hooks tested with `renderHook`
- [ ] Components tested with `renderWithProviders` wrapper
- [ ] API calls mocked with MSW — not manual `jest.mock(fetch)`
- [ ] Fresh `QueryClient` per test — no state bleed between tests
- [ ] Zustand stores reset in `beforeEach`

---

## Quick Reference: State Decision Tree

```
What kind of state do I have?
│
├── Can it be COMPUTED from existing state or props?
│   └── YES → Don't store it. Compute. useMemo if expensive.
│
├── Does it come from a SERVER / API?
│   └── YES → React Query. NEVER useState + useEffect.
│
├── Used by ONE component?
│   ├── Simple value              → useState
│   ├── Complex / named actions   → useReducer
│   ├── No re-render needed       → useRef
│   └── Expensive computation     → useMemo
│
├── Used by FEW NEARBY components?
│   ├── Try composition first     → pass children/render props
│   └── Lift to common parent     → props (max 2 levels)
│
├── Used by MANY DISTANT components?
│   ├── Changes rarely            → React Context
│   └── Changes often / complex   → Zustand
│
├── Needs to survive PAGE REFRESH?
│   ├── Single value              → useLocalStorage hook
│   └── Complex store             → Zustand persist middleware
│
├── In a NEXT.JS / SSR environment?
│   ├── Initial value from storage → lazy useState with window guard
│   ├── Server data               → React Query + HydrationBoundary
│   └── Global store              → Store factory + useRef pattern
│
└── Should be SHAREABLE / BOOKMARKABLE?
    └── YES → URL state (useSearchParams)
```

---

> **State is not data storage. It is the contract between your application and your UI. Every piece of state you add is a promise to keep it synchronized, valid, and consistent across every component that reads it, every interaction that changes it, and every environment it runs in. Make fewer promises — and keep every single one.**
