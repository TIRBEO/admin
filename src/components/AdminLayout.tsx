import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/useAuth";
import { useAppStore } from "@/hooks/useAppStore";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = useAuth();
  const { currentApp, setCurrentApp } = useAppStore();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  const handleAppChange = (appId: string) => {
    setCurrentApp(appId);
    navigate(`/apps/${appId}/overview`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <Sidebar currentApp={currentApp} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header currentApp={currentApp} onAppChange={handleAppChange} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
