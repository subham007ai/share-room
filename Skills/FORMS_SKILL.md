# Forms & Validation Skill — Production Grade (Rebuilt)

## When to Use
Trigger this skill for any request involving:
- Login, signup, or authentication forms
- Checkout, payment, or billing forms
- Settings, profile, or account management forms
- Contact, feedback, or survey forms
- Multi-step wizards or onboarding flows
- Search filters, data entry, or admin forms
- File uploads or media inputs
- Conditional / dynamic field forms
- Any `<input>`, `<select>`, `<textarea>`, or custom input component

---

## The Forms Mindset

Forms are where users give you their trust. A login form holds their credentials. A checkout form holds their money. A signup form holds their personal data. Every decision — when to validate, how to show errors, how to lay out fields — either builds or destroys that trust.

**Three rules that govern everything else:**

1. **Never punish users before they've had a chance to succeed.** Don't show errors on fields the user hasn't touched. Don't validate on every keystroke while they're still typing. Earn the right to give feedback.
2. **Make the right path obvious, the wrong path impossible.** The best validation prevents bad input at the source — date pickers instead of text fields, select menus where options are finite, masked inputs where format is fixed.
3. **Forms fail at the boundaries.** The submit button, the network call, and the server response are where most form bugs live — not in the input fields themselves. Design these transitions with as much care as the fields.

---

## Phase 1: Understand the Form Before Building It

Every form has a job. Before writing any code, answer:

- **What is the user trying to accomplish?** Signup = first impression, high anxiety. Settings = returning user, high intent. Checkout = high stakes, low patience. These demand different approaches.
- **How many fields are truly required?** Every additional field reduces completion rate. Ask: "What happens if we remove this?" If the answer is "nothing critical" — remove it.
- **What's the error recovery story?** If the server rejects the submission, what does the user see? Can they fix it without losing their input?
- **Is data coming from outside?** Pre-filled edit forms have completely different UX from blank creation forms.
- **One step or many?** 5+ fields with distinct logical groups → consider multi-step. 3 fields → single step, always.

> **Rule:** A form with 10 required fields is not a form — it's an interrogation. Cut until it hurts, then cut one more.

---

## Phase 2: Framework Decision — Choose Before Building

This is the most important decision and the one the original skill got wrong by assuming React everywhere.

```
What environment are you building in?
│
├── Plain HTML (no framework, Claude.ai HTML artifact)
│   → Native HTML validation + Constraint Validation API
│   → No library needed for simple forms
│   → Use for: contact forms, simple login, quick prototypes
│
├── React — simple (1–3 fields, no complex validation)
│   → useState + manual validation on submit
│   → No library needed
│   → Use for: search bars, newsletter signups, single-field inputs
│
├── React — standard (4+ fields, validation, async)
│   → React Hook Form + Zod
│   → The production standard for React forms
│   → Use for: signup, checkout, settings, multi-step flows
│
├── Vue
│   → VeeValidate + Zod
│   → Same mental model as RHF but Vue-native
│
└── Svelte
    → Superforms + Zod
    → Best-in-class for SvelteKit form handling
```

Each approach is covered fully in the sections below. Use the right tool — never reach for React Hook Form when a plain HTML form will do.

---

## Phase 3: Form Styling — Visual States Done Right

This is what the first version of this skill was missing entirely. A form with perfect logic but no visual language still fails users. Every field needs five distinct visual states.

### The Five Field States

