// src/pages/RegisterPage.tsx
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    vardas: "",
    pavarde: "",
    slapyvardis: "",
    slaptazodis: "",
    slaptazodisRepeat: "",
    elPastas: "",
    gimimoData: "",
    miestas: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!formData.vardas.trim() || !formData.pavarde.trim()) {
      setLocalError("Vardas ir pavardė yra privalomi");
      return;
    }

    if (!formData.slapyvardis.trim()) {
      setLocalError("Naudotojo vardas yra privalomas");
      return;
    }

    if (formData.slapyvardis.length < 3) {
      setLocalError("Naudotojo vardas turi turėti bent 3 simbolius");
      return;
    }

    if (!formData.slaptazodis.trim()) {
      setLocalError("Slaptažodis yra privalomas");
      return;
    }

    if (formData.slaptazodis.length < 6) {
      setLocalError("Slaptažodis turi turėti bent 6 simbolius");
      return;
    }

    if (formData.slaptazodis !== formData.slaptazodisRepeat) {
      setLocalError("Slaptažodžiai nesutampa");
      return;
    }

    if (formData.elPastas && !formData.elPastas.includes("@")) {
      setLocalError("Neteisingas el. pašto adresas");
      return;
    }

    try {
      await register({
        vardas: formData.vardas,
        pavarde: formData.pavarde,
        slapyvardis: formData.slapyvardis,
        slaptazodis: formData.slaptazodis,
        elPastas: formData.elPastas || undefined,
        gimimoData: formData.gimimoData || undefined,
        miestas: formData.miestas || undefined,
      });

      navigate("/passenger", { replace: true });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Registracija nepavyko");
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">E-Transit</h1>
          <p className="text-slate-600 mt-2">Sukurkite naują paskyrą</p>
        </div>

        {displayError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vardas *
              </label>
              <input
                type="text"
                name="vardas"
                value={formData.vardas}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                placeholder="Vardas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pavardė *
              </label>
              <input
                type="text"
                name="pavarde"
                value={formData.pavarde}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                placeholder="Pavardė"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Naudotojo vardas *
            </label>
            <input
              type="text"
              name="slapyvardis"
              value={formData.slapyvardis}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              placeholder="Įveskite naudotojo vardą"
            />
            <p className="text-xs text-slate-500 mt-1">Min. 3 simboliai</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slaptažodis *
            </label>
            <input
              type="password"
              name="slaptazodis"
              value={formData.slaptazodis}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              placeholder="Įveskite slaptažodį"
            />
            <p className="text-xs text-slate-500 mt-1">Min. 6 simboliai</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pakartokite slaptažodį *
            </label>
            <input
              type="password"
              name="slaptazodisRepeat"
              value={formData.slaptazodisRepeat}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              placeholder="Pakartokite slaptažodį"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              El. paštas
            </label>
            <input
              type="email"
              name="elPastas"
              value={formData.elPastas}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              placeholder="jūsų@el.paštas"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gimimo data
              </label>
              <input
                type="date"
                name="gimimoData"
                value={formData.gimimoData}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Miestas
              </label>
              <input
                type="text"
                name="miestas"
                value={formData.miestas}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                placeholder="Jūsų miestas"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 font-medium transition"
          >
            {isLoading ? "Registruojama..." : "Registruotis"}
          </button>
        </form>

        <div className="text-center border-t border-slate-200 pt-4">
          <p className="text-slate-600 text-sm">
            Jau turite paskyrą?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Prisijunkite
            </Link>
          </p>
        </div>

        <p className="text-xs text-slate-500 text-center">
          * - privalomi laukai
        </p>
      </div>
    </div>
  );
}
