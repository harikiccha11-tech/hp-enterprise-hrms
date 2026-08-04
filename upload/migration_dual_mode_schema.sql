-- HPHRMS Enterprise – Dual Mode Schema & RLS Policies
-- Production Migration Script for Supabase
-- Created: 2026-08-05
-- Target: aihrms-prod (Mumbai) Supabase instance

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE account_type_enum AS ENUM (
  'hrms_saas',
  'manpower_supply',
  'hybrid'
);

CREATE TYPE account_status_enum AS ENUM (
  'active',
  'trial',
  'suspended',
  'cancelled'
);

CREATE TYPE client_role_enum AS ENUM (
  'admin',
  'hr',
  'manager',
  'employee',
  'viewer'
);

CREATE TYPE user_status_enum AS ENUM (
  'active',
  'disabled',
  'deleted'
);

CREATE TYPE employee_type_enum AS ENUM (
  'internal',
  'hp_deployed'
);

CREATE TYPE employee_status_enum AS ENUM (
  'active',
  'inactive',
  'on_leave',
  'contract_ended',
  'terminated'
);

CREATE TYPE attendance_status_enum AS ENUM (
  'present',
  'absent',
  'half_day',
  'wfh',
  'on_leave',
  'holiday'
);

CREATE TYPE leave_type_enum AS ENUM (
  'casual',
  'sick',
  'annual',
  'unpaid',
  'maternity',
  'paternity',
  'bereavement',
  'study',
  'vpl'
);

CREATE TYPE leave_status_enum AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'cancelled_by_employee'
);

CREATE TYPE payroll_status_enum AS ENUM (
  'draft',
  'generated',
  'approved',
  'processed',
  'paid'
);

CREATE TYPE invoice_status_enum AS ENUM (
  'draft',
  'sent',
  'overdue',
  'paid',
  'cancelled'
);

CREATE TYPE site_assignment_status_enum AS ENUM (
  'active',
  'completed',
  'on_hold',
  'cancelled'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Accounts (Organizations)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  account_type account_type_enum NOT NULL,
  status account_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  billing_contact_email TEXT,
  billing_phone TEXT,
  gst_number TEXT,
  pan_number TEXT,
  billing_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  notes TEXT
);

CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_account_type ON accounts(account_type);

-- Users (Login credentials & roles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  client_role client_role_enum NOT NULL DEFAULT 'employee',
  status user_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  phone TEXT,
  department TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  UNIQUE(account_id, email)
);

CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Employees (Universal employee table)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_type employee_type_enum NOT NULL,
  emp_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  -- Encrypted fields (use pgsql-crypto or application-level encryption)
  aadhaar_encrypted TEXT,
  pan_encrypted TEXT,
  bank_account_encrypted TEXT,
  bank_ifsc TEXT,
  -- Employment details
  department TEXT,
  designation TEXT,
  date_of_joining DATE,
  date_of_birth DATE,
  gender TEXT,
  marital_status TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  -- Leave & status
  leave_balance JSONB DEFAULT '{"casual": 0, "sick": 0, "annual": 0}'::jsonb,
  status employee_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id),
  UNIQUE(account_id, emp_code)
);

CREATE INDEX idx_employees_account_id ON employees(account_id);
CREATE INDEX idx_employees_employee_type ON employees(employee_type);
CREATE INDEX idx_employees_emp_code ON employees(emp_code);
CREATE INDEX idx_employees_status ON employees(status);

-- Salary Structures (Per employee, internal only)
CREATE TABLE salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  basic_salary DECIMAL(12, 2) NOT NULL,
  hra DECIMAL(12, 2) DEFAULT 0,
  dearness_allowance DECIMAL(12, 2) DEFAULT 0,
  other_allowances JSONB DEFAULT '{}'::jsonb,
  pf_contribution_employee DECIMAL(12, 2) DEFAULT 0,
  pf_contribution_employer DECIMAL(12, 2) DEFAULT 0,
  esi_contribution DECIMAL(12, 2) DEFAULT 0,
  income_tax_slab TEXT,
  deductions JSONB DEFAULT '{}'::jsonb,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id),
  UNIQUE(employee_id, effective_from)
);

