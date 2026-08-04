// ============================================================================
// HPHRMS Enterprise AI — Client Portal (Phase 2)
// app/(portal)/ components
//
//   BrandingProvider   — pulls per-account colours/logo, paints CSS variables
//   PortalDashboard    — the client's home screen
//   AiChatPanel        — scoped assistant, only their company data
//   TimesheetApproval  — approve/dispute mandays before they become an invoice
//   NotificationBell   — Phase 1 notification center
// ============================================================================

'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';

// ============================================================================
// BRANDING
// ============================================================================

interface Branding {
  display_name: string;
  logo_url?: string;
  primary_color: string;
  accent_color: string;
  sidebar_style: 'dark' | 'light';
  support_email?: string;
  support_phone?: string;
  hide_hphrms_branding: boolean;
}

const DEFAULT_BRANDING: Branding = {
  display_name: 'HPHRMS',
  primary_color: '#16213E',
  accent_color: '#E8A33D',
  sidebar_style: 'dark',
  hide_hphrms_branding: false,
};

const BrandingContext = createContext<Branding>(DEFAULT_BRANDING);
export const useBranding = () => useContext(BrandingContext);

/** Derive a readable text colour so a client picking a pale brand colour
 *  doesn't end up with white-on-yellow buttons. */
function readableOn(hex: string): string {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? '#101828' : '#FFFFFF';
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch('/api/portal/branding')
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => b && setBranding({ ...DEFAULT_BRANDING, ...b }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', branding.primary_color);
    root.style.setProperty('--brand-accent', branding.accent_color);
    root.style.setProperty('--brand-on-primary', readableOn(branding.primary_color));
    root.style.setProperty('--brand-on-accent', readableOn(branding.accent_color));
  }, [branding]);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

// ============================================================================
// SHARED PRIMITIVES
// ============================================================================

