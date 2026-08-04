# HPHRMS Enterprise – Dual-Mode Platform Architecture

## Overview

Single Next.js + Supabase codebase serving three business models:
1. **HRMS SaaS** – Client owns & manages all employee data
2. **Manpower Supply** – HP Enterprise is employer; client sees only deployed staff + billing
3. **Hybrid** – Client has both internal staff (HRMS) and HP-supplied staff (manpower)

All three operate from identical schema; access control via `account_type`, `client_role`, and row-level security (RLS).

---

## Database Schema

### Core Tables

#### `accounts` (Client/Organization)
```sql
id (UUID, PK)
organization_name (text)
account_type (enum: 'hrms_saas' | 'manpower_supply' | 'hybrid')
status (enum: 'active' | 'trial' | 'suspended')
created_at (timestamp)
expires_at (timestamp, null for perpetual)
billing_contact_email (text)
billing_phone (text)
```

#### `users` (Login credentials)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts)
email (text, unique)
password_hash (text)
full_name (text)
client_role (enum: 'admin' | 'hr' | 'manager' | 'employee' | 'viewer')
status (enum: 'active' | 'disabled')
created_at (timestamp)
last_login (timestamp)
```

#### `employees` (All employee records)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts)
employee_type (enum: 'internal' | 'hp_deployed')
  -- 'internal' = Client's own employee (HRMS SaaS or hybrid)
  -- 'hp_deployed' = HP Enterprise manpower supply
emp_code (text, unique within account)
first_name (text)
last_name (text)
email (text)
phone (text)
aadhaar (text, encrypted)
pan (text, encrypted)
bank_account (text, encrypted)
bank_ifsc (text)
department (text)
designation (text)
date_of_joining (date)
salary_structure_id (UUID, FK → salary_structures, null if manpower)
leave_balance (jsonb)
status (enum: 'active' | 'inactive' | 'on_leave' | 'contract_ended')
created_at (timestamp)
```

#### `salary_structures` (Payroll config per employee)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts)
employee_id (UUID, FK → employees)
basic_salary (decimal)
hra (decimal)
dearness_allowance (decimal)
other_allowances (jsonb)
pf_contribution_employee (decimal)
pf_contribution_employer (decimal)
esi_contribution (decimal)
income_tax_slab (text)
deductions (jsonb)
created_at (timestamp)
updated_at (timestamp)
```

#### `site_assignments` (Manpower supply deployments)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts) -- Client account
employee_id (UUID, FK → employees) -- HP-deployed employee
site_name (text)
location (text)
deployment_date (date)
expected_end_date (date, null if ongoing)
daily_rate (decimal) -- Billing rate
status (enum: 'active' | 'completed' | 'on_hold')
client_visible (boolean, default true)
created_at (timestamp)
```

#### `attendance` (Universal table)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts)
employee_id (UUID, FK → employees)
attendance_date (date)
status (enum: 'present' | 'absent' | 'half_day' | 'wfh' | 'on_leave')
check_in_time (time)
check_out_time (time)
hours_worked (decimal)
marked_by_user_id (UUID, FK → users)
created_at (timestamp)
```

#### `leave_requests` (Leave management)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts)
employee_id (UUID, FK → employees)
leave_type (enum: 'casual' | 'sick' | 'annual' | 'unpaid' | 'maternity' | 'paternity')
start_date (date)
end_date (date)
days_requested (integer)
reason (text)
status (enum: 'pending' | 'approved' | 'rejected' | 'cancelled')
approved_by_user_id (UUID, FK → users)
created_at (timestamp)
updated_at (timestamp)
```

