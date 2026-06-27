import { useState } from "react";
import { User, Search, AlertTriangle, Eye } from "lucide-react";

export default function UserImpersonation() {
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: string; display_name: string; email: string } | null>(null);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">User Impersonation</h1>
        <p className="text-sm text-neutral-500 mt-1">View the platform as another user (super admin only)</p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-neutral-800"><Eye className="h-5 w-5 text-neutral-400" /></div>
          <h3 className="text-lg font-semibold text-white">Impersonate User</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Super Admin Only</span>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search user by email or username..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-neutral-800 bg-neutral-950 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            disabled={!selectedUser}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-colors"
          >
            <Eye className="h-4 w-4" /> Impersonate
          </button>
        </div>

        {selectedUser && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
              <div>
                <p className="text-amber-400 text-sm">You are about to impersonate <strong>{selectedUser.display_name}</strong> ({selectedUser.email})</p>
                <p className="text-neutral-500 text-xs mt-1">This will open a new tab with their session. All actions will be logged.</p>
              </div>
            </div>
          </div>
        )}

        {!selectedUser && searchUser && (
          <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 text-center">
            <User className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Search for a user to impersonate</p>
          </div>
        )}
      </div>
    </div>
  );
}
