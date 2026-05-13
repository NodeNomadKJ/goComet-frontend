# /setup-frontend

Sets up the Vite + React + TypeScript + Tailwind v4 project scaffold.

## What to implement

1. `package.json` — React 19, Vite 6, Tailwind 4, React Router 7, TanStack Query 5, Axios, uuid
2. `vite.config.ts` — @tailwindcss/vite plugin, port 5173
3. `tsconfig.json` — strict mode, bundler module resolution
4. `index.html` — root div + script tag
5. `src/main.tsx` — QueryClientProvider + AuthProvider + BrowserRouter + App
6. `src/index.css` — `@import "tailwindcss"` (Tailwind v4 CSS entry)
7. `src/App.tsx` — all routes with ProtectedRoute wrapper

## Verification
- `npm install` completes without errors
- `npm run dev` starts on http://localhost:5173
- Navigating to /login shows login page (or redirect from /)
