---
name: frontend-tech-stack
description: Locked tech stack versions for GOComet frontend — do not change without updating this file
metadata:
  type: project
---

# Frontend Tech Stack

## Locked-In Choices

| Library               | Version | Notes                                              |
| --------------------- | ------- | -------------------------------------------------- |
| react                 | ^19.1   | Concurrent features, useTransition                 |
| react-dom             | ^19.1   | Paired with react                                  |
| typescript            | ^5.8    | Strict mode, no `any`                              |
| vite                  | ^6.3    | ESM native, fast HMR                               |
| @vitejs/plugin-react  | ^4.4    | React fast refresh                                 |
| @tailwindcss/vite     | ^4.1    | Tailwind v4 Vite plugin (replaces PostCSS setup)   |
| tailwindcss           | ^4.1    | CSS-based config (`@import "tailwindcss"`)         |
| react-router-dom      | ^7.6    | SPA routing with BrowserRouter                     |
| @tanstack/react-query | ^5.76   | Server state management                            |
| axios                 | ^1.9    | HTTP client with interceptors                      |
| uuid                  | ^11.1   | uuidv4 for idempotency keys                        |

## Rejected Alternatives

| Rejected       | Chosen Instead    | Reason                                           |
| -------------- | ----------------- | ------------------------------------------------ |
| Tailwind CSS 3 | Tailwind CSS 4    | v4 is latest stable; CSS-based config is cleaner |
| React 18       | React 19          | User explicitly requested latest LTS             |
| React Router 6 | React Router 7    | Latest stable at time of build                   |
| Zustand        | React Context     | Auth state is minimal; no global store needed    |
| SWR            | TanStack Query    | Better mutation API and devtools                 |
| fetch API      | Axios             | Interceptors for header injection are cleaner    |
| Redux Toolkit  | TanStack Query    | Overkill for a demo; TQ handles server state     |
| Leaflet/Maps   | lat/lng inputs    | Demo simplicity; no API keys needed              |
| Next.js        | Vite + React      | SSR not needed; simpler setup for demo           |
| Vite 5         | Vite 6            | Latest LTS as requested                          |

## Tailwind v4 Migration Notes
- No `tailwind.config.js` needed
- No `postcss.config.js` needed
- Use `@tailwindcss/vite` Vite plugin
- `index.css` uses `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- Custom theme via CSS custom properties in `index.css`

## Version Pinning Strategy
- Caret ranges (`^`) for all packages — patch/minor updates are safe
- Lock file (`package-lock.json`) pins exact versions