#### `payroll_records` (Monthly payroll)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts)
employee_id (UUID, FK → employees)
payroll_month (date) -- YYYY-MM-01
gross_salary (decimal)
basic_salary (decimal)
allowances (jsonb)
deductions (jsonb)
pf_deduction (decimal)
esi_deduction (decimal)
income_tax_deduction (decimal)
net_salary (decimal)
status (enum: 'draft' | 'generated' | 'approved' | 'processed')
processed_date (timestamp)
created_at (timestamp)
```

#### `invoices` (Manpower billing)
```sql
id (UUID, PK)
account_id (UUID, FK → accounts) -- Client account
invoice_number (text, unique within account)
billing_period_start (date)
billing_period_end (date)
invoice_date (date)
total_amount (decimal)
gst_amount (decimal)
final_amount (decimal)
payment_status (enum: 'draft' | 'sent' | 'overdue' | 'paid')
payment_due_date (date)
created_at (timestamp)
```

#### `invoice_line_items` (Manpower charges)
```sql
id (UUID, PK)
invoice_id (UUID, FK → invoices)
site_assignment_id (UUID, FK → site_assignments)
employee_id (UUID, FK → employees)
daily_rate (decimal)
days_deployed (integer)
line_total (decimal)
created_at (timestamp)
```

---

## Access Control: Row-Level Security (RLS)

### Principle
Every query filters by `account_id` + `client_role` + `employee_type`.

### Policy: `employees` Table

```sql
-- HRMS SaaS clients see all their own internal employees
CREATE POLICY "internal_employees_own_account" ON employees
  FOR SELECT
  USING (
    account_id = auth.uid_to_account_id(auth.user_id())
    AND (employee_type = 'internal' OR account.account_type = 'hybrid')
  );

-- Manpower supply clients see only their deployed employees
CREATE POLICY "deployed_employees_visible_to_client" ON employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM site_assignments
      WHERE site_assignments.account_id = auth.uid_to_account_id(auth.user_id())
        AND site_assignments.employee_id = employees.id
    )
  );

-- HP Enterprise admin sees all employees across all accounts
CREATE POLICY "hp_admin_sees_all" ON employees
  FOR SELECT
  USING (
    auth.user_id() IN (SELECT id FROM users WHERE client_role = 'admin' AND account_id = '00000000-0000-0000-0000-000000000001')
    -- 00000000-0000-0000-0000-000000000001 = HP Enterprise internal account
  );
```

### Policy: `salary_structures` Table

```sql
-- Only visible to account admins and payroll staff (own salary is public)
CREATE POLICY "salary_visible_to_admin_payroll" ON salary_structures
  FOR SELECT
  USING (
    (
      account_id = auth.uid_to_account_id(auth.user_id())
      AND (SELECT client_role FROM users WHERE id = auth.user_id()) IN ('admin', 'hr')
    )
    OR (
      employee_id IN (SELECT id FROM employees WHERE created_by_user_id = auth.user_id())
    )
  );

-- HP Enterprise admin sees all salary structures
CREATE POLICY "hp_admin_payroll_access" ON salary_structures
  FOR SELECT
  USING (
    auth.user_id() IN (SELECT id FROM users WHERE account_id = '00000000-0000-0000-0000-000000000001')
  );
```

### Policy: `invoices` Table

```sql
-- Clients see only invoices for their account
CREATE POLICY "invoices_own_account" ON invoices
  FOR SELECT
  USING (
    account_id = auth.uid_to_account_id(auth.user_id())
  );

-- HP Enterprise sees all invoices
CREATE POLICY "hp_admin_all_invoices" ON invoices
  FOR SELECT
  USING (
    auth.user_id() IN (SELECT id FROM users WHERE account_id = '00000000-0000-0000-0000-000000000001')
  );
```

---

## Frontend: Navigation & Module Visibility

### `useAccountContext()` Hook
```typescript
interface AccountContext {
  accountType: 'hrms_saas' | 'manpower_supply' | 'hybrid';
  userRole: 'admin' | 'hr' | 'manager' | 'employee' | 'viewer';
  accountId: string;
}

