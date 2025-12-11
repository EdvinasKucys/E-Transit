// src/pages/LoginPage.tsx
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password.trim()) {
      setLocalError("Username and password are required");
      return;
    }

    try {
      const user = await login(username, password);
      // Redirect based on user role
      switch (user.role) {
        case "passenger":
          navigate("/passenger", { replace: true });
          break;
        case "admin":
          navigate("/admin", { replace: true });
          break;
        case "driver":
          navigate("/driver", { replace: true });
          break;
        case "inspector":
          navigate("/inspector", { replace: true });
          break;
        default:
          navigate("/passenger", { replace: true });
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">E-Transit</h1>
          <p className="text-slate-600 mt-2">Prisijunkite prie sistemos</p>
        </div>

        {displayError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Naudotojo vardas
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              placeholder="Įveskite slapyvardį"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slaptažodis
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              placeholder="Įveskite slaptažodį"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 font-medium transition"
          >
            {isLoading ? "Prisijungiant..." : "Prisijungti"}
          </button>
        </form>

        <div className="text-center border-t border-slate-200 pt-4">
          <p className="text-slate-600 text-sm">
            Neturite paskyros?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Registruotis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
