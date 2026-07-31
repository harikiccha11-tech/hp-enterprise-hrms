# Task 3-4 — Fix Client Portal
## Agent: Main

### Problem
- **C1 (Data mismatch)**: API returned raw Prisma data (nested relations, DateTime objects, mismatched stat keys) that didn't match the frontend TypeScript interfaces.
- **C2 (Placeholder stubs)**: Projects, Work Orders, and Invoices views showed `PlaceholderView` components instead of real data tables.

### Changes Made

#### 1. API Route (`/api/client/dashboard/route.ts`)
- Reshaped all data to match frontend interfaces:
  - `client` → flat object with `id, clientName, companyName, email, phone, address, gst`
  - `stats` → `{ totalProjects, activeProjects, workOrderValue, invoiceTotal, paidAmount }`
  - `projects` → mapped with `memberCount` (from `members.length`), dates as ISO date strings
  - `workOrders` → mapped with `projectName` (from `project.projectName`), proper `startDate`/`endDate`
  - `invoices` → mapped with `amount`, `tax`, `total`, `issueDate`, `dueDate`, `workOrderTitle`
  - `announcements` → mapped `body` → `message`, `postedAt` → `createdAt`
- Added `unreadNotifications` count via `db.notification.count({ where: { userId, read: false } })`

#### 2. ClientLayout.tsx
- Fixed all TypeScript interfaces to match API response
- Added 5th stat card (Paid Amount)
- Welcome banner shows dynamic client name
- Implemented 3 real views:
  - **ProjectsView**: Full table with name, site, status, team, description, period
  - **WorkOrdersView**: Summary cards + full table with WO#, title, project, value (₹), status, period
  - **InvoicesView**: Summary cards (total/paid/outstanding) + full table with invoice#, WO, amount, tax, total, status, dates
- Status badge colors: ACTIVE/OPEN→green, COMPLETED/PAID→blue, ON_HOLD/DRAFT→amber, REJECTED/OVERDUE→red, CLOSED/SENT→gray
- Currency: `Intl.NumberFormat('en-IN')` with ₹ symbol
- Dates: `date-fns` format `dd MMM yyyy`
- Fixed lint errors (no synchronous setState in effects)

### Lint Result
0 errors, 4 pre-existing warnings (in pdfgen.tsx, unrelated)