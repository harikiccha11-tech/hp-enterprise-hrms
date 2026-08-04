# HPHRMS Enterprise Dual-Mode – Deployment & Testing Checklist

**Status:** Ready for Production Deployment  
**Date:** August 5, 2026  
**Target:** Supabase aihrms-prod (Mumbai) + Vercel  

---

## Phase 1: Database & Security (Supabase)

### Schema Migration
- [ ] Execute `migration_dual_mode_schema.sql` on aihrms-prod
  - [ ] All tables created (accounts, users, employees, salary_structures, site_assignments, etc.)
  - [ ] All indexes applied
  - [ ] Enum types registered
  - [ ] Triggers + functions deployed

### Row-Level Security
- [ ] Verify RLS enabled on all tables
  - [ ] accounts
  - [ ] users
  - [ ] employees
  - [ ] salary_structures
  - [ ] site_assignments
  - [ ] attendance
  - [ ] leave_requests
  - [ ] payroll_records
  - [ ] invoices
  - [ ] invoice_line_items
  - [ ] audit_logs

- [ ] Test RLS isolation (critical)
  - [ ] Client A cannot see Client B's employees
  - [ ] Client A cannot see salary structures (without admin role)
  - [ ] HP admin can see all accounts
  - [ ] Deployed employees visible only via site_assignments

### Data Encryption
- [ ] Aadhaar encrypted (pgsql-crypto or app-level AES-256-GCM)
- [ ] PAN encrypted
- [ ] Bank account encrypted
- [ ] Decryption keys stored in Vercel secrets
- [ ] Test encrypt/decrypt cycle

### Seed Data
- [ ] HP Enterprise internal account created (`00000000-0000-0000-0000-000000000001`)
- [ ] HP admin user created
- [ ] Test account login works

---

## Phase 2: Backend API (Next.js)

### API Route Structure
- [ ] `/api/employees` – GET (list), POST (create)
- [ ] `/api/employees/[id]` – GET, PATCH, DELETE
- [ ] `/api/salary-structures` – GET (admin/hr only), POST, PATCH
- [ ] `/api/site-assignments` – GET, POST, PATCH
- [ ] `/api/attendance` – GET, POST, PATCH
- [ ] `/api/leave-requests` – GET, POST, PATCH
- [ ] `/api/payroll` – GET (admin/hr only), POST
- [ ] `/api/invoices` – GET (clients), POST (HP admin)
- [ ] `/api/dashboard` – GET (account-type specific)
- [ ] `/api/auth/login` – POST
- [ ] `/api/auth/logout` – POST
- [ ] `/api/auth/account` – GET
- [ ] `/api/auth/user` – GET
- [ ] `/api/onboarding/create-account` – POST

### Middleware & Security
- [ ] JWT verification on all routes
- [ ] Account_id filtering applied automatically
- [ ] Role-based access checks (admin, hr, manager, employee, viewer)
- [ ] Session extraction from HTTP-only cookies
- [ ] CORS configured for Vercel domain only
- [ ] Rate limiting enabled (e.g., 100 req/min per IP)

### Error Handling
- [ ] 401 for missing/expired JWT
- [ ] 403 for insufficient permissions
- [ ] 404 for missing resources
- [ ] 500 with error logging for server errors
- [ ] No sensitive data in error responses

### Testing API Access Control
- [ ] Client A (HRMS) can GET internal employees
- [ ] Client A (HRMS) cannot GET manpower employees
- [ ] Client B (Manpower) cannot GET internal employees
- [ ] Client B (Manpower) can GET deployed employees (via site_assignments)
- [ ] Non-admin cannot GET salary_structures
- [ ] HP admin can GET everything
- [ ] Attendance creation fails for cross-account employees
- [ ] Invoice creation fails for non-HP admin

---

## Phase 3: Frontend & UI (React)

### Account Context Setup
- [ ] `useAccountContext()` hook working
- [ ] Account + User data fetched on app load
- [ ] Session expiration redirects to login
- [ ] Account type propagates to all components

### Dynamic Sidebar
- [ ] Sidebar modules filtered by account type
  - [ ] HRMS SaaS: Shows internal staff modules only
  - [ ] Manpower Supply: Shows deployed staff modules only
  - [ ] Hybrid: Shows both with clear section separation
