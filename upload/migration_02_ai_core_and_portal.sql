-- ============================================================================
-- HPHRMS Enterprise AI — Migration 02
-- Phase 1 (AI Core) + Phase 2 (Client Portal)
-- Target: aihrms-prod (Supabase, Mumbai) | Domain: hphrms.com
-- Depends on: migration_dual_mode_schema.sql
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE ai_agent_enum AS ENUM (
  'hr_assistant',       -- General chat over company data
  'attendance',         -- Attendance insights & anomalies
  'payroll',            -- Payroll queries & explanations
  'recruitment',        -- JD drafting, candidate screening
  'leave',              -- Leave balance, policy, approvals
  'document',           -- Offer letters, contracts, certificates
  'report',             -- Natural language -> report
  'executive'           -- Phase 4: business insights
);

CREATE TYPE ai_message_role_enum AS ENUM ('user', 'assistant', 'tool', 'system');

CREATE TYPE insight_severity_enum AS ENUM ('info', 'low', 'medium', 'high', 'critical');

CREATE TYPE insight_type_enum AS ENUM (
  'attendance_anomaly',
  'absenteeism_spike',
  'overtime_breach',
  'contract_expiring',
  'document_expiring',
  'staffing_shortage',
  'payroll_variance',
  'compliance_due',
  'invoice_overdue',
  'leave_imbalance'
);

CREATE TYPE notification_channel_enum AS ENUM ('in_app', 'email', 'whatsapp', 'sms');

CREATE TYPE notification_status_enum AS ENUM ('queued', 'sent', 'read', 'dismissed', 'failed');

CREATE TYPE timesheet_status_enum AS ENUM (
  'draft',
  'submitted',
  'client_approved',
  'client_rejected',
  'invoiced'
);

CREATE TYPE document_category_enum AS ENUM (
  'aadhaar', 'pan', 'bank_proof', 'police_verification', 'medical_fitness',
  'safety_training', 'skill_certificate', 'contract', 'offer_letter',
  'insurance', 'esi_card', 'uan_card', 'other'
);

-- ============================================================================
-- PHASE 1 — AI CORE
-- ============================================================================

-- AI conversation threads (one per user per agent context)
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent ai_agent_enum NOT NULL DEFAULT 'hr_assistant',
  title TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conv_account ON ai_conversations(account_id);
CREATE INDEX idx_ai_conv_user ON ai_conversations(user_id, updated_at DESC);

-- AI messages (full transcript incl. tool calls for audit)
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role ai_message_role_enum NOT NULL,
  content TEXT,
  tool_name TEXT,
  tool_input JSONB,
  tool_output JSONB,
  -- Governance
  sql_executed TEXT,               -- exact SQL run on behalf of user (audit)
  rows_returned INTEGER,
  redacted_fields TEXT[],          -- which columns were masked before model saw them
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_msg_conv ON ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_msg_account ON ai_messages(account_id, created_at DESC);

-- AI-generated insights (surfaced in dashboards + notification center)
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  insight_type insight_type_enum NOT NULL,
  severity insight_severity_enum NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommended_action TEXT,
  -- What it refers to
  entity_table TEXT,
  entity_id UUID,
  site_assignment_id UUID REFERENCES site_assignments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  -- Evidence the model used (numbers, not prose — keeps it auditable)
  evidence JSONB,
  confidence NUMERIC(4,3),
  -- Lifecycle
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  generated_by TEXT DEFAULT 'ai',     -- 'ai' | 'rule_engine'
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_account ON ai_insights(account_id, severity, created_at DESC);
CREATE INDEX idx_ai_insights_open ON ai_insights(account_id) WHERE resolved_at IS NULL;

-- AI usage metering (drives Phase 5 usage-based billing)
CREATE TABLE ai_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  agent ai_agent_enum NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  request_count INTEGER DEFAULT 1,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_inr NUMERIC(12,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_account_date ON ai_usage_ledger(account_id, usage_date);

-- Notification center (Phase 1 item 8)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = account-wide
  insight_id UUID REFERENCES ai_insights(id) ON DELETE CASCADE,
  channel notification_channel_enum NOT NULL DEFAULT 'in_app',
  status notification_status_enum NOT NULL DEFAULT 'queued',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  severity insight_severity_enum DEFAULT 'info',
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, status, created_at DESC);
CREATE INDEX idx_notifications_due ON notifications(scheduled_for) WHERE status = 'queued';

