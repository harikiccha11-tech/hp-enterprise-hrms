# Task 4 — Frontend Feature Agent

## Objective
Add interview scheduling and client assignment dialogs to the Employees module in the HP Enterprise HRMS.

## What Was Done

### 1. ScheduleInterviewDialog
- New dialog component with:
  - **Status Select**: SCHEDULED, COMPLETED, PASSED, FAILED, CANCELLED, NONE (clear)
  - **Date/Time Input**: `datetime-local` input, pre-filled from existing data or defaults to tomorrow
  - **Notes Textarea**: Pre-filled with existing interview notes
  - Date/notes fields hidden when status is NONE
  - Calls `POST /api/admin/employees/[id]/interview` with `{ status, interviewDate, notes }`
  - Uses returned employee data to update the detail view directly

### 2. AssignClientDialog
- New dialog component with:
  - **Client Select**: Loads all clients from `GET /api/admin/clients`
  - **Project Select**: Loads projects from `GET /api/admin/projects`, filtered by selected client
  - "No Client" option to remove assignment
  - Skeleton loading state while fetching
  - Calls `POST /api/admin/employees/[id]/assign-client` with `{ clientId, projectId }`

### 3. UI Integration in ProfileBody
- Added a small pencil icon button next to the "Interview" pipeline step
- Made the assigned client badge clickable (with hover effect) to open AssignClientDialog
- When no client is assigned, shows a dashed "Assign Client" button

### 4. Parent Component Wiring
- Added `schedulingInterview` and `assigningClient` state in the Employees component
- Added `refreshDetail()` helper that re-fetches the employee list and updates the viewing state
- Both dialogs render conditionally like the existing ApproveDialog/RejectDialog/EditDialog pattern

## Files Modified
- `src/components/admin/modules/Employees.tsx` — All changes in this single file
- `worklog.md` — Appended task 4 summary

## Verification
- `bun run lint`: 0 errors, 5 warnings (all pre-existing @react-pdf/renderer alt-text warnings)
- Dev server compiled successfully with no errors