```css
/* ─── Design Tokens ─────────────────────────────── */
:root {
  /* Field geometry */
  --field-height: 44px;           /* minimum touch target */
  --field-radius: 8px;
  --field-padding: 0 14px;
  --field-font-size: 0.9375rem;   /* 15px — slightly larger than body for clarity */

  /* Colors — default state */
  --field-bg: #ffffff;
  --field-border: #d1d5db;
  --field-border-width: 1.5px;
  --field-text: #111827;
  --field-placeholder: #9ca3af;

  /* Colors — focus state */
  --field-focus-border: #3b82f6;
  --field-focus-ring: rgba(59, 130, 246, 0.2);
  --field-focus-ring-size: 4px;

  /* Colors — error state */
  --field-error-border: #ef4444;
  --field-error-bg: #fef2f2;
  --field-error-ring: rgba(239, 68, 68, 0.15);
  --field-error-text: #dc2626;

  /* Colors — success state */
  --field-success-border: #22c55e;
  --field-success-bg: #f0fdf4;

  /* Colors — disabled state */
  --field-disabled-bg: #f9fafb;
  --field-disabled-border: #e5e7eb;
  --field-disabled-text: #9ca3af;

  /* Label */
  --label-font-size: 0.875rem;
  --label-font-weight: 500;
  --label-color: #374151;
  --label-gap: 6px;           /* space between label and input */

  /* Helper/hint text */
  --hint-font-size: 0.8125rem;
  --hint-color: #6b7280;
  --hint-gap: 5px;

  /* Error text */
  --error-font-size: 0.8125rem;
  --error-color: #dc2626;
  --error-gap: 5px;
}

/* ─── Base Field Layout ──────────────────────────── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0;                        /* controlled per element below */
}

.field-label {
  font-size: var(--label-font-size);
  font-weight: var(--label-font-weight);
  color: var(--label-color);
  margin-bottom: var(--label-gap);
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.4;
}

.field-label .required-mark {
  color: var(--field-error-text);
  font-size: 0.75rem;
  line-height: 1;
}

/* ─── Input — All Five States ────────────────────── */
.field-input {
  height: var(--field-height);
  padding: var(--field-padding);
  font-size: var(--field-font-size);
  font-family: inherit;
  color: var(--field-text);
  background: var(--field-bg);
  border: var(--field-border-width) solid var(--field-border);
  border-radius: var(--field-radius);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  appearance: none;
  -webkit-appearance: none;
  outline: none;
}

/* Placeholder */
.field-input::placeholder {
  color: var(--field-placeholder);
}

/* State: Focus */
.field-input:focus {
  border-color: var(--field-focus-border);
  box-shadow: 0 0 0 var(--field-focus-ring-size) var(--field-focus-ring);
}

/* State: Error */
.field-input[aria-invalid="true"],
.field-input.is-error {
  border-color: var(--field-error-border);
  background: var(--field-error-bg);
}

.field-input[aria-invalid="true"]:focus {
  box-shadow: 0 0 0 var(--field-focus-ring-size) var(--field-error-ring);
}

/* State: Success (field validated and correct) */
.field-input.is-success {
  border-color: var(--field-success-border);
  background: var(--field-success-bg);
}

/* State: Disabled */
.field-input:disabled {
  background: var(--field-disabled-bg);
  border-color: var(--field-disabled-border);
  color: var(--field-disabled-text);
  cursor: not-allowed;
}

/* ─── Textarea ───────────────────────────────────── */
.field-textarea {
  min-height: 100px;
  height: auto;
  padding: 10px 14px;
  resize: vertical;
  line-height: 1.6;
}

/* ─── Select ─────────────────────────────────────── */
.field-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 38px;
  cursor: pointer;
}

/* ─── Checkbox & Radio ───────────────────────────── */
.checkbox-label,
.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: var(--field-font-size);
  color: var(--field-text);
  line-height: 1.5;
}

.checkbox-label input[type="checkbox"],
.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin: 2px 0 0;
  accent-color: var(--field-focus-border);
  cursor: pointer;
}

/* ─── Hint & Error Text ──────────────────────────── */
.field-hint {
  font-size: var(--hint-font-size);
  color: var(--hint-color);
  margin-top: var(--hint-gap);
  line-height: 1.4;
}

.field-error-text {
  font-size: var(--error-font-size);
  color: var(--error-color);
  margin-top: var(--error-gap);
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 5px;
}

.field-error-text::before {
  content: "⚠";
  font-size: 0.75rem;
  margin-top: 1px;
  flex-shrink: 0;
}

/* ─── Form-level Error Banner ────────────────────── */
.form-error-banner {
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--error-color);
  font-size: 0.9rem;
  line-height: 1.5;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 24px;
}

/* ─── Submit Button States ───────────────────────── */
.btn-submit {
  height: 44px;
  padding: 0 24px;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: var(--field-radius);
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-submit[aria-busy="true"] {
  cursor: wait;
}

/* ─── Form Layout Patterns ───────────────────────── */
/* Single column (default — always mobile-first) */
.form-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Two column grid (desktop only) */
@media (min-width: 640px) {
  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px 24px;
  }

  .form-grid-2 .field-full {
    grid-column: 1 / -1;   /* spans both columns */
  }
}

/* Field row (inline label + input, e.g. settings page) */
.form-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

@media (max-width: 639px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Screen reader only utility */
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

### Form Layout Patterns — When to Use Which

```
Single column (default):
  → Always start here. Works for all screen sizes.
  → Use for: login, signup, contact, any form with 1–6 fields
  → Rule: never use two columns just because there's horizontal space

Two column grid:
  → Use when fields are short and naturally pair together
  → Good pairs: First name + Last name, City + State, Start date + End date
  → Never split a logical group across columns
  → Always collapse to single column on mobile

Inline label + field (form-row):
  → Use for settings/profile pages where the form is a list of preferences
  → The horizontal layout signals "these are independent settings"
  → Never use for primary acquisition forms (signup, checkout)

Floating labels:
  → Use sparingly — they're visually clever but reduce clarity
  → The label disappears into the placeholder area on focus
  → Problematic for users with cognitive disabilities
  → If you use them, ensure the label is always visible after input
