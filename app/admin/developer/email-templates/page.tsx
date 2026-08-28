"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib";
import { Mail, Eye, Send, ChevronDown, Check, AlertCircle } from "lucide-react";

interface Template {
  name: string;
  label: string;
  category: "auth" | "security" | "product" | "forms" | "support" | "admin";
  sampleVars: Record<string, string>;
}

const TEMPLATES: Template[] = [
  // Auth
  { name: "signup_otp", label: "Signup OTP", category: "auth", sampleVars: { otp: "482910" } },
  { name: "login_otp", label: "Login OTP", category: "auth", sampleVars: { otp: "739104" } },
  { name: "verify_email", label: "Verify Email", category: "auth", sampleVars: { otp: "592847", name: "John" } },
  { name: "magic_link", label: "Magic Link", category: "auth", sampleVars: { name: "John", magicLink: "https://accounts.tirbeo.app/auth/magic/abc123" } },
  { name: "welcome", label: "Welcome", category: "auth", sampleVars: { name: "John", dashboardUrl: "https://tirbeo.app/overview" } },
  // Security
  { name: "password_reset_otp", label: "Password Reset OTP", category: "security", sampleVars: { name: "John", otp: "618392" } },
  { name: "password_reset_link", label: "Password Reset Link", category: "security", sampleVars: { name: "John", resetUrl: "https://accounts.tirbeo.app/reset/abc123" } },
  { name: "password_changed", label: "Password Changed", category: "security", sampleVars: { name: "John", changedAt: "Aug 25, 2026, 2:05 PM UTC", ipAddress: "192.168.1.1" } },
  { name: "login_alert", label: "New Sign-in Alert", category: "security", sampleVars: { name: "John", location: "New York, US", device: "Chrome on macOS", loginTime: "Aug 25, 2026, 2:05 PM UTC", revokeUrl: "https://tirbeo.app/account/sessions" } },
  { name: "suspicious_login", label: "Suspicious Login", category: "security", sampleVars: { name: "John", location: "Unknown", device: "Firefox on Linux", loginTime: "Aug 25, 2026, 2:05 PM UTC", ipAddress: "10.0.0.1", revokeUrl: "https://tirbeo.app/account/sessions" } },
  { name: "account_recovery", label: "Account Recovery", category: "security", sampleVars: { name: "John", recoveryUrl: "https://accounts.tirbeo.app/recover/abc123" } },
  // Product
  { name: "notification_digest", label: "Notification Digest", category: "product", sampleVars: { name: "John", count: "5", digestItems: '<div style="padding:12px;background:#f0f0f0;border-radius:8px;margin-bottom:8px;"><strong>New form submission</strong><br/><span style="color:#444444;font-size:13px;">Contact form received a new response</span></div>', dashboardUrl: "https://tirbeo.app/overview" } },
  { name: "product_update", label: "Product Update", category: "product", sampleVars: { name: "John", title: "New Feature: Real-time Notifications", message: "We just launched real-time push notifications! You'll now receive instant alerts for important events.", ctaUrl: "https://tirbeo.app/overview", ctaLabel: "Try it now", dashboardUrl: "https://tirbeo.app/overview" } },
  { name: "weekly_summary", label: "Weekly Summary", category: "product", sampleVars: { name: "John", periodLabel: "Aug 19 – Aug 25, 2026", statRows: '<div style="padding:12px 0;border-bottom:1px solid #e0e0e0;"><span style="color:#444444;">Logins</span><span style="float:right;font-weight:600;">12</span></div><div style="padding:12px 0;"><span style="color:#444444;">Form submissions</span><span style="float:right;font-weight:600;">47</span></div>', suspiciousSection: "", dashboardUrl: "https://tirbeo.app/overview" } },
  { name: "account_tip", label: "Account Tip", category: "product", sampleVars: { name: "John", tipTitle: "Enable Two-Factor Authentication", tipBody: "Secure your account with an authenticator app for an extra layer of protection.", actionUrl: "https://tirbeo.app/account/security", actionLabel: "Enable 2FA", dashboardUrl: "https://tirbeo.app/overview" } },
  { name: "account_suspended", label: "Account Suspended", category: "product", sampleVars: { name: "John", statusType: "suspended", reason: "Violation of terms of service", untilLabel: "Until further notice.", actionLabel: "Contact support.", dashboardUrl: "https://tirbeo.app/account" } },
  { name: "account_deleted", label: "Account Deletion", category: "product", sampleVars: { name: "John", dateLabel: "Sep 25, 2026", dashboardUrl: "https://tirbeo.app/account/security" } },
  // Forms
  { name: "form_submission_confirmation", label: "Form Submission Confirmation", category: "forms", sampleVars: { respondentName: "Jane", formTitle: "Contact Form", formUrl: "https://forms.tirbeo.app/form/abc123" } },
  { name: "form_notification", label: "Form Notification", category: "forms", sampleVars: { formTitle: "Contact Form", submissionData: '<div style="padding:12px;background:#f8f9fa;border-radius:8px;"><strong>Name:</strong> Jane Doe<br/><strong>Email:</strong> jane@example.com<br/><strong>Message:</strong> Hello!</div>', formUrl: "https://forms.tirbeo.app/form/abc123" } },
  { name: "form_response", label: "Form Response", category: "forms", sampleVars: { formTitle: "Contact Form", respondentName: "Jane", submittedAt: "Aug 25, 2026, 2:05 PM UTC", responseId: "resp_abc123", answers: '<div style="padding:12px;background:#f8f9fa;border-radius:8px;"><strong>Name:</strong> Jane Doe<br/><strong>Email:</strong> jane@example.com</div>', adminUrl: "https://admin.tirbeo.app/admin/forms" } },
  // Support
  { name: "ticket_created", label: "Ticket Created", category: "support", sampleVars: { ticketId: "TKT-001", ticketSubject: "Login issue", ticketStatus: "open", ticketUrl: "https://tirbeo.app/support/tickets/abc123" } },
  { name: "ticket_updated", label: "Ticket Updated", category: "support", sampleVars: { ticketId: "TKT-001", updateMessage: "We're looking into your issue and will get back to you shortly.", ticketUrl: "https://tirbeo.app/support/tickets/abc123" } },
  { name: "ticket_closed", label: "Ticket Closed", category: "support", sampleVars: { ticketId: "TKT-001", ticketUrl: "https://tirbeo.app/support/tickets/abc123" } },
  // Admin
  { name: "admin_alert", label: "Admin Alert", category: "admin", sampleVars: { subject: "New user signup spike", message: "50 new users signed up in the last hour.", details: '<div style="padding:12px;background:#f8f9fa;border-radius:8px;"><strong>Count:</strong> 50<br/><strong>Time:</strong> Aug 25, 2026, 2:05 PM UTC</div>', dashboardUrl: "https://admin.tirbeo.app/admin" } },
  { name: "system_alert", label: "System Alert", category: "admin", sampleVars: { message: "Database connection pool is running low.", service: "PostgreSQL", alertTime: "Aug 25, 2026, 2:05 PM UTC" } },
  { name: "admin_account_created", label: "Admin Account Created", category: "admin", sampleVars: { name: "Admin", adminRole: "admin", temporaryPassword: "Temp123!", loginUrl: "https://accounts.tirbeo.app/login" } },
];