-- Generated documents (AI Document Generator output)
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,        -- 'offer_letter','experience_cert','contract',...
  title TEXT NOT NULL,
  storage_path TEXT,                  -- Supabase Storage key
  file_format TEXT DEFAULT 'pdf',
  template_id UUID,
  generated_by_user_id UUID REFERENCES users(id),
  ai_generated BOOLEAN DEFAULT TRUE,
  client_visible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gen_docs_account ON generated_documents(account_id, created_at DESC);

-- ============================================================================
-- PHASE 2 — CLIENT PORTAL
-- ============================================================================

-- White-label branding per account (Phase 2 + Phase 5 white-label option)
CREATE TABLE client_branding (
  account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  display_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#16213E',
  accent_color TEXT DEFAULT '#E8A33D',
  sidebar_style TEXT DEFAULT 'dark',      -- 'dark' | 'light'
  login_background_url TEXT,
  support_email TEXT,
  support_phone TEXT,
  custom_domain TEXT,                     -- e.g. hr.clientdomain.com
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  hide_hphrms_branding BOOLEAN DEFAULT FALSE,
  invoice_footer_note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client sites (a client can have many sites; deployments attach to sites)
CREATE TABLE client_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  site_code TEXT NOT NULL,
  site_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  geo_lat NUMERIC(10,7),
  geo_lng NUMERIC(10,7),
  geofence_radius_m INTEGER DEFAULT 200,
  site_incharge_name TEXT,
  site_incharge_phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, site_code)
);

CREATE INDEX idx_client_sites_account ON client_sites(account_id) WHERE active;

-- Link existing site_assignments to structured sites
ALTER TABLE site_assignments
  ADD COLUMN IF NOT EXISTS client_site_id UUID REFERENCES client_sites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shift_code TEXT,
  ADD COLUMN IF NOT EXISTS contract_end_alert_days INTEGER DEFAULT 30;

CREATE INDEX IF NOT EXISTS idx_site_assign_site ON site_assignments(client_site_id);

-- Timesheets — the bridge from attendance to invoice
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  client_site_id UUID REFERENCES client_sites(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status timesheet_status_enum NOT NULL DEFAULT 'draft',
  total_mandays NUMERIC(10,2) DEFAULT 0,
  total_overtime_hours NUMERIC(10,2) DEFAULT 0,
  gross_billable NUMERIC(14,2) DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  client_approved_at TIMESTAMPTZ,
  client_approved_by UUID REFERENCES users(id),
  client_remarks TEXT,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, client_site_id, period_start, period_end)
);

CREATE INDEX idx_timesheets_account ON timesheets(account_id, status);

CREATE TABLE timesheet_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  site_assignment_id UUID REFERENCES site_assignments(id) ON DELETE SET NULL,
  days_present NUMERIC(6,2) DEFAULT 0,
  days_absent NUMERIC(6,2) DEFAULT 0,
  overtime_hours NUMERIC(8,2) DEFAULT 0,
  billable_rate NUMERIC(12,2) NOT NULL,
  overtime_rate NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(14,2) GENERATED ALWAYS AS
    (days_present * billable_rate + overtime_hours * overtime_rate) STORED,
  client_disputed BOOLEAN DEFAULT FALSE,
  dispute_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ts_lines_timesheet ON timesheet_lines(timesheet_id);

-- Employee documents with expiry tracking (Phase 3 dependency, built now)
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  category document_category_enum NOT NULL,
  document_number_encrypted TEXT,
  storage_path TEXT,
  issue_date DATE,
  expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  client_visible BOOLEAN DEFAULT FALSE,   -- e.g. safety training cert shown to client
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emp_docs_expiry ON employee_documents(expiry_date)
  WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_emp_docs_employee ON employee_documents(employee_id);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE ai_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_ledger     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_branding     ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_lines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents  ENABLE ROW LEVEL SECURITY;

