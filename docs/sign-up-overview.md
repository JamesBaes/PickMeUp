# Sign Up Page - How It Works (Beginner's Guide)

**Date:** 2026-03-08

---

## What does this page do?

The Sign Up page lets a new user create an account. They fill in their email address, choose a password, confirm that password, and submit. If everything looks good, their account is created and they're sent to a verification email page.

---

## The two files involved

| File | Role |
|------|------|
| `app/(auth)/sign-up/page.tsx` | The visual page the user sees and interacts with |
| `components/PasswordRequirements.tsx` | A small helper component that shows a live password checklist |

---

## Understanding TypeScript basics used here

Before diving in, here are the TypeScript concepts that appear in this code explained simply.

### What is `useState`?

`useState` is a React tool that lets a component **remember** a value between renders (every time the screen updates).

```ts
const [password, setPassword] = useState("");
```

Think of this like a whiteboard in the room:
- `password` is what's currently written on the whiteboard
- `setPassword` is the marker — you use it to change what's written
- `useState("")` means the whiteboard starts empty (`""`)

Every time `setPassword` is called with a new value, React re-draws the component with that new value.

---

### What is a `type`?

```ts
type Requirement = {
  label: string;
  met: boolean;
};
```

A `type` is a blueprint that describes the shape of an object. This one says: "a `Requirement` is an object that has a `label` (text) and a `met` (true or false)."

It doesn't create any data — it just describes what the data must look like so TypeScript can catch mistakes early.

---

### What is `string | null`?

```ts
const [error, setError] = useState<string | null>(null);
```

The `<string | null>` part tells TypeScript that this value can be either a piece of text (`string`) or nothing (`null`). The `|` means "or". Starting at `null` means there's no error yet.

---

### What is `async` / `await`?

```ts
const handleSignUp = async (formData: FormData) => {
  const result = await signUp(formData);
};
```

Some tasks take time — like sending data to a server. `async` marks a function as one that does time-consuming work. `await` means "pause here and wait for this to finish before moving on." Without `await`, the code would run past the server call before the answer came back.

---

### What is `FormData`?

When a user submits an HTML form, React bundles all the field values into a `FormData` object — think of it as an envelope containing all the filled-in fields. `formData.get("email")` opens that envelope and pulls out just the email field.

---

## How `sign-up/page.tsx` works step by step

### 1. State variables (the page's memory)

```ts
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

| Variable | What it stores |
|----------|---------------|
| `error` | An error message to show the user, or `null` if there's no error |
| `loading` | `true` while the sign-up request is in progress, `false` otherwise |
| `password` | The current text typed into the Password field |
| `showPassword` | Whether the Password field is showing or hiding its characters |
| `showConfirmPassword` | Whether the Confirm Password field is showing or hiding its characters |

---

### 2. The submit handler

```ts
const handleSignUp = async (formData: FormData) => {
  setLoading(true);
  setError(null);

  const result = await signUp(formData);

  if (result?.error) {
    setError(result.error);
    setLoading(false);
  }
};
```

Step by step:
1. **`setLoading(true)`** — marks the page as busy, which disables the button and shows "Creating Account..."
2. **`setError(null)`** — clears any previous error message before trying again
3. **`await signUp(formData)`** — sends the form data to the server action and waits for a response
4. **`if (result?.error)`** — the `?.` is a safe way to check if `result` exists AND has an `error` property. If it does, the sign-up failed
5. On failure: the error message is stored and loading is turned off. On success: the server action redirects the user automatically, so this code never runs

---

### 3. The email input

```tsx
<label className="input input-bordered flex items-center gap-2 w-full bg-background">
  {/* SVG icon */}
  <input
    type="email"
    name="email"
    placeholder="Email@example.com"
    required
    disabled={loading}
    className="grow font-heading placeholder:text-gray-400 disabled:opacity-50"
  />
</label>
```

- The outer `<label>` is a DaisyUI styled input wrapper — it makes the icon and the text field sit side by side inside a single bordered box
- `type="email"` tells the browser to validate that the value looks like an email before submitting
- `name="email"` is the key used to retrieve this value from `FormData` on the server
- `disabled={loading}` is a dynamic attribute — when `loading` is `true`, the field becomes uneditable
- `className="grow"` makes the input stretch to fill all remaining space inside the label box

---

### 4. The password input with show/hide toggle

```tsx
<input
  type={showPassword ? "text" : "password"}
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
>
  {/* eye or eye-off SVG */}
