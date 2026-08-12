# Task p3 — Client Data Isolation Fix Agent

## Summary
Fixed 9 client API routes to scope data to the specific client's assigned employees instead of showing all employees in the tenant.

## Changes Made

### New File
- `/src/lib/client-scope.ts` — Shared utility with `resolveClientId()` and `getClientEmployeeIds()`

### Fixed Routes (9 total)
1. `/src/app/api/client/payroll/route.ts` — Added `employeeId: { in: clientEmpIds }`
2. `/src/app/api/client/billing/route.ts` — Changed to `where: { clientId, accountId }`, removed account info leak
3. `/src/app/api/client/employees/route.ts` — Added `id: { in: clientEmpIds }`
4. `/src/app/api/client/attendance/route.ts` — Scoped to `clientEmpIds`, dept/employee filters validated within scope
5. `/src/app/api/client/leave/route.ts` — Added `employeeId: { in: clientEmpIds }`
6. `/src/app/api/client/reports/route.ts` — All 6 stats filtered to client-scoped employee IDs
7. `/src/app/api/client/departments/route.ts` — Only counts client-assigned employees, fixed sort() bug
8. `/src/app/api/client/downloads/route.ts` — Both doc types filtered by `employeeId: { in: clientEmpIds }`
9. `/src/app/api/client/attendance/download/route.ts` — Uses `resolveClientId()` instead of unreliable `findFirst`

## Pattern
Every route follows: `resolveClientId(cu.user.clientId, accountId)` → `getClientEmployeeIds(db, clientId, accountId)` → filter queries with those IDs.

## Verification
- Lint: PASS (0 errors)