-- Conversations: strictly the owning user, plus HP admin for audit
CREATE POLICY ai_conv_own ON ai_conversations
  FOR ALL USING (
    (account_id = auth.get_account_id() AND user_id = auth.uid())
    OR auth.is_hp_admin()
  )
  WITH CHECK (account_id = auth.get_account_id() AND user_id = auth.uid());

CREATE POLICY ai_msg_own ON ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_conversations c
      WHERE c.id = ai_messages.conversation_id
        AND ((c.account_id = auth.get_account_id() AND c.user_id = auth.uid())
             OR auth.is_hp_admin())
    )
  )
  WITH CHECK (account_id = auth.get_account_id());

-- Insights: account-scoped; payroll-flavoured insights limited to admin/hr
CREATE POLICY ai_insights_read ON ai_insights
  FOR SELECT USING (
    (
      account_id = auth.get_account_id()
      AND (
        insight_type <> 'payroll_variance'
        OR auth.get_user_role() IN ('admin','hr')
      )
    )
    OR auth.is_hp_admin()
  );

CREATE POLICY ai_insights_write ON ai_insights
  FOR UPDATE USING (
    account_id = auth.get_account_id()
    AND auth.get_user_role() IN ('admin','hr','manager')
  );

CREATE POLICY ai_usage_read ON ai_usage_ledger
  FOR SELECT USING (
    (account_id = auth.get_account_id() AND auth.get_user_role() = 'admin')
    OR auth.is_hp_admin()
  );

CREATE POLICY notifications_own ON notifications
  FOR ALL USING (
    (account_id = auth.get_account_id() AND (user_id = auth.uid() OR user_id IS NULL))
    OR auth.is_hp_admin()
  )
  WITH CHECK (account_id = auth.get_account_id());

CREATE POLICY gen_docs_read ON generated_documents
  FOR SELECT USING (
    (
      account_id = auth.get_account_id()
      AND (auth.get_user_role() IN ('admin','hr') OR client_visible = TRUE)
    )
    OR auth.is_hp_admin()
  );

-- Branding: everyone in the account may read it (needed to paint the UI),
-- only admin may change it
CREATE POLICY branding_read ON client_branding
  FOR SELECT USING (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY branding_write ON client_branding
  FOR ALL USING (
    (account_id = auth.get_account_id() AND auth.get_user_role() = 'admin')
    OR auth.is_hp_admin()
  )
  WITH CHECK (account_id = auth.get_account_id() OR auth.is_hp_admin());

CREATE POLICY client_sites_scope ON client_sites
  FOR ALL USING (account_id = auth.get_account_id() OR auth.is_hp_admin())
  WITH CHECK (account_id = auth.get_account_id() OR auth.is_hp_admin());

-- Timesheets: client sees them (that's the point) but only submitted+ states
CREATE POLICY timesheets_read ON timesheets
  FOR SELECT USING (
    (account_id = auth.get_account_id() AND status <> 'draft')
    OR auth.is_hp_admin()
  );

CREATE POLICY timesheets_client_approve ON timesheets
  FOR UPDATE USING (
    (
      account_id = auth.get_account_id()
      AND auth.get_user_role() IN ('admin','manager')
      AND status = 'submitted'
    )
    OR auth.is_hp_admin()
  );

CREATE POLICY ts_lines_read ON timesheet_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timesheets t
      WHERE t.id = timesheet_lines.timesheet_id
        AND ((t.account_id = auth.get_account_id() AND t.status <> 'draft')
             OR auth.is_hp_admin())
    )
  );

-- Employee documents: HP + client admin/hr; client_visible ones to managers
CREATE POLICY emp_docs_read ON employee_documents
  FOR SELECT USING (
    (
      account_id = auth.get_account_id()
      AND (auth.get_user_role() IN ('admin','hr') OR client_visible = TRUE)
    )
    OR auth.is_hp_admin()
  );

CREATE POLICY emp_docs_write ON employee_documents
  FOR ALL USING (
    (account_id = auth.get_account_id() AND auth.get_user_role() IN ('admin','hr'))
    OR auth.is_hp_admin()
  )
  WITH CHECK (account_id = auth.get_account_id() OR auth.is_hp_admin());