```

---

## Phase 4: Validation Strategy — When and How

### Validation Timing — The Most Nuanced Decision

```
onBlur  (validate when user leaves the field)
  → The default for most fields
  → They've finished entering — now it's fair to give feedback
  → Use for: email, name, password, any formatted field

onChange (validate on every keystroke)
  → Only after blur or submit has already triggered the error
  → Never show errors while user is still mid-typing
  → Good for: password strength meter, character counters (show progress not errors)

onSubmit (validate everything at submit)
  → Always do this IN ADDITION to field-level validation
  → Catches untouched required fields

After first failed submit → switch to onChange
  → User now knows the form has errors — live feedback helps them fix faster
  → React Hook Form handles this with mode + reValidateMode
```

```jsx
// React Hook Form — correct timing configuration
const form = useForm({
  mode: 'onBlur',           // validate on blur initially
  reValidateMode: 'onChange', // live validation after first submit attempt
});
```

### Three Validation Layers — Never Skip Any

```
Layer 1: Input Constraints (prevent bad input at source)
  HTML attributes: type="email", min, max, maxLength, pattern
  UI controls: date pickers, selects, masked inputs
  Goal: make invalid input impossible before it reaches validation

Layer 2: Client-Side Validation (immediate UX feedback)
  Tool: Zod schema + React Hook Form resolver
  Goal: format errors, required fields, cross-field rules
  WARNING: client validation can be bypassed — never trust it for security

Layer 3: Server-Side Validation (authoritative, security-critical)
  Same Zod schema reused in the API handler
  Goal: business rules, uniqueness, authorization
  This is the ONLY layer that cannot be bypassed — treat it as the real validator
```

### Zod — Single Source of Truth

Define validation once. Use it everywhere: client validation, server validation, TypeScript types.

```typescript
import { z } from 'zod';

// ─── Reusable field schemas ───────────────────────
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address (e.g. name@company.com)')
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

const phoneSchema = z
  .string()
  .transform(val => val.replace(/\D/g, ''))
  .pipe(z.string().length(10, 'Please enter a 10-digit phone number'));

// ─── Signup form schema ───────────────────────────
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ─── Profile form schema ──────────────────────────
export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  website: z
    .string()
    .url('Please enter a valid URL including https://')
    .optional()
    .or(z.literal('')),
  phone: phoneSchema.optional(),
});

// Free TypeScript types from schema
export type SignupData = z.infer<typeof signupSchema>;
export type ProfileData = z.infer<typeof profileSchema>;

// ─── Reuse on server — same schema, authoritative validation ──
// api/signup.ts
export async function POST(req: Request) {
  const body = await req.json();
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  // result.data is fully typed and validated
}
```

---

## Phase 5: Vanilla HTML Forms — No Framework

For simple HTML artifacts, contact pages, or quick forms — no library needed.

```html
<form id="contactForm" novalidate>
  <div class="field-group">
    <label class="field-label" for="name">
      Full Name <span class="required-mark" aria-hidden="true">*</span>
    </label>
    <input
      class="field-input"
      id="name"
      name="name"
      type="text"
      autocomplete="name"
      required
      maxlength="100"
      aria-required="true"
    />
    <p class="field-error-text" id="name-error" role="alert" hidden></p>
  </div>

  <div class="field-group">
    <label class="field-label" for="email">
      Email Address <span class="required-mark" aria-hidden="true">*</span>
    </label>
    <input
      class="field-input"
      id="email"
      name="email"
      type="email"
      autocomplete="email"
      inputmode="email"
      required
      aria-required="true"
    />
    <p class="field-error-text" id="email-error" role="alert" hidden></p>
  </div>

  <div class="field-group">
    <label class="field-label" for="message">Message</label>
    <textarea
      class="field-input field-textarea"
      id="message"
      name="message"
      maxlength="1000"
      rows="4"
    ></textarea>
    <p class="field-hint" id="message-counter" aria-live="polite">1000 characters remaining</p>
  </div>

  <button type="submit" class="btn-submit" id="submitBtn">Send Message</button>
</form>

