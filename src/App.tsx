import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { hasMinRole, type AdminRole } from "@/lib/session";
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
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

function ProtectedRoute({ children, minRole = "viewer" }: { children: React.ReactNode; minRole?: AdminRole }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-200" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (!hasMinRole(session.admin.role, minRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-neutral-200 mb-2">Access Denied</h2>
          <p className="text-sm text-neutral-500">
            Your role ({session.admin.role}) does not have permission to access this page.
          </p>
          <a href="/" className="mt-4 inline-block text-sm text-neutral-400 hover:text-neutral-200 underline">
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
        <Route path="/admins" element={<ProtectedRoute minRole="admin"><AdminsPage /></ProtectedRoute>} />
        <Route path="/audit-log" element={<ProtectedRoute minRole="admin"><AuditLogPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
