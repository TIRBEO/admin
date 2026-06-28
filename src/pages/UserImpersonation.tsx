import { useState, useEffect, useCallback } from "react";
import { User, Search, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AdminUser {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
}

export default function UserImpersonation() {
  const [searchUser, setSearchUser] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setSearching(true);
    setSearched(true);
    const { data } = await supabase.from("admin_users")
      .select("id, user_id, display_name, email")
      .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);
    if (data) setResults(data);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(searchUser), 300);
    return () => clearTimeout(timer);
  }, [searchUser, searchUsers]);

  const handleImpersonate = () => {
    if (!selectedUser) return;
    const impersonationToken = btoa(JSON.stringify({
      user_id: selectedUser.user_id,
      display_name: selectedUser.display_name,
      email: selectedUser.email,
      timestamp: Date.now(),
    }));
    window.open(`/impersonate?token=${impersonationToken}`, "_blank");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">User Impersonation</h1>
        <p className="text-sm text-gray-500 mt-1">View the platform as another user (super admin only)</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-50"><Eye className="h-5 w-5 text-gray-500" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Impersonate User</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Super Admin Only</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search user by email or username..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Search Results */}
        {searching && (
          <div className="mt-3 text-center text-sm text-gray-500">Searching...</div>
        )}
        {!searching && searched && results.length > 0 && (
          <div className="mt-3 space-y-1">
            {results.map(u => (
              <div key={u.id}
                onClick={() => { setSelectedUser(u); setSearchUser(""); setResults([]); setSearched(false); }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white">
                  {u.display_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm text-gray-900">{u.display_name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {!searching && searched && searchUser.length >= 2 && results.length === 0 && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No users found matching "{searchUser}"</p>
          </div>
        )}

        {selectedUser && (
          <>
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
                  {selectedUser.display_name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedUser.display_name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5" />
                <div>
                  <p className="text-amber-700 text-sm">You are about to impersonate <strong>{selectedUser.display_name}</strong></p>
                  <p className="text-gray-500 text-xs mt-1">This will open a new tab with their session. All actions will be logged.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handleImpersonate} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-white text-sm transition-colors">
                <Eye className="h-4 w-4" /> Start Impersonation
              </button>
              <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}

        {!selectedUser && !searchUser && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Search for a user to impersonate</p>
          </div>
        )}
      </div>
    </div>
  );
}
