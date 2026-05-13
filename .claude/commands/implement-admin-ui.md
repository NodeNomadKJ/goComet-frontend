# /implement-admin-ui

Implements the Admin Dashboard with 2 tabs.

## What to implement

1. `src/api/admin.ts` — getTenants, createTenant, getRegions, createRegion
2. `src/pages/AdminDashboard.tsx` — tabbed layout with 2 tabs:

### Tab: Tenants
- Table: name, slug, plan, isActive, id (copyable UUID — for pasting into login form)
- Create form: name, slug, plan (select: STANDARD/PREMIUM)
- Copy-to-clipboard button on each tenant's ID
- Copy-to-clipboard button on each tenant's primary region ID

### Tab: Regions
- Tenant selector dropdown (loaded from GET /admin/tenants)
- Table: name, countryCode, timezone, isActive, id (copyable)
- Create region form: name, countryCode, timezone

## Key Feature
The tenant/region ID copy buttons are the most important part — this lets a demo user
copy the IDs into the login form without needing DB access.

## Verification
- GET /admin/tenants returns seeded tenant
- GET /admin/tenants/:id/regions returns seeded region
- IDs are copyable from the UI
- Create tenant + region flow works