<script>
  // ─── Vanilla validation engine ─────────────────────
  const validators = {
    name: (v) => !v.trim() ? 'Please enter your name' : null,
    email: (v) => {
      if (!v.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email address';
      return null;
    },
    message: (v) => v.length > 1000 ? 'Message must be under 1000 characters' : null,
  };

  function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `${fieldId}-error`);
    input.classList.add('is-error');
    error.textContent = message;
    error.hidden = false;
  }

  function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    input.classList.remove('is-error');
    error.hidden = true;
  }

  // Validate on blur
  ['name', 'email'].forEach(fieldId => {
    const input = document.getElementById(fieldId);
    input.addEventListener('blur', () => {
      const error = validators[fieldId]?.(input.value);
      error ? showError(fieldId, error) : clearError(fieldId);
    });
  });

  // Character counter for textarea
  const message = document.getElementById('message');
  const counter = document.getElementById('message-counter');
  message.addEventListener('input', () => {
    const remaining = 1000 - message.value.length;
    counter.textContent = `${remaining} character${remaining !== 1 ? 's' : ''} remaining`;
    counter.style.color = remaining < 100 ? '#ef4444' : '#6b7280';
  });

  // Submit handler
  document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    // Validate all fields
    let hasErrors = false;
    let firstErrorId = null;
    Object.keys(validators).forEach(fieldId => {
      const field = form.elements[fieldId];
      if (!field) return;
      const error = validators[fieldId]?.(field.value);
      if (error) {
        showError(fieldId, error);
        if (!firstErrorId) firstErrorId = fieldId;
        hasErrors = true;
      } else {
        clearError(fieldId);
      }
    });

    if (hasErrors) {
      document.getElementById(firstErrorId)?.focus();
      return;
    }

    // Submit
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Sending...';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        form.reset();
        btn.textContent = '✓ Message sent';
        btn.style.background = '#22c55e';
      } else {
        throw new Error('Server error');
      }
    } catch {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = 'Send Message';
      showError('email', 'Something went wrong — please try again');
    }
  });
</script>
```

---

## Phase 6: React Forms — Simple (useState)

For 1–3 fields with minimal validation. No library needed.

```jsx
const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const validate = (value) => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
    return '';
  };

  const handleBlur = () => setError(validate(email));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(email);
    if (err) { setError(err); return; }

    setStatus('loading');
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <p role="status" tabIndex={-1} style={{ color: '#22c55e' }}>
        ✓ You're subscribed! Check your inbox for a confirmation email.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field-group">
        <label className="field-label" htmlFor="email">Email address</label>
        <input
          className={`field-input ${error ? 'is-error' : ''}`}
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={e => { setEmail(e.target.value); if (error) setError(validate(e.target.value)); }}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
        />
        {error && <p id="email-error" className="field-error-text" role="alert">{error}</p>}
      </div>
      <button type="submit" className="btn-submit" disabled={status === 'loading'} aria-busy={status === 'loading'}>
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  );
};
```

---

## Phase 7: React Forms — Production (React Hook Form + Zod)

For any form with 4+ fields, validation, async operations, or multi-step flow.

### Complete Field Component Library

```jsx
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// ─── Reusable field components ────────────────────