CREATE INDEX idx_salary_structures_account_id ON salary_structures(account_id);
CREATE INDEX idx_salary_structures_employee_id ON salary_structures(employee_id);

-- Site Assignments (Manpower deployments)
CREATE TABLE site_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  location TEXT,
  deployment_date DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,
  daily_rate DECIMAL(12, 2) NOT NULL,
  status site_assignment_status_enum NOT NULL DEFAULT 'active',
  client_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_site_assignments_account_id ON site_assignments(account_id);
CREATE INDEX idx_site_assignments_employee_id ON site_assignments(employee_id);
CREATE INDEX idx_site_assignments_status ON site_assignments(status);

-- Attendance (Universal table)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status attendance_status_enum NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  hours_worked DECIMAL(5, 2),
  notes TEXT,
  marked_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

CREATE INDEX idx_attendance_account_id ON attendance(account_id);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);

-- Leave Requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type leave_type_enum NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested DECIMAL(5, 2) NOT NULL,
  reason TEXT,
  status leave_status_enum NOT NULL DEFAULT 'pending',
  approved_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, start_date, leave_type)
);

CREATE INDEX idx_leave_requests_account_id ON leave_requests(account_id);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- Payroll Records (Internal employees only)
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month DATE NOT NULL, -- YYYY-MM-01
  gross_salary DECIMAL(12, 2),
  basic_salary DECIMAL(12, 2),
  allowances JSONB,
  deductions JSONB,
  pf_deduction DECIMAL(12, 2),
  esi_deduction DECIMAL(12, 2),
  income_tax_deduction DECIMAL(12, 2),
  net_salary DECIMAL(12, 2),
  status payroll_status_enum NOT NULL DEFAULT 'draft',
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id),
  UNIQUE(employee_id, payroll_month)
);

CREATE INDEX idx_payroll_records_account_id ON payroll_records(account_id);
CREATE INDEX idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_records_status ON payroll_records(status);

-- Invoices (Manpower supply billing)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  invoice_date DATE NOT NULL,
  total_amount DECIMAL(14, 2),
  gst_amount DECIMAL(14, 2),
  final_amount DECIMAL(14, 2),
  payment_status invoice_status_enum NOT NULL DEFAULT 'draft',
  payment_due_date DATE,
  payment_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id),
  UNIQUE(account_id, invoice_number)
);

