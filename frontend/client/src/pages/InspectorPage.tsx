// src/pages/InspectorPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ticketValidationService } from "../services/TicketValidationService";
import { API_CONFIG } from "../api/apiClient";

const InspectorPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [ticketId, setTicketId] = useState("");
  const [vehicleCode, setVehicleCode] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [vehicles, setVehicles] = useState<Array<{ id?: number; kodas?: string; display?: string }>>([]);
  const [discounts, setDiscounts] = useState<Array<{ id: number; pavadinimas: string; procentas: number }>>([]);
  const [tickets, setTickets] = useState<Array<{ id: string; naudotojas?: string }>>([]);
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
    if (!vehicleCode.trim()) {
      setError("Transporto priemonės kodas yra privalomas");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      // 👇 THIS is the actual call to your controller
      const res = await ticketValidationService.validate(ticketId.trim(), {
        transportoPriemonesKodas: vehicleCode.trim() || null,
        nuolaidaId: discountType ? parseInt(discountType) : null,
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

  // Fetch vehicles, discounts and recent tickets for dropdowns
  useEffect(() => {
    const load = async () => {
      try {
        // vehicles
        const vRes = await fetch(`${API_CONFIG.baseURL}/vehicles`);
        if (vRes.ok) {
          const vData = await vRes.json();
          // normalize fields: use ValstybiniaiNum from backend VehicleDto and build a display label
          const norm = (vData || []).map((v: any) => {
            const plate = v.ValstybiniaiNum ?? v.valstybiniaiNum ?? v.valstybinisNum ?? v.kodas ?? v.code ?? v.kodas;
            const route = v.MarsrutasPavadinimas ?? v.marsrutasPavadinimas ?? v.route ?? null;
            const driverName = (v.VairuotojasVardas || v.VairuotojasPavarde) ? `${v.VairuotojasVardas ?? ''} ${v.VairuotojasPavarde ?? ''}`.trim() : null;
            const display = route ? `${plate} — ${route}` : driverName ? `${plate} — ${driverName}` : plate;
            return { id: plate, kodas: plate, display };
          });
          setVehicles(norm);
        }

        // discounts
        const dRes = await fetch(`${API_CONFIG.baseURL}/discounts`);
        if (dRes.ok) {
          const dData = await dRes.json();
          setDiscounts(dData || []);
        }

        // tickets (admin endpoint returns many; fetch limited recent if available)
        const tRes = await fetch(`${API_CONFIG.baseURL}/admin/tickets`);
        if (tRes.ok) {
          const tData = await tRes.json();
          const normT = (tData || []).map((t: any) => ({ id: t.id ?? t.Id ?? t.guid ?? t.ticketId, naudotojas: t.naudotojas ?? t.Naudotojas ?? t.user }));
          setTickets(normT);
        }
      } catch (err) {
        console.error('Failed to load inspector dropdown data', err);
      }
    };
    load();
  }, []);

  const handleClear = () => {
    setTicketId("");
    setVehicleCode("");
    setDiscountType("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
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
        <div className="flex gap-3">
          <button
            onClick={handleSignOut}
            className="bg-slate-900 text-white px-4 py-1 rounded-md hover:bg-slate-800"
          >
            Atsijungti
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Bilieto tikrinimas</h2>
            <button
              onClick={handleClear}
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-md text-sm"
            >
              Išvalyti
            </button>
          </div>

          <form onSubmit={handleValidate} className="space-y-6">
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
              <label className="block text-sm mb-1">Transporto priemonės kodas *</label>
              {vehicles.length > 0 ? (
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={vehicleCode}
                  onChange={(e) => setVehicleCode(e.target.value)}
                  required
                >
                  <option value="">Pasirinkite transporto priemonę...</option>
                  {vehicles.map((v) => (
                    <option key={v.id ?? v.kodas} value={v.kodas}>
                      {v.display ?? v.kodas}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={vehicleCode}
                  onChange={(e) => setVehicleCode(e.target.value)}
                  placeholder="BUS-24"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm mb-1">Nuolaida tipo kodas</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="">Pasirinkite nuolaidą...</option>
                {discounts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.pavadinimas} ({d.procentas}%)
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md text-base font-semibold disabled:opacity-50"
            >
              {loading ? "Tikrinama..." : "Tikrinti"}
            </button>
          </form>

          {/* errors */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* result from controller */}
          {result && (
            <div
              className={`mt-6 px-4 py-4 rounded text-base ${
                result.valid
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p className="font-bold text-lg">
                {result.valid ? "✓ Bilietas galiojantis" : "✗ Bilietas negaliojantis"}
              </p>
              {result.message && <p className="mt-2">{result.message}</p>}
              {result.expiresAt && (
                <p className="text-xs text-slate-600 mt-2">
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