const Field = ({ label, name, type = 'text', hint, required, register, error, ...props }) => {
  const id = `field-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      <input
        className={`field-input ${error ? 'is-error' : ''}`}
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={describedBy}
        {...register(name)}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="field-error-text" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
};

const SelectField = ({ label, name, options, hint, required, register, error }) => {
  const id = `field-${name}`;
  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      <select
        className={`field-input field-select ${error ? 'is-error' : ''}`}
        id={id}
        aria-invalid={!!error}
        aria-required={required}
        {...register(name)}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p id={`${id}-error`} className="field-error-text" role="alert">{error.message}</p>}
    </div>
  );
};

const TextareaField = ({ label, name, maxLength, hint, required, register, watch, error }) => {
  const id = `field-${name}`;
  const value = watch?.(name) || '';
  const remaining = maxLength ? maxLength - value.length : null;

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && <span className="required-mark" aria-hidden="true">*</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      <textarea
        className={`field-input field-textarea ${error ? 'is-error' : ''}`}
        id={id}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={[`${id}-hint`, remaining !== null && `${id}-counter`, error && `${id}-error`].filter(Boolean).join(' ')}
        {...register(name)}
      />
      {remaining !== null && (
        <p
          id={`${id}-counter`}
          className="field-hint"
          aria-live="polite"
          style={{ color: remaining < 50 ? '#ef4444' : undefined, textAlign: 'right' }}
        >
          {remaining} remaining
        </p>
      )}
      {error && <p id={`${id}-error`} className="field-error-text" role="alert">{error.message}</p>}
    </div>
  );
};

// ─── Password field with strength meter ──────────
const PasswordField = ({ label, name, showStrength, register, watch, error }) => {
  const [visible, setVisible] = useState(false);
  const value = watch?.(name) || '';

  const getStrength = (v) => {
    let s = 0;
    if (v.length >= 8)        s++;
    if (v.length >= 12)       s++;
    if (/[A-Z]/.test(v))      s++;
    if (/[0-9]/.test(v))      s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  };

  const strength = getStrength(value);
  const labels = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  const id = `field-${name}`;

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className={`field-input ${error ? 'is-error' : ''}`}
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          aria-invalid={!!error}
          style={{ paddingRight: 48 }}
          {...register(name)}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none',
            cursor: 'pointer', color: '#6b7280', fontSize: 16,
          }}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div aria-live="polite" aria-label={`Password strength: ${labels[strength]}`} style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                height: 4, flex: 1, borderRadius: 2,
                background: i <= strength ? colors[strength] : '#e5e7eb',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: colors[strength], marginTop: 4 }}>
            {labels[strength]}
          </p>
        </div>
      )}
      {error && <p className="field-error-text" role="alert">{error.message}</p>}
    </div>
  );
};
```

### Complete Form — Signup Example

```jsx
const SignupForm = ({ onSuccess }) => {
  const [serverError, setServerError] = useState('');

  const {
    register, handleSubmit, watch, setError, reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  // Scroll to first error on submit failure
  useEffect(() => {
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById(`field-${firstError}`)?.focus();
    }
  }, [errors]);

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 409) {
          setError('email', { type: 'server', message: 'An account with this email already exists. Try signing in.' });
          return;
        }
        if (res.status === 422 && err.errors) {
          Object.entries(err.errors).forEach(([field, messages]) => {
            setError(field, { type: 'server', message: Array.isArray(messages) ? messages[0] : messages });
          });
          return;
        }
        setServerError('Something went wrong on our end. Please try again in a moment.');
        return;
      }

      reset();
      onSuccess?.();
    } catch {
      setServerError('Unable to connect. Please check your internet connection and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-stack">
      {serverError && (
        <div className="form-error-banner" role="alert" tabIndex={-1}>
          {serverError}
        </div>
      )}

      <Field
        label="Email address" name="email" type="email"
        required register={register} error={errors.email}
        autoComplete="email" inputMode="email"
      />

      <PasswordField
        label="Password" name="password"
        showStrength register={register} watch={watch}
        error={errors.password}
      />

      <PasswordField
        label="Confirm password" name="confirmPassword"
        register={register} watch={watch}
        error={errors.confirmPassword}
      />

      <button
        type="submit"
        className="btn-submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        style={{ width: '100%', background: '#3b82f6', color: '#fff' }}
      >
        {isSubmitting ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="spinner" aria-hidden="true" />
            Creating account...
          </span>
        ) : 'Create account'}
      </button>
    </form>
  );
};
```

---

## Phase 8: Conditional Fields — Dynamic Forms

The most common missing pattern in form guides. Every real product has fields that appear, hide, or change based on other field values.

### Show / Hide Fields

```jsx
const InsuranceForm = () => {
  const { register, watch, handleSubmit, formState: { errors } } = useForm();

  // Watch the trigger field
  const hasInsurance = watch('hasInsurance');
  const employmentType = watch('employmentType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-stack">

      {/* Trigger field */}
      <div className="field-group">
        <label className="field-label">Do you have health insurance?</label>
        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          {['yes', 'no'].map(v => (
            <label key={v} className="radio-label">
              <input type="radio" value={v} {...register('hasInsurance')} />
              <span>{v === 'yes' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Conditional field — only shown when hasInsurance === 'yes' */}
      {hasInsurance === 'yes' && (
        <Field
          label="Insurance provider"
          name="insuranceProvider"
          required
          register={register}
          error={errors.insuranceProvider}
        />
      )}

      {/* Dependent select — state depends on country */}
      <SelectField
        label="Country"
        name="country"
        options={countries}
        register={register}
        error={errors.country}
      />

      {/* Show state/province only for US/CA */}
      {['US', 'CA'].includes(watch('country')) && (
        <SelectField
          label={watch('country') === 'US' ? 'State' : 'Province'}
          name="stateProvince"
          options={watch('country') === 'US' ? usStates : caProvinces}
          required
          register={register}
          error={errors.stateProvince}
        />
      )}

    </form>
  );
};
```

### Dynamic Field Arrays (Add / Remove)

```jsx
import { useFieldArray } from 'react-hook-form';

const ExperienceForm = () => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      experiences: [{ company: '', role: '', years: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experiences',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
      <fieldset style={{ border: 'none', padding: 0 }}>
        <legend className="field-label" style={{ fontSize: '1rem', marginBottom: 12 }}>
          Work Experience
        </legend>

        {fields.map((field, index) => (
          <div
            key={field.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 80px auto',
              gap: 12,
              alignItems: 'start',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Field
              label="Company"
              name={`experiences.${index}.company`}
              required
              register={register}
              error={errors.experiences?.[index]?.company}
            />
            <Field
              label="Role"
              name={`experiences.${index}.role`}
              required
              register={register}
              error={errors.experiences?.[index]?.role}
            />
            <Field
              label="Years"
              name={`experiences.${index}.years`}
              type="number"
              register={register}
              error={errors.experiences?.[index]?.years}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              aria-label={`Remove experience ${index + 1}`}
              style={{
                marginTop: 28, height: 44, width: 44,
                background: '#fee2e2', border: 'none',
                borderRadius: 8, cursor: 'pointer',
                color: '#dc2626', fontSize: 18,
              }}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ company: '', role: '', years: '' })}
          style={{
            background: 'none', border: '1.5px dashed #d1d5db',
            borderRadius: 8, padding: '10px 16px',
            color: '#6b7280', cursor: 'pointer', width: '100%',
            fontSize: '0.875rem',
          }}
        >
          + Add another experience
        </button>
      </fieldset>

      <button type="submit" className="btn-submit">Save</button>
    </form>
  );
};
```

---

## Phase 9: Multi-Step Forms

### Core Architecture — State Machine Approach

```jsx
// Each step is a self-contained component with its own schema
const STEPS = [
  { id: 'account',     label: 'Account',     schema: accountSchema },
  { id: 'profile',     label: 'Profile',     schema: profileSchema },
  { id: 'preferences', label: 'Preferences', schema: preferencesSchema },
  { id: 'review',      label: 'Review',      schema: z.object({}) },
];

const MultiStepForm = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef(null);

  const currentStep = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const form = useForm({
    resolver: zodResolver(currentStep.schema),
    defaultValues: formData,   // pre-populate from accumulated data
    mode: 'onBlur',
  });

  // Move focus to heading when step changes (accessibility)
  useEffect(() => {
    headingRef.current?.focus();
  }, [stepIndex]);

  const goNext = form.handleSubmit((stepData) => {
    const merged = { ...formData, ...stepData };
    setFormData(merged);

    if (isLast) {
      submitFinal(merged);
    } else {
      setStepIndex(i => i + 1);
      form.reset({ ...merged });  // reset with accumulated data for next step
    }
  });

  const goBack = () => {
    // Save current values even if invalid
    setFormData(prev => ({ ...prev, ...form.getValues() }));
    setStepIndex(i => i - 1);
  };

  return (
    <div>
      {/* Progress indicator */}
      <StepProgress steps={STEPS} currentIndex={stepIndex} />

      {/* Step heading — receives focus on step change */}
      <h2 ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>
        {currentStep.label}
      </h2>
      <p className="sr-only" aria-live="polite">
        Step {stepIndex + 1} of {STEPS.length}
      </p>

      <form onSubmit={goNext} className="form-stack" noValidate>
        {currentStep.id === 'account'     && <AccountStep form={form} />}
        {currentStep.id === 'profile'     && <ProfileStep form={form} />}
        {currentStep.id === 'preferences' && <PreferencesStep form={form} />}
        {currentStep.id === 'review'      && <ReviewStep data={formData} />}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          {!isFirst && (
            <button
              type="button"
              onClick={goBack}
              className="btn-submit"
              style={{ background: '#f3f4f6', color: '#374151' }}
            >
              ← Back
            </button>
          )}
          <button
            type="submit"
            className="btn-submit"
            disabled={submitting}
            style={{ marginLeft: 'auto', background: '#3b82f6', color: '#fff' }}
          >
            {isLast ? (submitting ? 'Submitting...' : 'Submit') : 'Continue →'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Step progress indicator ──────────────────────
const StepProgress = ({ steps, currentIndex }) => (
  <nav aria-label="Form progress" style={{ marginBottom: 32 }}>
    <ol style={{ display: 'flex', padding: 0, margin: 0, listStyle: 'none', gap: 0 }}>
      {steps.map((step, i) => {
        const status = i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'upcoming';
        return (
          <li key={step.id} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div
                aria-current={status === 'current' ? 'step' : undefined}
                style={{
                  width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: status === 'complete' ? '#22c55e'
                            : status === 'current'  ? '#3b82f6' : '#e5e7eb',
                  color: status === 'upcoming' ? '#9ca3af' : '#fff',
                  fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                }}
              >
                {status === 'complete' ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 11, color: status === 'current' ? '#3b82f6' : '#6b7280',
                fontWeight: status === 'current' ? 600 : 400,
              }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 2, flex: 1, maxWidth: 40,
                background: i < currentIndex ? '#22c55e' : '#e5e7eb',
                transition: 'background 0.3s',
              }} />
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
```

---

## Phase 10: Draft Saving & Data Loss Prevention

### Auto-Save to localStorage (Long Forms)

```jsx
const DRAFT_KEY = 'form_draft_profile';

const FormWithDraftSave = () => {
  const { register, handleSubmit, watch, reset } = useForm();

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Confirm with user before restoring
        if (window.confirm('We found an unsaved draft. Would you like to restore it?')) {
          reset(parsed);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch { /* ignore corrupt drafts */ }
  }, []);

  // Debounced auto-save on every change
  const watchedValues = watch();
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedValues));
      } catch { /* storage full — fail silently */ }
    }, 1000); // save 1 second after last change
    return () => clearTimeout(timer);
  }, [watchedValues]);

  const onSubmit = (data) => {
    // Clear draft on successful submit
    localStorage.removeItem(DRAFT_KEY);
    submitData(data);
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* fields */}</form>;
};
```

### Prevent Data Loss on Navigation

```jsx
const { isDirty } = useFormState({ control });

// Browser back button / tab close
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';  // shows browser's native "Leave page?" dialog
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);

// React Router / Next.js navigation
// Use router.beforePopState or a custom navigation guard
// Show a custom confirmation dialog before allowing navigation away
```

---

## Phase 11: Payment Forms — Stripe Integration

Never handle raw credit card data yourself. Always use Stripe Elements or similar. This is both a security requirement (PCI compliance) and a practical one — Stripe handles card validation, formatting, and error messaging better than any custom implementation.

```jsx
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);

// ─── Card element styling — matches your design system ──
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      fontFamily: 'inherit',
      color: '#111827',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
};

const CheckoutForm = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(billingSchema),
  });

  const onSubmit = async (billingData) => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    // 1. Create PaymentIntent on your server
    const { clientSecret } = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    }).then(r => r.json());

    // 2. Confirm payment — Stripe handles card validation
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: billingData.name,
          email: billingData.email,
          address: {
            line1: billingData.address,
            city: billingData.city,
            postal_code: billingData.zip,
            country: billingData.country,
          },
        },
      },
    });

    setProcessing(false);

    if (stripeError) {
      // Stripe provides user-friendly error messages — use them directly
      setError(stripeError.message);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      onSuccess?.(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
      {/* Billing fields */}
      <Field label="Full name" name="name" required autoComplete="name"
             register={register} error={errors.name} />
      <Field label="Email" name="email" type="email" required autoComplete="email"
             register={register} error={errors.email} />

      {/* Stripe Card Element — never builds this yourself */}
      <div className="field-group">
        <label className="field-label">Card details</label>
        <div
          style={{
            height: 44, padding: '11px 14px',
            border: `1.5px solid ${error ? '#ef4444' : '#d1d5db'}`,
            borderRadius: 8, background: '#fff',
            transition: 'border-color 0.15s',
          }}
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {error && <p className="field-error-text" role="alert">{error}</p>}
      </div>

      <button
        type="submit"
        className="btn-submit"
        disabled={!stripe || processing}
        aria-busy={processing}
        style={{ width: '100%', background: '#3b82f6', color: '#fff' }}
      >
        {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>

      <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
        🔒 Secured by Stripe. Your card details never touch our servers.
      </p>
    </form>
  );
};

// Wrap in Stripe Elements provider
const PaymentPage = ({ amount }) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm amount={amount} onSuccess={(pi) => router.push('/success')} />
  </Elements>
);
```

---

## Phase 12: Accessibility — Complete Checklist

Forms are the highest-stakes accessibility surface on the web. A screen reader user who can't complete your signup form is completely locked out.

### Every Form Must Have

```jsx
// 1. Visible label on every input — NEVER placeholder-only
<label htmlFor="email">Email address</label>
<input id="email" type="email" placeholder="name@company.com" />
// placeholder: supplementary hint only, not a label substitute

// 2. aria-invalid on error state
<input aria-invalid={!!error} />

// 3. aria-describedby linking input to hint AND error
<input aria-describedby="email-hint email-error" />
<p id="email-hint">We'll send your receipt here</p>
<p id="email-error" role="alert">Please enter a valid email address</p>

// 4. role="alert" on error messages — announces immediately on appearance
<p role="alert" className="field-error-text">{error}</p>

// 5. aria-live="polite" for non-urgent updates
<p aria-live="polite">{remaining} characters remaining</p>

// 6. fieldset + legend for grouped inputs
<fieldset>
  <legend>Shipping address</legend>
  {/* address fields */}
</fieldset>

// 7. Focus management after submit
useEffect(() => {
  if (isSubmitSuccessful) successRef.current?.focus();
  else if (Object.keys(errors).length) {
    document.getElementById(`field-${Object.keys(errors)[0]}`)?.focus();
  }
}, [isSubmitSuccessful, submitCount]);
```

### Keyboard Navigation Rules
- Tab moves through all interactive elements in DOM order — match visual order
- Enter submits the form — never repurpose Enter for other actions within a form
- Escape closes any date picker or dropdown within the form
- Arrow keys navigate radio groups natively — don't override this
- Shift+Tab moves backward — test this explicitly

---

## Anti-Patterns: The Forms Hall of Shame

| ❌ Don't | ✅ Do Instead |
|---|---|
| Placeholder as the only label | Always use a visible `<label>` |
| Show errors before user touches field | Validate on blur; error on submit |
| "Invalid input" as error message | Specific, instructive, kind messages |
| Validate email on every keystroke | Validate on blur, re-validate on change post-submit |
| Disable submit before user tries | Only disable during submission |
| Allow double-submit | Disable + aria-busy during async submit |
| Swallow server errors silently | Map server errors back to specific fields |
| Lose data when user hits Back | Preserve values across multi-step navigation |
| Color alone to show error state | Border + background + icon + text + aria-invalid |
| Hard-code validation client-only | Same Zod schema on client AND server |
| Handle raw credit card numbers | Use Stripe Elements — never touch card data directly |
| No loading state on async validation | Show "Checking..." while async runs |
| Forget autoComplete attributes | Set autoComplete on every field |
| Multi-step with no progress indicator | Always show where user is in the flow |
| No draft saving for long forms | Auto-save to localStorage every 1–2 seconds |
| Jump focus randomly after submit | Move focus to first error or success message |

---

## Pre-Ship Checklist

### Architecture & Validation
- [ ] Correct tool chosen: vanilla / useState / React Hook Form based on complexity
- [ ] Zod schema is single source of truth — used on client AND server
- [ ] Validation mode: `onBlur` initially, `onChange` after first submit
- [ ] Server errors mapped back to specific form fields
- [ ] Double-submit prevented (button disabled during submission)

### Field Design
- [ ] Every input has a visible `<label>` (not placeholder-only)
- [ ] All five visual states styled: default, focus, error, success, disabled
- [ ] Error messages are specific and instructive, not "invalid"
- [ ] Errors appear directly below the field that caused them
- [ ] `autoComplete` attributes set on all relevant fields
- [ ] `inputMode` set for mobile keyboard optimization

### Conditional & Dynamic Fields
- [ ] Conditional fields validated only when visible
- [ ] Dynamic arrays have add/remove with accessible labels
- [ ] Dependent fields update correctly when trigger changes

### Accessibility
- [ ] `aria-invalid` on fields with errors
- [ ] `aria-describedby` linking inputs to hints and errors
- [ ] Error messages have `role="alert"`
- [ ] Radio groups use `<fieldset>` + `<legend>`
- [ ] Focus moves to first error after failed submit
- [ ] Focus moves to success message after successful submit
- [ ] Full keyboard navigation tested

### UX & Data Safety
- [ ] User warned before leaving with unsaved changes
- [ ] Long forms auto-save draft to localStorage
- [ ] Multi-step forms preserve data when navigating Back
- [ ] Submit button shows loading state with descriptive text
- [ ] Network errors have a user-facing message

### Security
- [ ] Credit card data never handled directly — Stripe Elements used
- [ ] File uploads validate type AND size on client AND server
- [ ] CSRF protection on all form endpoints
- [ ] Rate limiting on auth forms (login, signup, password reset)
- [ ] No sensitive data in URL parameters

---

## Quick Reference: Field Type Decision Tree

```
What are you collecting?
│
├── Text
│   ├── Short, single line      → <input type="text">
│   ├── Email                   → <input type="email" autoComplete="email" inputMode="email">
│   ├── Password                → <input type="password"> + strength meter on signup
│   ├── Phone                   → <input type="tel" inputMode="tel"> + format mask
│   ├── Number                  → <input type="number"> or inputMode="numeric"
│   ├── URL                     → <input type="url">
│   └── Multi-line              → <textarea> + character counter
│
├── Choice
│   ├── 2–4 options, all visible → Radio group (fieldset + legend)
│   ├── 5+ options               → Native <select>
│   ├── Multiple selections      → Checkbox group or multi-select
│   ├── Boolean toggle           → Single <input type="checkbox">
│   └── Search + select          → Combobox with autocomplete
│
├── Date / Time
│   ├── Date only               → <input type="date"> or date picker component
│   ├── Time only               → <input type="time">
│   ├── Date + time             → <input type="datetime-local">
│   └── Date range              → Two date inputs or range picker
│
├── File / Media
│   ├── Single file             → <input type="file"> + drag-and-drop zone
│   ├── Multiple files          → <input type="file" multiple>
│   └── Image with preview      → File input + FileReader + preview
│
└── Financial
    ├── Credit card             → Stripe Elements (NEVER handle raw card data)
    ├── Bank account            → Plaid Link or equivalent
    └── Amounts / prices        → <input type="number" step="0.01"> with currency display
```

---

> **A form is a conversation between your product and your user. Every field is a question. Every error is a misunderstanding. Every successful submit is an agreement. Design it like it matters — because to your user, it does.**