-- ============================================================================
-- READ-ONLY VIEWS THE AI IS ALLOWED TO QUERY
-- The AI never touches base tables. It queries these views only, which
-- pre-strip Aadhaar / PAN / bank / salary from anything a client can reach.
-- ============================================================================

CREATE OR REPLACE VIEW ai_v_employees
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.account_id,
  e.employee_type,
  e.emp_code,
  e.first_name || ' ' || e.last_name AS employee_name,
  e.department,
  e.designation,
  e.date_of_joining,
  e.status,
  e.city,
  e.state
  -- deliberately excluded: aadhaar_encrypted, pan_encrypted, bank_account_encrypted
FROM employees e;

CREATE OR REPLACE VIEW ai_v_attendance
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.account_id,
  a.employee_id,
  e.emp_code,
  e.first_name || ' ' || e.last_name AS employee_name,
  e.department,
  e.employee_type,
  sa.client_site_id,
  cs.site_name,
  a.attendance_date,
  a.status,
  a.hours_worked
FROM attendance a
JOIN employees e ON e.id = a.employee_id
LEFT JOIN site_assignments sa
  ON sa.employee_id = a.employee_id AND sa.status = 'active'
LEFT JOIN client_sites cs ON cs.id = sa.client_site_id;

CREATE OR REPLACE VIEW ai_v_leave
WITH (security_invoker = true) AS
SELECT
  l.id,
  l.account_id,
  l.employee_id,
  e.emp_code,
  e.first_name || ' ' || e.last_name AS employee_name,
  e.department,
  l.leave_type,
  l.start_date,
  l.end_date,
  l.days_requested,
  l.status
FROM leave_requests l
JOIN employees e ON e.id = l.employee_id;

-- Payroll view: aggregate-safe. Individual net pay only reachable by admin/hr,
-- enforced by the payroll_records RLS policy that security_invoker inherits.
CREATE OR REPLACE VIEW ai_v_payroll
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.account_id,
  p.employee_id,
  e.emp_code,
  e.department,
  p.payroll_month,
  p.gross_salary,
  p.net_salary,
  p.pf_deduction,
  p.esi_deduction,
  p.income_tax_deduction,
  p.status
FROM payroll_records p
JOIN employees e ON e.id = p.employee_id
WHERE e.employee_type = 'internal';

CREATE OR REPLACE VIEW ai_v_deployment
WITH (security_invoker = true) AS
SELECT
  sa.id,
  sa.account_id,
  sa.employee_id,
  e.emp_code,
  e.first_name || ' ' || e.last_name AS employee_name,
  e.designation,
  cs.site_name,
  cs.city,
  sa.deployment_date,
  sa.expected_end_date,
  sa.shift_code,
  sa.status,
  sa.daily_rate          -- visible to HP admin only via RLS on site_assignments
FROM site_assignments sa
JOIN employees e ON e.id = sa.employee_id
LEFT JOIN client_sites cs ON cs.id = sa.client_site_id;

CREATE OR REPLACE VIEW ai_v_invoices
WITH (security_invoker = true) AS
SELECT
  i.id,
  i.account_id,
  i.invoice_number,
  i.billing_period_start,
  i.billing_period_end,
  i.invoice_date,
  i.final_amount,
  i.payment_status,
  i.payment_due_date
FROM invoices i;

CREATE OR REPLACE VIEW ai_v_document_expiry
WITH (security_invoker = true) AS
SELECT
  d.id,
  d.account_id,
  d.employee_id,
  e.emp_code,
  e.first_name || ' ' || e.last_name AS employee_name,
  d.category,
  d.expiry_date,
  (d.expiry_date - CURRENT_DATE) AS days_to_expiry,
  d.verified
FROM employee_documents d
JOIN employees e ON e.id = d.employee_id
WHERE d.expiry_date IS NOT NULL;

-- ============================================================================
-- RULE ENGINE — deterministic insights. The AI writes the prose; SQL finds
-- the facts. Never let the model discover the numbers on its own.
-- ============================================================================

