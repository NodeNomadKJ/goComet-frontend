---
name: frontend-progress-notes
description: Session-by-session decisions, deviations, and notes for the GOComet frontend
metadata:
  type: project
---

# Progress Notes

## Template

```
Date: YYYY-MM-DD
Phase/Module: 
Decisions Made:
- 
Deviations from plan:
-
Issues encountered:
-
```

---

## 2026-05-13 — Project Bootstrap

**Phase/Module:** Project Setup + Planning

**Decisions Made:**
- Frontend placed at `/Users/bhaskarjha/Desktop/Assignment/gocomet-ride-hailing-frontend/`
  (sibling to backend, not nested inside it — user corrected this)
- Latest LTS versions chosen: React 19, Vite 6, Tailwind 4, React Router 7, TanStack Query 5
- Tailwind v4 selected → no tailwind.config.js, use @tailwindcss/vite plugin
- CORS enabled on backend (apps/api/src/main.ts) to allow any origin with credentials
- Tenant + Region IDs: entered on login form, stored in localStorage (seed generates random UUIDs)
- No maps: lat/lng number inputs only

**Deviations from plan:**
- Initially wrote partial src/ files before plan was approved — all cleaned up and restarted fresh

**Issues encountered:**
- None at setup stage
