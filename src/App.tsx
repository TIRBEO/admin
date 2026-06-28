import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { hasMinRole, type AdminRole } from "@/lib/session";
import AdminLayout from "@/components/AdminLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SiteConfigPage from "@/pages/SiteConfig";
import PagesList from "@/pages/PagesList";
import NavLinksPage from "@/pages/NavLinks";
import FooterPage from "@/pages/FooterPage";
import TeamPage from "@/pages/TeamPage";
import FAQPage from "@/pages/FAQPage";
import DocsPage from "@/pages/DocsPage";
import TimelinePage from "@/pages/TimelinePage";
import TestimonialsPage from "@/pages/TestimonialsPage";
import PricingPage from "@/pages/PricingPage";
import AdminsPage from "@/pages/AdminsPage";
import AuditLogPage from "@/pages/AuditLogPage";
import SettingsPage from "@/pages/Settings";
import SystemStatus from "@/pages/SystemStatus";
import NotificationsPage from "@/pages/NotificationsPage";
import ContentApproval from "@/pages/ContentApproval";
import BackupManager from "@/pages/BackupManager";
import AnnouncementManager from "@/pages/AnnouncementManager";
import ExportManager from "@/pages/ExportManager";
import UserImpersonation from "@/pages/UserImpersonation";
import UsersPage from "@/pages/UsersPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SecurityPage from "@/pages/SecurityPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import ReportsPage from "@/pages/ReportsPage";
import TrashPage from "@/pages/TrashPage";
import BlogPage from "@/pages/BlogPage";
import ImpersonateHandler from "@/pages/ImpersonateHandler";

function ProtectedRoute({ children, minRole = "viewer" }: { children: React.ReactNode; minRole?: AdminRole }) {
  const { session, admin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  const sessionRole = admin?.role || session?.admin?.role;
  if (sessionRole && !hasMinRole(sessionRole, minRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">
            Your role ({sessionRole}) does not have permission to access this page.
          </p>
          <a href="/" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 underline">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/impersonate" element={<ImpersonateHandler />} />
        <Route path="/" element={<ProtectedRoute minRole="viewer"><Dashboard /></ProtectedRoute>} />
        <Route path="/site-config" element={<ProtectedRoute minRole="admin"><SiteConfigPage /></ProtectedRoute>} />
        <Route path="/pages" element={<ProtectedRoute minRole="editor"><PagesList /></ProtectedRoute>} />
        <Route path="/nav" element={<ProtectedRoute minRole="editor"><NavLinksPage /></ProtectedRoute>} />
        <Route path="/footer" element={<ProtectedRoute minRole="editor"><FooterPage /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute minRole="editor"><TeamPage /></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute minRole="editor"><FAQPage /></ProtectedRoute>} />
        <Route path="/docs" element={<ProtectedRoute minRole="editor"><DocsPage /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute minRole="editor"><TimelinePage /></ProtectedRoute>} />
        <Route path="/testimonials" element={<ProtectedRoute minRole="editor"><TestimonialsPage /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute minRole="editor"><PricingPage /></ProtectedRoute>} />
        <Route path="/admin/admins" element={<ProtectedRoute minRole="admin"><AdminsPage /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute minRole="admin"><AuditLogPage /></ProtectedRoute>} />
        <Route path="/admin/system-status" element={<ProtectedRoute minRole="manager"><SystemStatus /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute minRole="editor"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/admin/content-approval" element={<ProtectedRoute minRole="manager"><ContentApproval /></ProtectedRoute>} />
        <Route path="/admin/backups" element={<ProtectedRoute minRole="admin"><BackupManager /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute minRole="manager"><AnnouncementManager /></ProtectedRoute>} />
        <Route path="/admin/exports" element={<ProtectedRoute minRole="editor"><ExportManager /></ProtectedRoute>} />
        <Route path="/admin/impersonation" element={<ProtectedRoute minRole="super_admin"><UserImpersonation /></ProtectedRoute>} />
        <Route path="/admin/blog" element={<ProtectedRoute minRole="editor"><BlogPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/overview" element={<ProtectedRoute minRole="viewer"><Dashboard /></ProtectedRoute>} />
        <Route path="/apps/:appId/settings" element={<ProtectedRoute minRole="editor"><SettingsPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/users" element={<ProtectedRoute minRole="editor"><UsersPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/analytics" element={<ProtectedRoute minRole="viewer"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/security" element={<ProtectedRoute minRole="editor"><SecurityPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/content" element={<ProtectedRoute minRole="editor"><DocsPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/integrations" element={<ProtectedRoute minRole="editor"><IntegrationsPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/reports" element={<ProtectedRoute minRole="viewer"><ReportsPage /></ProtectedRoute>} />
        <Route path="/apps/:appId/trash" element={<ProtectedRoute minRole="manager"><TrashPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