</button>
```

- `type={showPassword ? "text" : "password"}` — this is a **ternary expression** (a one-line if/else). If `showPassword` is `true`, the type is `"text"` (characters visible); if `false`, the type is `"password"` (characters hidden as dots)
- `value={password}` and `onChange={(e) => setPassword(e.target.value)}` make this a **controlled input** — React is fully in charge of what's displayed. Every keystroke updates the `password` state, which immediately flows back into the input
- `onClick={() => setShowPassword(!showPassword)}` — the `!` flips the boolean. If it was `true`, it becomes `false`, and vice versa
- `type="button"` is important — without it, clicking this button inside the form would accidentally submit the form

---

### 5. The PasswordRequirements component

```tsx
<PasswordRequirements password={password} />
```

This single line renders the entire live checklist. The `password={password}` part passes the current value of the `password` state down into the component as a **prop** (short for property — a value passed from a parent to a child component).

---

## How `PasswordRequirements.tsx` works step by step

### The type definitions

```ts
type Requirement = {
  label: string;
  met: boolean;
};

type PasswordRequirementsProps = {
  password: string;
};
```

- `Requirement` describes each checklist item: some text and a true/false value
- `PasswordRequirementsProps` describes what the component expects to receive from its parent — just the `password` string

---

### Building the checklist

```ts
const requirements: Requirement[] = [
  { label: "At least 8 characters", met: password.length >= 8 },
  { label: "One uppercase letter", met: /[A-Z]/.test(password) },
  { label: "One number", met: /[0-9]/.test(password) },
];
```

- `Requirement[]` means "an array of `Requirement` objects"
- Each object is evaluated fresh every time the component re-renders (i.e. every time `password` changes)
- `password.length >= 8` is just a comparison that produces `true` or `false`
- `/[A-Z]/.test(password)` uses a **regular expression** (regex) — `/[A-Z]/` means "any uppercase letter A through Z", and `.test()` returns `true` if the password contains at least one

---

### Early return

```ts
if (!password) return null;
```

`!password` means "if password is empty". Returning `null` from a React component means "render nothing". This hides the checklist entirely until the user starts typing.

---

### Rendering the list

```tsx
<ul className="flex flex-col gap-1">
  {requirements.map(({ label, met }) => (
    <li key={label} className="flex items-center gap-2">
      <div className={`badge badge-sm ${met ? "badge-success" : "badge-error"}`}>
        {met ? <CheckmarkSVG /> : <XSvg />}
      </div>
      <span className="text-gray-800">{label}</span>
    </li>
  ))}
</ul>
```

- `.map()` loops over the `requirements` array and turns each item into a `<li>` element. Whatever `.map()` returns becomes the rendered list
- `{ label, met }` is **destructuring** — instead of writing `requirement.label` and `requirement.met`, this pulls them out directly as variables
- `key={label}` is required by React whenever you render a list. It helps React track which item is which when the list changes
- `` `badge badge-sm ${met ? "badge-success" : "badge-error"}` `` uses a **template literal** (backticks) to build a class string dynamically. The `${}` part inserts the result of the ternary expression into the string

---

## How the full flow works (step by step)

```
User opens the Sign Up page
        ↓
All state starts at its default value (empty strings, false booleans, null error)
        ↓
User types their email → nothing special happens (uncontrolled field)
        ↓
User types their password → onChange fires → setPassword() updates state
        → PasswordRequirements re-renders with the new password
        → Each requirement badge turns green or red in real time
        ↓
User types their confirm password → nothing special (the server checks this)
        ↓
User clicks "Create an Account"
        → handleSignUp runs
        → setLoading(true) disables all inputs and the button
        → signUp(formData) sends everything to the server action
        ↓
Server action (actions.ts) validates:
  - Email format
  - Password length, uppercase, number
  - Passwords match
  - Creates the account in Supabase
        ↓
    FAIL → returns { error: "..." } → page shows the error alert
    SUCCESS → server redirects to /verify-email?from=signup
```