- [ ] Modules filtered by user role
  - [ ] Admin: All relevant modules
  - [ ] HR: All except payroll (if configured)
  - [ ] Manager: Department-specific modules
  - [ ] Employee: Leave, attendance, documents
  - [ ] Viewer: Read-only access
- [ ] Module visibility tested on each account type

### Module Guards
- [ ] `<ModuleGuard>` component protects routes
- [ ] Unauthorized access returns fallback message
- [ ] No API calls attempted for restricted modules

### Dashboard
- [ ] Account type badge displayed
- [ ] Employee count (internal) shown for HRMS
- [ ] Deployed staff count shown for manpower
- [ ] Pending leave requests card
- [ ] Unpaid invoices card (manpower only)
- [ ] Recent activity feed

---

## Phase 4: Onboarding Flow (Multi-Step Wizard)

### Step 1: Account Type Selection
- [ ] Three options displayed (HRMS, Manpower, Hybrid)
- [ ] Descriptions clear and accurate
- [ ] Selection advances to Step 2

### Step 2: Organization Details
- [ ] Form fields: org name, contact email, phone
- [ ] Validation: email, required fields
- [ ] Error messages display correctly
- [ ] Data persists on back navigation

### Step 3: Admin User Setup
- [ ] Form fields: name, email, password
- [ ] Password validation: 8+ chars, mixed case, special char
- [ ] Show/hide password toggle works
- [ ] Error messages display

### Step 4: Confirmation Review
- [ ] All entered data displayed
- [ ] Account type description shown
- [ ] Demo data description matches account type
- [ ] "Create Account" button initiates API call

### Step 5: Success Screen
- [ ] Confirms account created
- [ ] Shows login email
- [ ] Lists next steps
- [ ] "Go to Dashboard" button works

### API: Create Account
- [ ] POST `/api/onboarding/create-account` validates all fields
- [ ] Creates account with correct `account_type`
- [ ] Creates admin user with hashed password
- [ ] Generates demo data (sample employees, deployments)
- [ ] Returns auth token (auto-login)
- [ ] Audit log created
- [ ] Error handling for duplicate email

---

## Phase 5: Demo Data & Sample Accounts

### Test Account 1: HRMS SaaS (Client A)
- [ ] Account Type: `hrms_saas`
- [ ] Admin user created (admin@clienta.com)
- [ ] Sample Employees:
  - [ ] 3 internal employees (EMP001, EMP002, EMP003)
  - [ ] Assigned to departments (Engineering, HR, Sales)
  - [ ] Salary structures created
  - [ ] Leave balances initialized
- [ ] Cannot see manpower modules or deployed staff
- [ ] Sidebar shows only HRMS modules

### Test Account 2: Manpower Supply (Client B)
- [ ] Account Type: `manpower_supply`
- [ ] Admin user created (admin@clientb.com)
- [ ] Sample Data:
  - [ ] 1 HP-deployed employee
  - [ ] Site assignment (daily rate, deployment date)
  - [ ] Sample invoice generated
  - [ ] Invoice line items created
- [ ] Cannot see HRMS modules or internal employees
- [ ] Sidebar shows only manpower modules

### Test Account 3: Hybrid (Client C)
- [ ] Account Type: `hybrid`
- [ ] Admin user created (admin@clientc.com)
- [ ] Sample Data:
  - [ ] 5 internal employees (HRMS)
  - [ ] 3 HP-deployed employees
  - [ ] Salary structures for internal staff
  - [ ] Site assignments for deployed staff
  - [ ] Invoice for deployed staff (not internal)
- [ ] Sidebar shows both sets of modules with clear separation
- [ ] Internal employees NOT visible in manpower views
- [ ] Deployed employees NOT visible in HRMS payroll

### HP Enterprise Internal Account
- [ ] Account ID: `00000000-0000-0000-0000-000000000001`
- [ ] Account Type: `hybrid`
- [ ] Admin user created (admin@hpenterprise.com)
- [ ] Can view all accounts, employees, invoices
- [ ] Dashboard shows HP-wide statistics

---

## Phase 6: End-to-End Testing