const inr = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'neutral' | 'warn' | 'bad' | 'good';
}) {
  const toneClass = {
    neutral: 'text-slate-900',
    good: 'text-emerald-700',
    warn: 'text-amber-700',
    bad: 'text-red-700',
  }[tone];

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </Card>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

// ============================================================================
// PORTAL DASHBOARD
// ============================================================================

interface Summary {
  organization: string;
  account_type: 'hrms_saas' | 'manpower_supply' | 'hybrid';
  role: string;
  as_of: string;
  deployed_headcount?: number;
  present_today?: number;
  not_marked_today?: number;
  postings_ending_30d?: number;
  outstanding_invoice_count?: number;
  outstanding_amount_inr?: number;
  overdue_invoice_count?: number;
  timesheets_awaiting_approval?: number;
  internal_headcount?: number;
  pending_leave_requests?: number;
  payroll_this_month_inr?: number;
  payroll_status?: string;
  open_alerts: number;
  critical_alerts: number;
}

export function PortalDashboard() {
  const branding = useBranding();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/portal/summary')
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? 'Could not load your dashboard.');
        return r.json();
      })
      .then(setSummary)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <p className="font-medium text-red-900">{error}</p>
        <button
          onClick={() => location.reload()}
          className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-900 hover:bg-red-100"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (!summary) return <Skeleton rows={4} />;

  const isManpower = summary.account_type !== 'hrms_saas';
  const isHrms = summary.account_type !== 'manpower_supply';
  const attendancePct =
    summary.deployed_headcount
      ? Math.round(((summary.present_today ?? 0) / summary.deployed_headcount) * 100)
      : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {branding.logo_url && (
            <img src={branding.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain" />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{summary.organization}</h1>
            <p className="text-sm text-slate-500">
              As of {new Date(summary.as_of).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        {summary.critical_alerts > 0 && (
          <a
            href="/insights"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {summary.critical_alerts} item{summary.critical_alerts > 1 ? 's' : ''} need attention
          </a>
        )}
      </header>

      {isManpower && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Deployed workforce
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Workers deployed" value={summary.deployed_headcount ?? 0} />
            <Stat
              label="Present today"
              value={summary.present_today ?? 0}
              sub={attendancePct !== null ? `${attendancePct}% of deployed` : undefined}
              tone={attendancePct !== null && attendancePct < 80 ? 'warn' : 'good'}
            />
            <Stat
              label="Postings ending in 30 days"
              value={summary.postings_ending_30d ?? 0}
              tone={(summary.postings_ending_30d ?? 0) > 0 ? 'warn' : 'neutral'}
            />
            <Stat
              label="Timesheets to approve"
              value={summary.timesheets_awaiting_approval ?? 0}
              sub={summary.timesheets_awaiting_approval ? 'Approve to release invoicing' : 'Nothing pending'}
              tone={(summary.timesheets_awaiting_approval ?? 0) > 0 ? 'warn' : 'good'}
            />
          </div>
        </section>
      )}

      {isManpower && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Billing</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              label="Outstanding"
              value={inr(summary.outstanding_amount_inr ?? 0)}
              sub={`${summary.outstanding_invoice_count ?? 0} open invoice${(summary.outstanding_invoice_count ?? 0) === 1 ? '' : 's'}`}
            />
            <Stat
              label="Overdue invoices"
              value={summary.overdue_invoice_count ?? 0}
              tone={(summary.overdue_invoice_count ?? 0) > 0 ? 'bad' : 'good'}
            />
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Invoices</p>
              <a
                href="/invoices"
                className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-medium"
                style={{ background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' }}
              >
                Download invoices
              </a>
            </Card>
          </div>
        </section>
      )}

      {isHrms && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your own employees
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Active employees" value={summary.internal_headcount ?? 0} />
            <Stat
              label="Leave requests pending"
              value={summary.pending_leave_requests ?? 0}
              tone={(summary.pending_leave_requests ?? 0) > 0 ? 'warn' : 'good'}
            />
            {summary.payroll_this_month_inr !== undefined && (
              <Stat
                label="Payroll this month"
                value={inr(summary.payroll_this_month_inr)}
                sub={summary.payroll_status?.replace('_', ' ')}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// AI CHAT PANEL
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tools?: Array<{ name: string; rows: number | null }>;
  pending?: boolean;
}

const AGENT_LABELS: Record<string, string> = {
  hr_assistant: 'General',
  attendance: 'Attendance',
  payroll: 'Payroll',
  leave: 'Leave',
  recruitment: 'Recruitment',
  document: 'Documents',
  report: 'Reports',
};

const STARTERS: Record<string, string[]> = {
  manpower_supply: [
    'How many workers were present at each site last week?',
    'Which postings end in the next 30 days?',
    'What do we owe on open invoices?',
  ],
  hrms_saas: [
    'Who has leave pending approval?',
    'Show attendance by department for this month',
    'What was our total payroll cost last month?',
  ],
  hybrid: [
    'Compare attendance for our staff versus deployed workers this month',
    'Which deployed workers have documents expiring soon?',
    'What needs my attention today?',
  ],
};

export function AiChatPanel({
  accountType = 'hybrid',
  agent = 'hr_assistant',
}: {
  accountType?: 'hrms_saas' | 'manpower_supply' | 'hybrid';
  agent?: string;
}) {
  const branding = useBranding();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState(agent);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      setMessages((m) => [...m, { role: 'user', content: question }, { role: 'assistant', content: '', pending: true }]);
      setInput('');
      setBusy(true);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question, agent: activeAgent, conversation_id: conversationId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setMessages((m) => [
            ...m.slice(0, -1),
            { role: 'assistant', content: data.error ?? 'That did not go through. Try again.' },
          ]);
          return;
        }

        setConversationId(data.conversation_id);
        setMessages((m) => [
          ...m.slice(0, -1),
          { role: 'assistant', content: data.reply, tools: data.tools_used },
        ]);
      } catch {
        setMessages((m) => [
          ...m.slice(0, -1),
          { role: 'assistant', content: 'Lost connection. Check your network and send it again.' },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, activeAgent, conversationId]
  );

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' }}
      >
        <div>
          <p className="text-sm font-semibold">Ask about your workforce</p>
          <p className="text-xs opacity-70">Answers come only from {branding.display_name}'s own records</p>
        </div>
        <select
          value={activeAgent}
          onChange={(e) => {
            setActiveAgent(e.target.value);
            setConversationId(null);
            setMessages([]);
          }}
          className="rounded-lg border-0 bg-white/15 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Choose assistant"
        >
          {Object.entries(AGENT_LABELS).map(([k, v]) => (
            <option key={k} value={k} className="text-slate-900">
              {v}
            </option>
          ))}
        </select>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="pt-6 text-center">
            <p className="text-sm text-slate-500">Try one of these:</p>
            <div className="mt-3 space-y-2">
              {(STARTERS[accountType] ?? STARTERS.hybrid).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="mx-auto block max-w-md rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user' ? 'text-white' : 'bg-slate-100 text-slate-900'
              }`}
              style={m.role === 'user' ? { background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' } : undefined}
            >
              {m.pending ? (
                <span className="flex gap-1" aria-label="Thinking">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${d * 120}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.tools && m.tools.length > 0 && (
                    <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                      Checked: {m.tools.map((t) => `${t.name.replace(/_/g, ' ')}${t.rows !== null ? ` (${t.rows})` : ''}`).join(' · ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="Ask about attendance, invoices, leave…"
            disabled={busy}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
            aria-label="Your question"
          />
          <button
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          The assistant reads your records but cannot change them. Verify payroll and statutory figures before filing.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// TIMESHEET APPROVAL
// ============================================================================

interface TimesheetLine {
  id: string;
  days_present: number;
  days_absent: number;
  overtime_hours: number;
  billable_rate: number;
  line_total: number;
  client_disputed: boolean;
  employees: { emp_code: string; first_name: string; last_name: string; designation: string };
}

interface Timesheet {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_mandays: number;
  gross_billable: number;
  client_sites?: { site_name: string; city: string };
  timesheet_lines: TimesheetLine[];
}

export function TimesheetApproval({ timesheet, onDone }: { timesheet: Timesheet; onDone: () => void }) {
  const [disputes, setDisputes] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disputedTotal = timesheet.timesheet_lines
    .filter((l) => disputes[l.id])
    .reduce((t, l) => t + Number(l.line_total), 0);

  const submit = async (action: 'approve' | 'reject') => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/timesheets/${timesheet.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          remarks,
          disputed_lines: Object.entries(disputes).map(([id, note]) => ({ id, note })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Could not save your decision.');
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {timesheet.client_sites?.site_name ?? 'Site'} — {timesheet.period_start} to {timesheet.period_end}
          </h3>
          <p className="text-sm text-slate-500">
            {timesheet.total_mandays} mandays · {inr(timesheet.gross_billable)} before GST
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
          Awaiting your approval
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3">Worker</th>
              <th className="py-2 pr-3 text-right">Present</th>
              <th className="py-2 pr-3 text-right">Absent</th>
              <th className="py-2 pr-3 text-right">OT hrs</th>
              <th className="py-2 pr-3 text-right">Amount</th>
              <th className="py-2">Dispute</th>
            </tr>
          </thead>
          <tbody>
            {timesheet.timesheet_lines.map((line) => (
              <tr key={line.id} className={`border-b border-slate-100 ${disputes[line.id] ? 'bg-red-50' : ''}`}>
                <td className="py-2 pr-3">
                  <p className="font-medium text-slate-900">
                    {line.employees.first_name} {line.employees.last_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {line.employees.emp_code} · {line.employees.designation}
                  </p>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{line.days_present}</td>
                <td className="py-2 pr-3 text-right tabular-nums text-slate-500">{line.days_absent}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{line.overtime_hours}</td>
                <td className="py-2 pr-3 text-right tabular-nums font-medium">{inr(line.line_total)}</td>
                <td className="py-2">
                  <input
                    value={disputes[line.id] ?? ''}
                    onChange={(e) => {
                      const next = { ...disputes };
                      if (e.target.value) next[line.id] = e.target.value;
                      else delete next[line.id];
                      setDisputes(next);
                    }}
                    placeholder="Reason, if wrong"
                    className="w-40 rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none"
                    aria-label={`Dispute reason for ${line.employees.emp_code}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {disputedTotal > 0 && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          {Object.keys(disputes).length} line{Object.keys(disputes).length > 1 ? 's' : ''} disputed —
          {' '}{inr(disputedTotal)} will be held back from this invoice.
        </p>
      )}

      <textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Remarks for HP Enterprise (optional)"
        rows={2}
        className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => submit('approve')}
          disabled={busy}
          className="rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' }}
        >
          {busy ? 'Saving…' : `Approve ${inr(timesheet.gross_billable - disputedTotal)}`}
        </button>
        <button
          onClick={() => submit('reject')}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Send back for correction
        </button>
      </div>
    </Card>
  );
}

// ============================================================================
// NOTIFICATION BELL
// ============================================================================

interface Notification {
  id: string;
  title: string;
  body: string;
  action_url?: string;
  severity: string;
  read_at?: string;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setItems(d.notifications);
          setUnread(d.unread);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read' }),
    });
    load();
  };

  const severityDot: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-slate-400',
    info: 'bg-slate-400',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 hover:bg-slate-100"
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-200 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                Nothing new. Alerts about attendance, expiring contracts and overdue invoices show up here.
              </p>
            ) : (
              items.map((n) => (
                <a
                  key={n.id}
                  href={n.action_url ?? '#'}
                  onClick={() => markRead(n.id)}
                  className={`block border-b border-slate-100 px-4 py-3 hover:bg-slate-50 ${!n.read_at ? 'bg-blue-50/40' : ''}`}
                >
                  <div className="flex gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot[n.severity] ?? 'bg-slate-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{n.body}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