-- Contract expiry
CREATE OR REPLACE FUNCTION detect_contract_expiry()
RETURNS INTEGER AS $$
DECLARE inserted INTEGER := 0;
BEGIN
  INSERT INTO ai_insights (
    account_id, insight_type, severity, title, summary,
    recommended_action, site_assignment_id, employee_id, evidence,
    confidence, generated_by, valid_until
  )
  SELECT
    sa.account_id,
    'contract_expiring',
    CASE
      WHEN sa.expected_end_date - CURRENT_DATE <= 7  THEN 'critical'
      WHEN sa.expected_end_date - CURRENT_DATE <= 15 THEN 'high'
      ELSE 'medium'
    END,
    'Deployment ending: ' || e.first_name || ' ' || e.last_name,
    e.first_name || ' ' || e.last_name || ' (' || e.emp_code || ') ends deployment at '
      || COALESCE(cs.site_name, 'site') || ' on '
      || to_char(sa.expected_end_date, 'DD Mon YYYY') || '.',
    'Confirm renewal with the client or plan redeployment.',
    sa.id,
    e.id,
    jsonb_build_object(
      'expected_end_date', sa.expected_end_date,
      'days_remaining', sa.expected_end_date - CURRENT_DATE,
      'site', cs.site_name
    ),
    1.000,
    'rule_engine',
    sa.expected_end_date
  FROM site_assignments sa
  JOIN employees e ON e.id = sa.employee_id
  LEFT JOIN client_sites cs ON cs.id = sa.client_site_id
  WHERE sa.status = 'active'
    AND sa.expected_end_date IS NOT NULL
    AND sa.expected_end_date - CURRENT_DATE
        BETWEEN 0 AND COALESCE(sa.contract_end_alert_days, 30)
    AND NOT EXISTS (
      SELECT 1 FROM ai_insights ins
      WHERE ins.site_assignment_id = sa.id
        AND ins.insight_type = 'contract_expiring'
        AND ins.resolved_at IS NULL
    );

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Document expiry
CREATE OR REPLACE FUNCTION detect_document_expiry(alert_days INTEGER DEFAULT 45)
RETURNS INTEGER AS $$
DECLARE inserted INTEGER := 0;
BEGIN
  INSERT INTO ai_insights (
    account_id, insight_type, severity, title, summary,
    recommended_action, employee_id, evidence, confidence,
    generated_by, valid_until
  )
  SELECT
    d.account_id,
    'document_expiring',
    CASE
      WHEN d.expiry_date < CURRENT_DATE                   THEN 'critical'
      WHEN d.expiry_date - CURRENT_DATE <= 15             THEN 'high'
      ELSE 'medium'
    END,
    initcap(replace(d.category::text,'_',' ')) || ' expiring — ' || e.emp_code,
    e.first_name || ' ' || e.last_name || '''s '
      || replace(d.category::text,'_',' ') || ' '
      || CASE WHEN d.expiry_date < CURRENT_DATE THEN 'expired on ' ELSE 'expires on ' END
      || to_char(d.expiry_date, 'DD Mon YYYY') || '.',
    'Collect the renewed document before the next deployment cycle.',
    e.id,
    jsonb_build_object(
      'category', d.category,
      'expiry_date', d.expiry_date,
      'days_to_expiry', d.expiry_date - CURRENT_DATE
    ),
    1.000,
    'rule_engine',
    d.expiry_date
  FROM employee_documents d
  JOIN employees e ON e.id = d.employee_id
  WHERE e.status = 'active'
    AND d.expiry_date IS NOT NULL
    AND d.expiry_date - CURRENT_DATE <= alert_days
    AND NOT EXISTS (
      SELECT 1 FROM ai_insights ins
      WHERE ins.employee_id = d.employee_id
        AND ins.insight_type = 'document_expiring'
        AND ins.evidence->>'category' = d.category::text
        AND ins.resolved_at IS NULL
    );

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attendance anomaly: employee's absence rate this week vs their own 8-week norm
CREATE OR REPLACE FUNCTION detect_attendance_anomalies()
RETURNS INTEGER AS $$
DECLARE inserted INTEGER := 0;
BEGIN
  INSERT INTO ai_insights (
    account_id, insight_type, severity, title, summary,
    recommended_action, employee_id, evidence, confidence, generated_by
  )
  WITH recent AS (
    SELECT account_id, employee_id,
           COUNT(*) FILTER (WHERE status = 'absent')::numeric
             / NULLIF(COUNT(*),0) AS absent_rate,
           COUNT(*) AS days
    FROM attendance
    WHERE attendance_date >= CURRENT_DATE - 7
    GROUP BY account_id, employee_id
  ),
  baseline AS (
    SELECT account_id, employee_id,
           COUNT(*) FILTER (WHERE status = 'absent')::numeric
             / NULLIF(COUNT(*),0) AS absent_rate,
           COUNT(*) AS days
    FROM attendance
    WHERE attendance_date BETWEEN CURRENT_DATE - 63 AND CURRENT_DATE - 8
    GROUP BY account_id, employee_id
  )
  SELECT
    r.account_id,
    'attendance_anomaly',
    CASE WHEN r.absent_rate >= 0.6 THEN 'high' ELSE 'medium' END,
    'Attendance drop — ' || e.emp_code,
    e.first_name || ' ' || e.last_name || ' was absent '
      || round(r.absent_rate * 100) || '% of days this week, against a usual '
      || round(COALESCE(b.absent_rate,0) * 100) || '%.',
    'Check with the site in-charge before it affects billable mandays.',
    e.id,
    jsonb_build_object(
      'recent_absent_rate', round(r.absent_rate, 3),
      'baseline_absent_rate', round(COALESCE(b.absent_rate,0), 3),
      'recent_days_observed', r.days,
      'baseline_days_observed', COALESCE(b.days,0)
    ),
    0.800,
    'rule_engine'
  FROM recent r
  JOIN baseline b ON b.employee_id = r.employee_id
  JOIN employees e ON e.id = r.employee_id
  WHERE r.days >= 4
    AND b.days >= 20
    AND r.absent_rate >= 0.3
    AND r.absent_rate >= b.absent_rate + 0.25
    AND NOT EXISTS (
      SELECT 1 FROM ai_insights ins
      WHERE ins.employee_id = e.id
        AND ins.insight_type = 'attendance_anomaly'
        AND ins.created_at > NOW() - INTERVAL '7 days'
    );

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Staffing shortage: active site headcount vs contracted headcount
CREATE OR REPLACE FUNCTION detect_staffing_shortage()
RETURNS INTEGER AS $$
DECLARE inserted INTEGER := 0;
BEGIN
  INSERT INTO ai_insights (
    account_id, insight_type, severity, title, summary,
    recommended_action, evidence, confidence, generated_by
  )
  WITH today_at_site AS (
    SELECT
      sa.account_id,
      sa.client_site_id,
      COUNT(*) FILTER (WHERE sa.status = 'active') AS deployed,
      COUNT(*) FILTER (
        WHERE a.status IN ('present','wfh')
      ) AS present_today
    FROM site_assignments sa
    LEFT JOIN attendance a
      ON a.employee_id = sa.employee_id
     AND a.attendance_date = CURRENT_DATE
    WHERE sa.status = 'active' AND sa.client_site_id IS NOT NULL
    GROUP BY sa.account_id, sa.client_site_id
  )
  SELECT
    t.account_id,
    'staffing_shortage',
    CASE
      WHEN t.present_today::numeric / NULLIF(t.deployed,0) < 0.6 THEN 'critical'
      ELSE 'high'
    END,
    'Understaffed today — ' || cs.site_name,
    cs.site_name || ' has ' || t.present_today || ' of ' || t.deployed
      || ' deployed workers present today.',
    'Arrange relief staff or inform the client before shift start tomorrow.',
    jsonb_build_object(
      'site', cs.site_name,
      'deployed', t.deployed,
      'present_today', t.present_today,
      'shortfall', t.deployed - t.present_today
    ),
    0.950,
    'rule_engine'
  FROM today_at_site t
  JOIN client_sites cs ON cs.id = t.client_site_id
  WHERE t.deployed >= 3
    AND t.present_today::numeric / NULLIF(t.deployed,0) < 0.8
    AND NOT EXISTS (
      SELECT 1 FROM ai_insights ins
      WHERE ins.insight_type = 'staffing_shortage'
        AND ins.evidence->>'site' = cs.site_name
        AND ins.created_at::date = CURRENT_DATE
    );

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Overdue invoices
CREATE OR REPLACE FUNCTION detect_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE inserted INTEGER := 0;
BEGIN
  INSERT INTO ai_insights (
    account_id, insight_type, severity, title, summary,
    recommended_action, entity_table, entity_id, evidence, confidence, generated_by
  )
  SELECT
    i.account_id,
    'invoice_overdue',
    CASE WHEN CURRENT_DATE - i.payment_due_date > 30 THEN 'critical' ELSE 'high' END,
    'Invoice overdue — ' || i.invoice_number,
    'Invoice ' || i.invoice_number || ' for ₹'
      || to_char(i.final_amount, 'FM99,99,99,990')
      || ' is ' || (CURRENT_DATE - i.payment_due_date) || ' days past due.',
    'Send a payment reminder to the client billing contact.',
    'invoices',
    i.id,
    jsonb_build_object(
      'invoice_number', i.invoice_number,
      'amount', i.final_amount,
      'days_overdue', CURRENT_DATE - i.payment_due_date
    ),
    1.000,
    'rule_engine'
  FROM invoices i
  WHERE i.payment_status IN ('sent','overdue')
    AND i.payment_due_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM ai_insights ins
      WHERE ins.entity_id = i.id
        AND ins.insight_type = 'invoice_overdue'
        AND ins.resolved_at IS NULL
    );

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Master runner — call nightly from a Vercel cron or pg_cron
CREATE OR REPLACE FUNCTION run_insight_engine()
RETURNS JSONB AS $$
DECLARE result JSONB;
BEGIN
  result := jsonb_build_object(
    'contract_expiring',  detect_contract_expiry(),
    'document_expiring',  detect_document_expiry(),
    'attendance_anomaly', detect_attendance_anomalies(),
    'staffing_shortage',  detect_staffing_shortage(),
    'invoice_overdue',    detect_overdue_invoices(),
    'ran_at',             NOW()
  );

  -- Fan out to the notification center for admins/HR of each account
  INSERT INTO notifications (account_id, user_id, insight_id, channel, title, body, action_url, severity)
  SELECT
    ins.account_id,
    u.id,
    ins.id,
    'in_app',
    ins.title,
    ins.summary,
    '/insights/' || ins.id,
    ins.severity
  FROM ai_insights ins
  JOIN users u
    ON u.account_id = ins.account_id
   AND u.client_role IN ('admin','hr')
   AND u.status = 'active'
  WHERE ins.created_at > NOW() - INTERVAL '10 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.insight_id = ins.id AND n.user_id = u.id
    );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TIMESHEET -> INVOICE (Phase 3 core money path, wired now)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_from_timesheet(p_timesheet_id UUID)
RETURNS UUID AS $$
DECLARE
  v_ts       timesheets%ROWTYPE;
  v_invoice  UUID;
  v_number   TEXT;
  v_subtotal NUMERIC(14,2);
  v_gst      NUMERIC(14,2);
BEGIN
  SELECT * INTO v_ts FROM timesheets WHERE id = p_timesheet_id;

  IF v_ts.id IS NULL THEN
    RAISE EXCEPTION 'Timesheet % not found', p_timesheet_id;
  END IF;

  IF v_ts.status <> 'client_approved' THEN
    RAISE EXCEPTION 'Timesheet % is % — only client_approved timesheets can be invoiced',
      p_timesheet_id, v_ts.status;
  END IF;

  IF v_ts.invoice_id IS NOT NULL THEN
    RAISE EXCEPTION 'Timesheet % already invoiced as %', p_timesheet_id, v_ts.invoice_id;
  END IF;

  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM timesheet_lines WHERE timesheet_id = p_timesheet_id AND NOT client_disputed;

  v_gst := round(v_subtotal * 0.18, 2);

  v_number := 'HPE/' || to_char(CURRENT_DATE, 'YYYY') || '/' ||
              lpad((
                SELECT COUNT(*) + 1 FROM invoices
                WHERE account_id = v_ts.account_id
                  AND date_trunc('year', invoice_date) = date_trunc('year', CURRENT_DATE)
              )::text, 4, '0');

  INSERT INTO invoices (
    account_id, invoice_number, billing_period_start, billing_period_end,
    invoice_date, total_amount, gst_amount, final_amount,
    payment_status, payment_due_date
  ) VALUES (
    v_ts.account_id, v_number, v_ts.period_start, v_ts.period_end,
    CURRENT_DATE, v_subtotal, v_gst, v_subtotal + v_gst,
    'draft', CURRENT_DATE + 30
  ) RETURNING id INTO v_invoice;

  INSERT INTO invoice_line_items (
    invoice_id, site_assignment_id, employee_id,
    daily_rate, days_deployed, line_total
  )
  SELECT
    v_invoice, tl.site_assignment_id, tl.employee_id,
    tl.billable_rate, ceil(tl.days_present)::int, tl.line_total
  FROM timesheet_lines tl
  WHERE tl.timesheet_id = p_timesheet_id AND NOT tl.client_disputed;

  UPDATE timesheets
     SET invoice_id = v_invoice, status = 'invoiced', updated_at = NOW()
   WHERE id = p_timesheet_id;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recompute timesheet header from its lines
CREATE OR REPLACE FUNCTION refresh_timesheet_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE timesheets t
     SET total_mandays        = COALESCE(agg.mandays, 0),
         total_overtime_hours = COALESCE(agg.ot, 0),
         gross_billable       = COALESCE(agg.total, 0),
         updated_at           = NOW()
    FROM (
      SELECT SUM(days_present) AS mandays,
             SUM(overtime_hours) AS ot,
             SUM(line_total) AS total
      FROM timesheet_lines
      WHERE timesheet_id = COALESCE(NEW.timesheet_id, OLD.timesheet_id)
        AND NOT client_disputed
    ) agg
   WHERE t.id = COALESCE(NEW.timesheet_id, OLD.timesheet_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_timesheet_totals
AFTER INSERT OR UPDATE OR DELETE ON timesheet_lines
FOR EACH ROW EXECUTE FUNCTION refresh_timesheet_totals();

-- Build draft timesheet lines straight from attendance
CREATE OR REPLACE FUNCTION build_timesheet_from_attendance(
  p_account_id UUID,
  p_site_id    UUID,
  p_start      DATE,
  p_end        DATE
) RETURNS UUID AS $$
DECLARE v_ts UUID;
BEGIN
  INSERT INTO timesheets (account_id, client_site_id, period_start, period_end, status)
  VALUES (p_account_id, p_site_id, p_start, p_end, 'draft')
  ON CONFLICT (account_id, client_site_id, period_start, period_end)
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_ts;

  DELETE FROM timesheet_lines WHERE timesheet_id = v_ts;

  INSERT INTO timesheet_lines (
    timesheet_id, employee_id, site_assignment_id,
    days_present, days_absent, overtime_hours, billable_rate, overtime_rate
  )
  SELECT
    v_ts,
    sa.employee_id,
    sa.id,
    COUNT(*) FILTER (WHERE a.status = 'present')
      + 0.5 * COUNT(*) FILTER (WHERE a.status = 'half_day'),
    COUNT(*) FILTER (WHERE a.status = 'absent'),
    COALESCE(SUM(GREATEST(a.hours_worked - 8, 0)), 0),
    sa.daily_rate,
    round(sa.daily_rate / 8.0, 2)
  FROM site_assignments sa
  LEFT JOIN attendance a
    ON a.employee_id = sa.employee_id
   AND a.attendance_date BETWEEN p_start AND p_end
  WHERE sa.account_id = p_account_id
    AND sa.client_site_id = p_site_id
    AND sa.status = 'active'
  GROUP BY sa.employee_id, sa.id, sa.daily_rate;

  RETURN v_ts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER ai_conv_updated_at BEFORE UPDATE ON ai_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER timesheets_updated_at BEFORE UPDATE ON timesheets
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER audit_timesheets AFTER INSERT OR UPDATE OR DELETE ON timesheets
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_employee_documents AFTER INSERT OR UPDATE OR DELETE ON employee_documents
FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================================================
-- DEFAULT BRANDING FOR EXISTING ACCOUNTS
-- ============================================================================

INSERT INTO client_branding (account_id, display_name, primary_color, accent_color)
SELECT id, organization_name, '#16213E', '#E8A33D'
FROM accounts
ON CONFLICT (account_id) DO NOTHING;

-- ============================================================================
-- END MIGRATION 02
-- ============================================================================