### Scenario 1: HRMS Workflow (Client A)
1. [ ] Admin logs in → sees dashboard
2. [ ] Navigate to Employees → lists 3 sample employees
3. [ ] Click employee → view profile, salary, documents
4. [ ] Mark attendance → records saved
5. [ ] Submit leave request → creates with "pending" status
6. [ ] As HR, approve leave → updates status
7. [ ] Run payroll for month → generates payroll records
8. [ ] View payroll details (admin/hr only) → salary breakdown
9. [ ] View reports → charts show attendance, turnover
10. [ ] Sidebar shows no manpower modules

### Scenario 2: Manpower Workflow (Client B)
1. [ ] Admin logs in → sees deployed staff dashboard
2. [ ] Navigate to Deployed Staff → lists 1 sample employee
3. [ ] View Site Assignments → shows deployment details
4. [ ] Check Attendance → marks deployed staff present
5. [ ] View Leave Status → pending leave for deployed staff
6. [ ] View Invoices → shows billing for deployments
7. [ ] Pay invoice → marks as paid
8. [ ] Sidebar shows no HRMS modules

### Scenario 3: Hybrid Workflow (Client C)
1. [ ] Admin logs in → dashboard shows both internal & deployed
2. [ ] Navigate to Employees (Internal) → lists 5 internal staff
3. [ ] Navigate to Deployed Staff → lists 3 deployed employees
4. [ ] Mark attendance for internal employee
5. [ ] Mark attendance for deployed employee
6. [ ] Run payroll for internal staff only (no deployed)
7. [ ] View invoices for deployed staff billing
8. [ ] Sidebar shows both sections with visual separation

### Scenario 4: HP Admin Oversight
1. [ ] HP admin logs in (internal account)
2. [ ] Dashboard shows aggregated stats (all accounts)
3. [ ] Can navigate to any client account view (via admin panel)
4. [ ] Can view all employees (internal + deployed)
5. [ ] Can modify any account settings
6. [ ] Audit log records all actions

### Cross-Account Isolation Test
1. [ ] Client A logs in
2. [ ] Attempt to access Client B's data via URL (`/api/employees?account_id=client_b_id`)
   - [ ] Request denied (RLS blocks)
3. [ ] Attempt to fetch Client B's invoices
   - [ ] Request denied
4. [ ] Attempt to update Client B's employee
   - [ ] Request denied
5. [ ] All attempts logged in audit

---

## Phase 7: Performance & Load Testing

### Database
- [ ] Employee query (<100ms for 1000 employees)
- [ ] Attendance query (<200ms for 10k records)
- [ ] Invoice query (<150ms for 500 invoices)
- [ ] RLS policy overhead < 10ms per query
- [ ] Connection pooling configured (Supabase: 15 connections)

### API Endpoints
- [ ] GET /api/employees (<500ms)
- [ ] GET /api/attendance (<500ms)
- [ ] POST /api/attendance (<300ms)
- [ ] GET /api/invoices (<400ms)
- [ ] No N+1 queries in related data fetches

### Frontend
- [ ] Dashboard loads (<1.5s)
- [ ] Sidebar module filter (<100ms)
- [ ] Table pagination (50 rows) (<300ms)
- [ ] No memory leaks on context changes

### Load Test
- [ ] 100 concurrent requests to /api/employees
- [ ] 50 concurrent POST requests to /api/attendance
- [ ] All requests succeed without timeout
- [ ] Database connection stable

---

## Phase 8: Security Audit

### Authentication
- [ ] JWT tokens issued on login
- [ ] Tokens stored in HTTP-only, Secure cookies
- [ ] Token expiration: 24 hours
- [ ] Refresh token mechanism working
- [ ] Password hashing: bcrypt with salt
- [ ] Brute force protection: account lockout after 5 failed attempts

### Authorization
- [ ] RLS policies tested and enforced
- [ ] Account_id filtering on all queries
- [ ] No privilege escalation possible
- [ ] Cross-account access blocked at DB level

### Data Protection
- [ ] Aadhaar/PAN/Bank encrypted with AES-256-GCM
- [ ] Encryption key rotated annually
- [ ] Decryption audit logged
- [ ] HTTPS enforced (redirect HTTP → HTTPS)