CREATE INDEX idx_invoices_account_id ON invoices(account_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  site_assignment_id UUID REFERENCES site_assignments(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  daily_rate DECIMAL(12, 2) NOT NULL,
  days_deployed INTEGER NOT NULL,
  line_total DECIMAL(14, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_employee_id ON invoice_line_items(employee_id);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_account_id ON audit_logs(account_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Function: Get current account ID from user
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.get_account_id() RETURNS UUID AS $$
  SELECT account_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.get_user_role() RETURNS TEXT AS $$
  SELECT client_role::text FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.is_hp_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM users u
    JOIN accounts a ON u.account_id = a.id
    WHERE u.id = auth.uid()
      AND a.id = '00000000-0000-0000-0000-000000000001'::uuid
      AND u.client_role = 'admin'
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- ACCOUNTS TABLE – RLS
-- ============================================================================

CREATE POLICY "accounts_select_own" ON accounts
  FOR SELECT
  USING (id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "accounts_insert_hp_admin" ON accounts
  FOR INSERT
  WITH CHECK (auth.is_hp_admin());

CREATE POLICY "accounts_update_own_admin" ON accounts
  FOR UPDATE
  USING (
    id = auth.get_account_id() AND auth.get_user_role() = 'admin'
    OR auth.is_hp_admin()
  );

-- ============================================================================
-- USERS TABLE – RLS
-- ============================================================================

CREATE POLICY "users_select_own_account" ON users
  FOR SELECT
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "users_insert_own_account_admin" ON users
  FOR INSERT
  WITH CHECK (
    account_id = auth.get_account_id() AND auth.get_user_role() = 'admin'
    OR auth.is_hp_admin()
  );

CREATE POLICY "users_update_own_account_admin" ON users
  FOR UPDATE
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

-- ============================================================================
-- EMPLOYEES TABLE – RLS
-- ============================================================================

-- Internal employees: visible to own account + HRMS/Hybrid
CREATE POLICY "employees_select_internal_own_account" ON employees
  FOR SELECT
  USING (
    account_id = auth.get_account_id()
    AND (
      employee_type = 'internal'
      OR EXISTS (
        SELECT 1 FROM accounts
        WHERE accounts.id = auth.get_account_id()
          AND accounts.account_type IN ('hrms_saas', 'hybrid')
      )
    )
    OR auth.is_hp_admin()
  );

-- Deployed employees: visible only if account is client (via site_assignments)
CREATE POLICY "employees_select_deployed_visible" ON employees
  FOR SELECT
  USING (
    (
      employee_type = 'hp_deployed'
      AND EXISTS (
        SELECT 1 FROM site_assignments
        WHERE site_assignments.account_id = auth.get_account_id()
          AND site_assignments.employee_id = employees.id
          AND site_assignments.client_visible = TRUE
      )
    )
    OR auth.is_hp_admin()
  );

CREATE POLICY "employees_insert_own_account" ON employees
  FOR INSERT
  WITH CHECK (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "employees_update_own_account" ON employees
  FOR UPDATE
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

-- ============================================================================
-- SALARY_STRUCTURES TABLE – RLS (Confidential)
-- ============================================================================

CREATE POLICY "salary_structures_select_admin_hr" ON salary_structures
  FOR SELECT
  USING (
    account_id = auth.get_account_id()
    AND auth.get_user_role() IN ('admin', 'hr')
    OR auth.is_hp_admin()
  );

CREATE POLICY "salary_structures_insert_admin" ON salary_structures
  FOR INSERT
  WITH CHECK (
    account_id = auth.get_account_id() AND auth.get_user_role() = 'admin'
    OR auth.is_hp_admin()
  );

CREATE POLICY "salary_structures_update_admin" ON salary_structures
  FOR UPDATE
  USING (
    account_id = auth.get_account_id() AND auth.get_user_role() = 'admin'
    OR auth.is_hp_admin()
  );

-- ============================================================================
-- SITE_ASSIGNMENTS TABLE – RLS
-- ============================================================================

CREATE POLICY "site_assignments_select_own" ON site_assignments
  FOR SELECT
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "site_assignments_insert_admin" ON site_assignments
  FOR INSERT
  WITH CHECK (
    account_id = auth.get_account_id() AND auth.get_user_role() = 'admin'
    OR auth.is_hp_admin()
  );

CREATE POLICY "site_assignments_update_admin" ON site_assignments
  FOR UPDATE
  USING (
    account_id = auth.get_account_id()
    AND (auth.get_user_role() = 'admin' OR auth.is_hp_admin())
  );

-- ============================================================================
-- ATTENDANCE TABLE – RLS
-- ============================================================================

CREATE POLICY "attendance_select_own_account" ON attendance
  FOR SELECT
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "attendance_insert_manager_hr" ON attendance
  FOR INSERT
  WITH CHECK (
    account_id = auth.get_account_id()
    AND auth.get_user_role() IN ('admin', 'hr', 'manager')
    OR auth.is_hp_admin()
  );

CREATE POLICY "attendance_update_manager_hr" ON attendance
  FOR UPDATE
  USING (
    account_id = auth.get_account_id()
    AND auth.get_user_role() IN ('admin', 'hr', 'manager')
    OR auth.is_hp_admin()
  );

-- ============================================================================
-- LEAVE_REQUESTS TABLE – RLS
-- ============================================================================

CREATE POLICY "leave_requests_select_own" ON leave_requests
  FOR SELECT
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "leave_requests_insert_employee" ON leave_requests
  FOR INSERT
  WITH CHECK (account_id = auth.get_account_id());

CREATE POLICY "leave_requests_update_own" ON leave_requests
  FOR UPDATE
  USING (
    account_id = auth.get_account_id()
    AND (
      auth.get_user_role() IN ('admin', 'hr', 'manager')
      OR auth.is_hp_admin()
    )
  );

-- ============================================================================
-- PAYROLL_RECORDS TABLE – RLS (Confidential)
-- ============================================================================

CREATE POLICY "payroll_records_select_admin_hr" ON payroll_records
  FOR SELECT
  USING (
    account_id = auth.get_account_id()
    AND auth.get_user_role() IN ('admin', 'hr')
    OR auth.is_hp_admin()
  );

CREATE POLICY "payroll_records_insert_admin" ON payroll_records
  FOR INSERT
  WITH CHECK (
    account_id = auth.get_account_id() AND auth.get_user_role() = 'admin'
    OR auth.is_hp_admin()
  );

CREATE POLICY "payroll_records_update_admin" ON payroll_records
  FOR UPDATE
  USING (
    account_id = auth.get_account_id() AND auth.get_user_role() = 'admin'
    OR auth.is_hp_admin()
  );

-- ============================================================================
-- INVOICES TABLE – RLS
-- ============================================================================

CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "invoices_insert_hp_admin" ON invoices
  FOR INSERT
  WITH CHECK (auth.is_hp_admin());

CREATE POLICY "invoices_update_hp_admin" ON invoices
  FOR UPDATE
  USING (auth.is_hp_admin());

-- ============================================================================
-- INVOICE_LINE_ITEMS TABLE – RLS
-- ============================================================================

CREATE POLICY "invoice_line_items_select_via_invoice" ON invoice_line_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id
        AND (invoices.account_id = auth.get_account_id() OR auth.is_hp_admin())
    )
  );

CREATE POLICY "invoice_line_items_insert_hp_admin" ON invoice_line_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_line_items.invoice_id AND auth.is_hp_admin()
    )
  );

-- ============================================================================
-- AUDIT_LOGS TABLE – RLS
-- ============================================================================

CREATE POLICY "audit_logs_select_own_account" ON audit_logs
  FOR SELECT
  USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY "audit_logs_insert_self" ON audit_logs
  FOR INSERT
  WITH CHECK (
    account_id = auth.get_account_id() OR auth.is_hp_admin()
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_update_updated_at BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_update_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER employees_update_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER salary_structures_update_updated_at BEFORE UPDATE ON salary_structures
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER site_assignments_update_updated_at BEFORE UPDATE ON site_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER attendance_update_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leave_requests_update_updated_at BEFORE UPDATE ON leave_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payroll_records_update_updated_at BEFORE UPDATE ON payroll_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invoices_update_updated_at BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit logging trigger
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    account_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.get_account_id(),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_salary_structures AFTER INSERT OR UPDATE OR DELETE ON salary_structures
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_payroll_records AFTER INSERT OR UPDATE OR DELETE ON payroll_records
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================================================
-- SEED DATA (Optional: HP Enterprise internal account)
-- ============================================================================

-- HP Enterprise internal account (admin)
INSERT INTO accounts (
  id,
  organization_name,
  account_type,
  status,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'HP Enterprise',
  'hybrid',
  'active',
  NOW()
) ON CONFLICT DO NOTHING;

-- HP Enterprise admin user
INSERT INTO users (
  id,
  account_id,
  email,
  password_hash,
  full_name,
  client_role,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@hpenterprise.com',
  'REDACTED_HASH', -- Replace with actual hash in production
  'HP Admin',
  'admin',
  'active',
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Schema created with full RLS isolation:
-- • Accounts can only see their own data
-- • Salary structures are confidential (admin/hr only)
-- • Deployed employees visible only to client accounts via site_assignments
-- • HP Enterprise admin (00000000-0000-0000-0000-000000000001) sees all data
-- • Audit logging on sensitive operations
-- • All timestamps auto-updated
-- ============================================================================
