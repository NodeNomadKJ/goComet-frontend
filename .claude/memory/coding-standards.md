---
name: frontend-coding-standards
description: TypeScript, React, and component patterns for the GOComet frontend
metadata:
  type: project
---

# Frontend Coding Standards

## TypeScript

- `strict: true` always — no `any`, no type assertions without comment
- Prefer `interface` for object shapes passed between components
- Export types from `src/types/index.ts` — no inline type definitions in API modules
- `unknown` over `any` for error catches: `const err = e as Error`

## File Naming

- `PascalCase.tsx` for React components and pages
- `camelCase.ts` for non-component modules (api, hooks, utils)
- Page files end in `Page.tsx` (e.g. `LoginPage.tsx`)
- Component files are named by their export (e.g. `StatusBadge.tsx`)

## Component Patterns

```tsx
// Functional components only — no class components
export function MyComponent({ prop }: { prop: string }) {
  return <div>{prop}</div>;
}

// Default exports only for pages; named exports for shared components
// Pages: export default function LoginPage()
// Components: export function StatusBadge()
```

## API Calls — Always Through TanStack Query

```tsx
// Query (read)
const { data, isLoading, error } = useQuery({
  queryKey: ['riders', 'profile'],
  queryFn: riderApi.getProfile,
});

// Mutation (write)
const mutation = useMutation({
  mutationFn: riderApi.updateProfile,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['riders', 'profile'] }),
});
```

## Error Handling

```tsx
// Always use ErrorAlert component for user-facing errors
{mutation.error && <ErrorAlert error={mutation.error} />}

// In ErrorAlert: extract from axios response
const msg = axiosErr.response?.data?.message ?? axiosErr.message ?? 'Something went wrong';
```

## Form Pattern (no form library — vanilla controlled inputs)

```tsx
const [form, setForm] = useState({ email: '', password: '' });

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  mutation.mutate(form);
};
```

## Loading States

```tsx
{isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
```

## Tailwind v4 Class Patterns

```tsx
// Buttons
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">

// Form inputs
<input className="border border-gray-300 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500">

// Cards / panels
<div className="bg-white border border-gray-200 rounded-lg p-4">

// Tab buttons (active vs inactive)
<button className={`px-4 py-2 text-sm font-medium border-b-2 ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
```

## Testing
- No automated tests for the frontend demo
- Manual test via browser after each phase (see FRONTEND_PROGRESS.md)
