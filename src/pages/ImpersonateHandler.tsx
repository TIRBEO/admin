import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, User, ShieldAlert, ExternalLink } from "lucide-react";

interface ImpersonationData {
  user_id: string;
  display_name: string;
  email: string;
  timestamp: number;
}

export default function ImpersonateHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
          <div className="rounded-xl border border-red-800 bg-red-500/10 p-6 text-center">
            <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-white mb-2">Impersonation Failed</h1>
            <p className="text-sm text-neutral-500 mb-4">{error}</p>
            <button onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300">
              <ArrowLeft className="h-4 w-4" /> Back to Admin
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-800 bg-amber-500/10 p-6 text-center">
              <User className="h-10 w-10 text-amber-400 mx-auto mb-3" />
              <h1 className="text-lg font-semibold text-white mb-1">Impersonation Token Generated</h1>
              <p className="text-sm text-neutral-500">You are viewing the platform as:</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-medium text-white mx-auto mb-3">
                {data!.display_name?.charAt(0) || "?"}
              </div>
              <h2 className="text-lg font-semibold text-white">{data!.display_name}</h2>
              <p className="text-sm text-neutral-500">{data!.email}</p>
              <p className="text-xs text-neutral-600 mt-1">ID: {data!.user_id}</p>
              <p className="text-xs text-neutral-600">
                {new Date(data!.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-500 text-center">
                A new tab has been opened with the impersonation session. All actions will be logged.
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate("/")}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors">
                  Return to Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