const useAccountContext = () => {
  const { data: account } = useQuery("currentAccount");
  const { data: user } = useQuery("currentUser");
  return {
    accountType: account.account_type,
    userRole: user.client_role,
    accountId: account.id,
  };
};
```

### Sidebar Navigation (Dynamic Modules)
```typescript
const getVisibleModules = (accountType, userRole) => {
  const common = ['Dashboard', 'Settings', 'Support'];

  if (accountType === 'hrms_saas') {
    return [
      ...common,
      'Employees',
      'Attendance',
      'Payroll',
      'Leave',
      'Recruitment',
      'Documents',
      'Performance',
      'Reports',
      'AI Assistant',
    ];
  }

  if (accountType === 'manpower_supply') {
    return [
      ...common,
      'Deployed Staff',
      'Site Assignments',
      'Attendance',
      'Leave Status',
      'Timesheets',
      'Invoices',
      'Payments',
    ];
  }

  if (accountType === 'hybrid') {
    // Both sets, with clear visual separation
    return [
      ...common,
      '--- Internal Staff ---',
      'Employees',
      'Attendance (Internal)',
      'Payroll',
      'Leave',
      'Recruitment',
      'Documents',
      'Performance',
      '--- HP Deployed Staff ---',
      'Deployed Staff',
      'Site Assignments',
      'Attendance (Deployed)',
      'Leave Status',
      'Invoices',
      'Payments',
      'Reports',
      'AI Assistant',
    ];
  }
};
```

---

## API Routes: Automatic Filtering

### `/api/employees` – GET
```typescript
export async function GET(req: Request) {
  const { accountId, userRole } = await getSession(req);

  const account = await db.query(`
    SELECT account_type FROM accounts WHERE id = $1
  `, [accountId]);

  let query = `
    SELECT * FROM employees 
    WHERE account_id = $1
  `;
  const params = [accountId];

  if (account.account_type === 'hrms_saas' || account.account_type === 'hybrid') {
    query += ` AND employee_type = 'internal'`;
  }

  if (account.account_type === 'manpower_supply') {
    query += ` AND employee_type = 'hp_deployed'`;
  }

  if (userRole === 'manager') {
    query += ` AND department = (SELECT department FROM users WHERE id = $2)`;
    params.push(userId);
  }

  const employees = await db.query(query, params);
  return Response.json(employees);
}
```

### `/api/salary-structures` – GET
```typescript
export async function GET(req: Request) {
  const { accountId, userRole } = await getSession(req);

  // Only admin/hr can access
  if (!['admin', 'hr'].includes(userRole)) {
    return new Response('Forbidden', { status: 403 });
  }

  const salaries = await db.query(`
    SELECT ss.* FROM salary_structures ss
    JOIN employees e ON ss.employee_id = e.id
    WHERE e.account_id = $1 AND e.employee_type = 'internal'
  `, [accountId]);

  return Response.json(salaries);
}
```

### `/api/invoices` – GET
```typescript
export async function GET(req: Request) {
  const { accountId } = await getSession(req);

  const invoices = await db.query(`
    SELECT * FROM invoices 
    WHERE account_id = $1
    ORDER BY invoice_date DESC
  `, [accountId]);

  return Response.json(invoices);
}
```

---

## Onboarding Flow (Client Setup)

### Step 1: Account Creation
```typescript
async function createAccount(data: {
  organizationName: string;
  contactEmail: string;
  accountType: 'hrms_saas' | 'manpower_supply' | 'hybrid';
}) {
  const newAccount = await db.insert('accounts', {
    organization_name: data.organizationName,
    account_type: data.accountType,
    status: 'active',
    created_at: new Date(),
  });

  return newAccount;
}
```

### Step 2: Admin User Creation
```typescript
async function createAdminUser(data: {
  accountId: string;
  email: string;
  password: string;
  fullName: string;
}) {
  const newUser = await db.insert('users', {
    account_id: data.accountId,
    email: data.email,
    password_hash: await hash(data.password),
    full_name: data.fullName,
    client_role: 'admin',
    status: 'active',
  });

  return newUser;
}
```

### Step 3: Quick Setup (Sample Data for Demo)
```typescript
async function setupDemoData(accountId: string, accountType: string) {
  if (accountType === 'hrms_saas' || accountType === 'hybrid') {
    // Add 3 sample internal employees
    await db.insert('employees', {
      account_id: accountId,
      employee_type: 'internal',
      emp_code: 'EMP001',
      first_name: 'Rajesh',
      last_name: 'Sharma',
      email: 'rajesh@example.com',
      department: 'Engineering',
      designation: 'Senior Developer',
      date_of_joining: new Date('2023-01-15'),
    });
  }

  if (accountType === 'manpower_supply' || accountType === 'hybrid') {
    // Add sample deployment
    await db.insert('employees', {
      account_id: accountId,
      employee_type: 'hp_deployed',
      emp_code: 'HP001',
      first_name: 'Amit',
      last_name: 'Kumar',
      email: 'amit@hpenterprise.com',
      designation: 'Site Supervisor',
    });
  }
}
```

---

## Use Cases

### Client A: HRMS SaaS
- **Account Type:** `hrms_saas`
- **Visible Modules:** Employees, Attendance, Payroll, Leave, Recruitment, Documents, Performance, Reports, AI Assistant
- **Data Access:** All internal employees + full salary structures
- **Invoices:** None (software subscription only)

### Client B: Manpower Supply
- **Account Type:** `manpower_supply`
- **Visible Modules:** Deployed Staff, Site Assignments, Attendance, Leave Status, Timesheets, Invoices, Payments
- **Data Access:** Only deployed employees (via `site_assignments`) + attendance + timesheets
- **Salary Access:** None (confidential to HP Enterprise)
- **Invoices:** Billing for deployed manpower

### Client C: Hybrid
- **Account Type:** `hybrid`
- **Visible Modules:** Both sets (with clear separation)
- **Internal Employees:** Full HRMS (80 staff)
- **Deployed Employees:** Manpower track (20 staff via site assignments)
- **Invoices:** Billing only for deployed staff (not internal)

---

## Revenue Models Enabled

### 1. HRMS SaaS (Monthly Subscription)
- Per-employee pricing or fixed tier
- Example: $50–200/employee/month
- Recurring billing

### 2. Manpower Supply (Deployment + Billing)
- Daily rate per deployed employee
- 20–30% markup on employee salary
- Auto-invoice on deployment end date

### 3. Hybrid (Blended)
- HRMS subscription + manpower billing
- Highest margins (both fees)

---

## Security & Compliance

1. **Encryption at Rest**
   - Aadhaar, PAN, bank account data encrypted via `pgsql-crypto`
   - Decryption only by authenticated users with `admin` or `hr` role

2. **Encryption in Transit**
   - All API calls over HTTPS
   - JWT tokens in secure HTTP-only cookies

3. **Audit Log**
   ```sql
   CREATE TABLE audit_logs (
     id UUID PRIMARY KEY,
     account_id UUID,
     user_id UUID,
     action TEXT,
     table_name TEXT,
     record_id UUID,
     old_values JSONB,
     new_values JSONB,
     timestamp TIMESTAMP
   );
   ```

4. **Row-Level Security**
   - Every SELECT filtered by `account_id` + `client_role`
   - INSERT/UPDATE/DELETE blocked at DB level for cross-account access

5. **Statutory Compliance**
   - PF/ESI calculations per Indian rules
   - Section 87A rebate for low-income employees
   - TDS on salary deposits

---

## Deployment Checklist

- [ ] Schema + RLS policies in Supabase (production)
- [ ] API routes (Next.js) with automatic filtering
- [ ] Frontend modules (dynamic sidebar, access checks)
- [ ] Onboarding flow (account type selection)
- [ ] Demo data seeding per account type
- [ ] Audit logging on all sensitive operations
- [ ] Invoice generation automation (manpower supply)
- [ ] Payroll engine (HRMS SaaS accounts)
- [ ] Email notifications (leave approvals, invoice reminders)
- [ ] Admin dashboard (HP Enterprise overview)

---

## Next Steps

1. **Schema Deployment** → Supabase prod (migration script)
2. **RLS Policy Testing** → Supabase console (verify cross-account leaks)
3. **API Route Refactor** → Add automatic `account_id` filtering
4. **Frontend Refactor** → Sidebar + module visibility
5. **Onboarding Build** → Account type selector → setup flow
6. **Demo Environment** → Test all three modes end-to-end
7. **Billing Integration** → Stripe for HRMS, manual for manpower invoicing
8. **Go-Live Comms** → Client announcement (new features, data privacy)