### Audit Logging
- [ ] All data modifications logged
  - [ ] INSERT/UPDATE/DELETE on sensitive tables
  - [ ] User, timestamp, old/new values recorded
- [ ] Audit logs archived monthly
- [ ] Access logs for sensitive data (salary, PAN) retained 1 year

### Compliance
- [ ] Data localization: Supabase Mumbai region
- [ ] GDPR compliance: Data deletion on account termination
- [ ] GST: Invoice generation includes GST (18%)
- [ ] PF/ESI: Correct statutory calculations per Indian rules
- [ ] TDS: Correct TDS computation (if applicable)

---

## Phase 9: Monitoring & Alerts

### Supabase
- [ ] Database CPU usage < 70%
- [ ] Connection count < 50 concurrent
- [ ] Query performance: p95 < 500ms
- [ ] Disk usage monitored

### Vercel
- [ ] API response times logged
- [ ] Error rates monitored (< 0.1%)
- [ ] Function duration < 2s
- [ ] Serverless concurrency configured

### Custom Metrics
- [ ] Account login count (daily)
- [ ] API error rate by endpoint
- [ ] Data export requests logged
- [ ] Failed RLS access attempts logged

### Alerts
- [ ] Slack notification on error rate > 1%
- [ ] Email on database connection pool exhaustion
- [ ] SMS on security events (failed RLS attempts)

---

## Phase 10: Documentation & Handoff

### API Documentation
- [ ] OpenAPI/Swagger spec generated
- [ ] All endpoints documented (input, output, errors)
- [ ] Example requests for each scenario
- [ ] Error codes and messages documented

### User Documentation
- [ ] Admin guide: Account setup, user management
- [ ] HR guide: Payroll, leave approvals
- [ ] Employee guide: Leave requests, documents
- [ ] Manpower guide: Deployment, invoices, payments

### Developer Documentation
- [ ] Schema ER diagram
- [ ] RLS policy explanation
- [ ] API auth flow documented
- [ ] Deployment runbook for Vercel + Supabase
- [ ] Backup & recovery procedures

### Training
- [ ] HP team: Multi-tenancy architecture
- [ ] Client admins: Dashboard overview, initial setup
- [ ] Support team: Troubleshooting guide, FAQ

---

## Phase 11: Go-Live Preparation

### Backups
- [ ] Supabase automated backups enabled (daily)
- [ ] Full backup stored in S3
- [ ] Backup restore tested

### Disaster Recovery
- [ ] RTO (Recovery Time Objective): < 4 hours
- [ ] RPO (Recovery Point Objective): < 1 hour
- [ ] Failover plan documented
- [ ] DNS failover configured

### Communication
- [ ] Customer announcement email
  - [ ] New dual-mode features
  - [ ] No action required for existing users
  - [ ] Data migration (if applicable)
- [ ] Support hotline staffed 24/7 for first week
- [ ] Status page created (status.hphrms.com)

### Gradual Rollout
- [ ] Phase 1 (Week 1): HP Enterprise internal testing
- [ ] Phase 2 (Week 2): Onboarding new clients
- [ ] Phase 3 (Week 3): Migrate existing clients (optional)
- [ ] Phase 4 (Week 4): Production stabilization

---

## Sign-Off

- [ ] CTO: Architecture approved
- [ ] QA Lead: All tests passed
- [ ] Security: Security audit complete, no critical issues
- [ ] Product Manager: Feature complete, ready for launch
- [ ] Finance: Billing logic correct
- [ ] Legal: Compliance confirmed

---

## Post-Launch (First 30 Days)

- [ ] Monitor error rates daily
- [ ] Weekly client feedback calls
- [ ] Analyze usage patterns by account type
- [ ] Optimize RLS policies if needed
- [ ] Measure payroll calculation accuracy (vs. manual checks)
- [ ] Resolve any critical bugs within 24 hours

---

**Notes:**
- All test data to be deleted before production launch
- HP internal account (`00000000-...`) is production-only
- Encryption keys to be stored in Vercel secrets (never commit)
- Supabase service role key only used server-side
- Client credentials never logged or exposed in errors
