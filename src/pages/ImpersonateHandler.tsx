import { useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, User, ShieldAlert } from "lucide-react";

interface ImpersonationData {
  user_id: string;
  display_name: string;
  email: string;
  timestamp: number;
}

export default function ImpersonateHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);

  const token = searchParams.get("token");
  let data: ImpersonationData | null = null;
  let error = "";

  if (!token) {
    error = "No impersonation token provided.";
  } else {
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.user_id && decoded.display_name) {
        data = decoded as ImpersonationData;
      } else {
        error = "Invalid impersonation token format.";
      }
    } catch {
      error = "Failed to decode impersonation token.";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md">
        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-white mb-2">Impersonation Failed</h1>
            <p className="text-sm text-neutral-400 mb-4">{error}</p>
            <button onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Admin
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-white mb-1">Impersonation Mode</h1>
              <p className="text-sm text-neutral-400">You are viewing the platform as:</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center text-xl font-medium text-white mx-auto mb-3">
                {data!.display_name?.charAt(0) || "?"}
              </div>
              <h2 className="text-lg font-semibold text-white">{data!.display_name}</h2>
              <p className="text-sm text-neutral-400">{data!.email}</p>
              <p className="text-xs text-neutral-600 mt-1">ID: {data!.user_id}</p>
              <p className="text-xs text-neutral-600">
                Started: {new Date(data!.timestamp).toLocaleString()}
              </p>
            </div>

            {!revealed && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-center">
                <ShieldAlert className="h-6 w-6 text-neutral-500 mx-auto mb-2" />
                <p className="text-sm text-neutral-400 mb-3">
                  Impersonation requires a backend session swap mechanism to fully function.
                </p>
                <button onClick={() => setRevealed(true)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white">
                  Continue Anyway (Read Only)
                </button>
              </div>
            )}

            {revealed && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm text-neutral-300">Simulated View</span>
                </div>
                <p className="text-xs text-neutral-500 mb-4">
                  In production, this would swap your admin session with the target user's session
                  using the Supabase service_role key and a secure token exchange.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => navigate("/")}
                    className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-white transition-colors">
                    Return to Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
