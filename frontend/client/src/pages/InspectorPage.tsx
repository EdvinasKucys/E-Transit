// src/pages/InspectorPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ticketValidationService } from "../services/TicketValidationService";

const InspectorPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [ticketId, setTicketId] = useState("");
  const [vehicleCode, setVehicleCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) {
      setError("Bilieto ID yra privalomas");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      // 👇 THIS is the actual call to your controller
      const res = await ticketValidationService.validate(ticketId.trim(), {
        transportoPriemonesKodas: vehicleCode.trim() || null,
      });

      // depending on what your controller returns, adjust these names
      setResult(res);
    } catch (err: any) {
      setResult({
        valid: false,
        message: err?.response?.data ?? "Nepavyko patikrinti bilieto",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTicketId("");
    setVehicleCode("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* header like your other pages */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            E-Transit – Inspektorius
          </h1>
          <p className="text-sm text-slate-500">
            Prisijungta kaip {user?.name} ({user?.role})
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-slate-900 text-white px-4 py-1 rounded-md hover:bg-slate-800"
        >
          Atsijungti
        </button>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Bilieto tikrinimas</h2>
          <button
            onClick={handleClear}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm"
          >
            Išvalyti
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          <form onSubmit={handleValidate} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Bilieto ID *</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="TCK-00001"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Transporto priemonės kodas (nebūtina)
              </label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={vehicleCode}
                onChange={(e) => setVehicleCode(e.target.value)}
                placeholder="BUS-24"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
            >
              {loading ? "Tikrinama..." : "Tikrinti"}
            </button>
          </form>

          {/* errors */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* result from controller */}
          {result && (
            <div
              className={`mt-4 px-3 py-2 rounded text-sm ${
                result.valid
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p className="font-medium">
                {result.valid ? "Bilietas galiojantis" : "Bilietas negaliojantis"}
              </p>
              {result.message && <p>{result.message}</p>}
              {result.expiresAt && (
                <p className="text-xs text-slate-500 mt-1">
                  Galioja iki: {new Date(result.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectorPage;
