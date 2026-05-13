# /review-frontend

Architecture compliance audit for the GOComet frontend.

## Checks to perform

1. **Single axios instance** — grep for `import axios` in src/ (should only be in src/api/client.ts)
2. **No token storage** — grep for `access_token` or `localStorage.setItem.*token` in src/
3. **Idempotency keys** — confirm createRide and completeTrip generate uuidv4 headers
4. **No maps** — confirm no leaflet, mapbox, google-maps imports
5. **ProtectedRoute used** — confirm all /rider, /driver, /admin routes are wrapped
6. **No dead code** — confirm no placeholder "coming soon" components
7. **ErrorAlert used** — grep for `alert(` or `console.log(` in pages/ (should be 0)
8. **TypeScript** — run `npm run build` and confirm 0 type errors
9. **Tailwind v4** — confirm no tailwind.config.js, no postcss.config.js
10. **API modules** — confirm all 6 api modules exist (client, auth, rider, driver, ride, trip, admin)

## Report format
For each check: PASS / FAIL + file:line if failed.