const CATEGORIES = [
  { key: "auth", label: "Authentication", color: "#2563eb" },
  { key: "security", label: "Security", color: "#dc2626" },
  { key: "product", label: "Product", color: "#7c3aed" },
  { key: "forms", label: "Forms", color: "#059669" },
  { key: "support", label: "Support", color: "#d97706" },
  { key: "admin", label: "Admin", color: "#be185d" },
] as const;

export default function EmailTemplatesPage() {
  const [selected, setSelected] = useState<Template>(TEMPLATES[0]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(TEMPLATES[0].category);
  const [showSendModal, setShowSendModal] = useState(false);

  const fetchPreview = async (tmpl: Template) => {
    setLoading(true);
    try {
      const response = await apiFetch(
        `/api/admin/email-preview?template=${tmpl.name}`
      );
      const res = await response.json();
      setPreviewHtml(res.html || "<p>Preview not available</p>");
    } catch {
      setPreviewHtml("<p style='color:red'>Failed to load preview</p>");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPreview(selected);
  }, [selected]);

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes("@")) return;
    setSending(true);
    setSendResult(null);
    try {
      await apiFetch("/api/email/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: testEmail }) });
      setSendResult({ ok: true, message: `Test email sent to ${testEmail}` });
    } catch (e: any) {
      setSendResult({ ok: false, message: e?.message || "Failed to send" });
    }
    setSending(false);
    setTimeout(() => setSendResult(null), 5000);
  };

  return (
    <div style={{ display: "flex", height: "100vh", gap: 0 }}>
      {/* Left: Template list */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: "1px solid var(--tb-border)",
        background: "var(--tb-surface-1)", overflow: "auto", padding: "16px 0",
      }}>
        <div style={{ padding: "0 16px 12px", fontWeight: 700, fontSize: 15, color: "var(--tb-text-primary)" }}>
          Email Templates
        </div>
        <div style={{ padding: "0 16px 16px", fontSize: 12, color: "var(--tb-text-muted)" }}>
          {TEMPLATES.length} templates across {CATEGORIES.length} categories
        </div>
        {CATEGORIES.map((cat) => {
          const templates = TEMPLATES.filter((t) => t.category === cat.key);
          const isOpen = expandedCat === cat.key;
          return (
            <div key={cat.key}>
              <button
                type="button"
                onClick={() => setExpandedCat(isOpen ? null : cat.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "8px 16px", background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: cat.color, textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <ChevronDown size={12} style={{ transform: isOpen ? "rotate(0)" : "rotate(-90deg)", transition: "transform 150ms" }} />
                {cat.label}
                <span style={{ marginLeft: "auto", color: "var(--tb-text-muted)", fontWeight: 400 }}>{templates.length}</span>
              </button>
              {isOpen && templates.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => setSelected(tmpl)}
                  style={{
                    display: "block", width: "100%", padding: "6px 16px 6px 36px",
                    background: selected.name === tmpl.name ? "var(--tb-surface-2)" : "transparent",
                    border: "none", cursor: "pointer", fontSize: 13, textAlign: "left",
                    color: selected.name === tmpl.name ? "var(--tb-text-primary)" : "var(--tb-text-secondary)",
                    fontWeight: selected.name === tmpl.name ? 600 : 400,
                  }}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Right: Preview */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid var(--tb-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--tb-surface-1)",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tb-text-primary)" }}>
              {selected.label}
            </div>
            <div style={{ fontSize: 12, color: "var(--tb-text-muted)", marginTop: 2 }}>
              Template: <code style={{ background: "var(--tb-surface-2)", padding: "2px 6px", borderRadius: 4 }}>{selected.name}</code>
              {" · "}
              Category: <span style={{ color: CATEGORIES.find((c) => c.key === selected.category)?.color }}>
                {CATEGORIES.find((c) => c.key === selected.category)?.label}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => fetchPreview(selected)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: "var(--tb-surface-2)", border: "1px solid var(--tb-border)",
                borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--tb-text-primary)",
              }}
            >
              <Eye size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: "var(--tb-accent, #2563eb)", border: "none",
                borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600,
              }}
            >
              <Send size={14} /> Send Test
            </button>
          </div>
        </div>

        {/* Preview iframe */}
        <div style={{ flex: 1, padding: 24, overflow: "auto", background: "var(--tb-bg)" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--tb-text-muted)" }}>Loading preview...</div>
          ) : (
            <div style={{
              maxWidth: 660, margin: "0 auto", background: "#000",
              borderRadius: 12, overflow: "hidden",
            }}>
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                style={{ width: "100%", minHeight: 600, border: "none" }}
                sandbox="allow-same-origin"
              />
            </div>
          )}

          {/* Sample variables */}
          <div style={{
            maxWidth: 660, margin: "16px auto 0", padding: 16,
            background: "var(--tb-surface-1)", border: "1px solid var(--tb-border)", borderRadius: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--tb-text-muted)", marginBottom: 8 }}>
              Sample Variables
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(selected.sampleVars).map(([key, val]) => (
                <span key={key} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 6,
                  background: "var(--tb-surface-2)", color: "var(--tb-text-secondary)",
                  fontFamily: "monospace",
                }}>
                  {`{{${key}}}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Send test modal */}
      {showSendModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowSendModal(false)}
        >
          <div
            style={{ background: "var(--tb-surface-1)", borderRadius: 12, padding: 24, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: "var(--tb-text-primary)" }}>
              Send Test Email
            </div>
            <div style={{ fontSize: 13, color: "var(--tb-text-muted)", marginBottom: 16 }}>
              Send a preview of <strong>{selected.label}</strong> to verify rendering.
            </div>
            <input
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--tb-border)",
                background: "var(--tb-surface-2)", color: "var(--tb-text-primary)", fontSize: 14,
                outline: "none", marginBottom: 16,
              }}
            />
            {sendResult && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                borderRadius: 8, marginBottom: 12, fontSize: 13,
                background: sendResult.ok ? "#f0fdf4" : "#fef2f2",
                color: sendResult.ok ? "#16a34a" : "#dc2626",
              }}>
                {sendResult.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                {sendResult.message}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid var(--tb-border)",
                  background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--tb-text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sending || !testEmail.includes("@")}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: sending ? "var(--tb-surface-2)" : "var(--tb-accent, #2563eb)",
                  color: sending ? "var(--tb-text-muted)" : "#fff",
                  cursor: sending ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
