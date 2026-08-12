---
Task ID: p2
Agent: HPAI Portal-Awareness + Security Fix Agent
Task: Role-based HPAI system prompts, document IDOR fix, dashboard data minimization

Work Log:
- Fixed `/src/app/api/ai/chat/route.ts`: Replaced single `SYSTEM_PROMPT` constant with `getSystemPrompt(role)` function providing 5 distinct role-based prompts:
  - OWNER/SUPER_ADMIN/HR_MANAGER: Full admin prompt with company details, financial data access, all modules
  - EMPLOYEE: Restricted prompt — only own data, NO company revenue/salaries/client billing/GSTIN/director names
  - CLIENT: Restricted prompt — only own projects/invoices/assigned employee attendance, NO salaries/other client data/GSTIN
  - CANDIDATE: Restricted prompt — only jobs/interviews/career guidance, NO internal data/GSTIN/director names
  - Anonymous (no auth): Public marketing prompt — only product features, pricing overview, how to sign up
- Updated auth flow to allow anonymous chat access (keyed by IP) with public prompt instead of rejecting unauthenticated users
- Verified `/src/components/shared/HpAiChat.tsx` — frontend already has role-specific welcome messages and quick actions per role (no changes needed)
- Fixed `/src/app/api/documents/[id]/route.ts`: Added role-based access control:
  - EMPLOYEE: Only own documents (existing check, preserved)
  - CLIENT: Rejected with 403
  - CANDIDATE: Rejected with 403
  - OWNER/SUPER_ADMIN/HR_MANAGER: Full access
- Fixed `/src/app/api/employee/dashboard/route.ts`: Removed `payrolls` include from dashboard query to minimize data exposure (employees have dedicated `/api/employee/salary-slips` endpoint). Added explanatory comment.

Stage Summary:
- **HPAI Prompt Security**: 5 distinct role-based system prompts prevent AI from leaking sensitive data to lower-privilege roles. Each prompt explicitly lists forbidden topics with canned refusal text.
- **Anonymous Access**: Unauthenticated users can now chat with HPAI but only receive marketing/product information (no internal data).
- **Document IDOR Fixed**: CLIENT and CANDIDATE roles are now explicitly blocked from accessing generated documents by ID. Previously only EMPLOYEE was restricted.
- **Dashboard Minimization**: Removed full payroll/salarySlip data from employee dashboard API response. Verified no frontend components depend on this data from the dashboard endpoint.
- **Lint**: PASS (0 errors)
