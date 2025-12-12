// src/pages/AdminPage.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import adminService from "../services/adminService";

type AdminTab = "overview" | "workers" | "discounts" | "prices" | "statistics";

const AdminPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Worker creation form
  const [workerForm, setWorkerForm] = useState({
    vardas: "",
    pavarde: "",
    slapyvardis: "",
    slaptazodis: "",
    slaptazodisRepeat: "",
    role: "Vairuotojas" as "Vairuotojas" | "Kontrolierius" | "Administratorius",
    elPastas: "",
    gimimoData: "",
    miestas: "",
    // Driver-specific fields
    vairavimosStazas: "",
  });
  const [workerLoading, setWorkerLoading] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const [workerSuccess, setWorkerSuccess] = useState<string | null>(null);

  // mock data instead of DB
  const [discounts, setDiscounts] = useState([
    { id: 1, name: "Studentas", percent: 50 },
    { id: 2, name: "Moksleivis", percent: 30 },
  ]);
  const [editingDiscount, setEditingDiscount] = useState<null | { id: number; name: string; percent: number }>(null);
  const [discountForm, setDiscountForm] = useState({ name: "", percent: 0 });

  const [ticketPrices, setTicketPrices] = useState([
    { id: 1, name: "Vienkartinis", basePrice: 1.2 },
    { id: 2, name: "Dienos", basePrice: 3.5 },
  ]);
  const [editingPrice, setEditingPrice] = useState<null | { id: number; name: string; basePrice: number }>(null);
  const [priceForm, setPriceForm] = useState({ name: "", basePrice: 0 });

  const [statsRange, setStatsRange] = useState<"today" | "week" | "month">("today");
  const [stats, setStats] = useState<{ sold: number; revenue: number } | null>(null);

  // Worker list management
  const [workers, setWorkers] = useState<
    Array<{
      idNaudotojas: number;
      vardas: string;
      pavarde: string;
      slapyvardis: string;
      role: string;
      elPastas?: string;
    }>
  >([]);
  const [editingWorker, setEditingWorker] = useState<(typeof workers)[0] | null>(null);
  const [editingWorkerRole, setEditingWorkerRole] = useState<string>("");

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case "Administratorius":
        return "bg-red-100 text-red-800 ring-1 ring-red-200";
      case "Kontrolierius":
        return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
      case "Vairuotojas":
        return "bg-green-100 text-green-800 ring-1 ring-green-200";
      default:
        return "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  // fake stats generator
  const fetchStats = () => {
    if (statsRange === "today") setStats({ sold: 40, revenue: 55.4 });
    else if (statsRange === "week") setStats({ sold: 250, revenue: 360.1 });
    else setStats({ sold: 1000, revenue: 1300 });
  };

  useEffect(() => {
    fetchStats();
  }, [statsRange]);

  // Handle worker form change
  const handleWorkerFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setWorkerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle worker creation
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setWorkerError(null);
    setWorkerSuccess(null);

    if (!workerForm.vardas.trim() || !workerForm.pavarde.trim()) {
      setWorkerError("Vardas ir pavardė yra privalomi");
      return;
    }

    if (!workerForm.slapyvardis.trim()) {
      setWorkerError("Naudotojo vardas yra privalomas");
      return;
    }

    if (workerForm.slapyvardis.length < 3) {
      setWorkerError("Naudotojo vardas turi turėti bent 3 simbolius");
      return;
    }

    if (!workerForm.slaptazodis.trim()) {
      setWorkerError("Slaptažodis yra privalomas");
      return;
    }

    if (workerForm.slaptazodis.length < 6) {
      setWorkerError("Slaptažodis turi turėti bent 6 simbolius");
      return;
    }

    if (workerForm.slaptazodis !== workerForm.slaptazodisRepeat) {
      setWorkerError("Slaptažodžiai nesutampa");
      return;
    }

    setWorkerLoading(true);
    try {
      const workerPayload: any = {
        vardas: workerForm.vardas,
        pavarde: workerForm.pavarde,
        slapyvardis: workerForm.slapyvardis,
        slaptazodis: workerForm.slaptazodis,
        role: workerForm.role,
        elPastas: workerForm.elPastas || undefined,
        gimimoData: workerForm.gimimoData || undefined,
        miestas: workerForm.miestas || undefined,
      };

      // Add driver-specific fields if role is Vairuotojas
      if (workerForm.role === "Vairuotojas") {
        workerPayload.vairavimosStazas = workerForm.vairavimosStazas
          ? parseFloat(workerForm.vairavimosStazas)
          : undefined;
      }

      const response = await adminService.createWorker(workerPayload);

      setWorkerSuccess(
        `Darbuotojo paskyra sukurta sėkmingai! Naudotojo vardas: ${response.slapyvardis}`
      );

      setWorkerForm({
        vardas: "",
        pavarde: "",
        slapyvardis: "",
        slaptazodis: "",
        slaptazodisRepeat: "",
        role: "Vairuotojas",
        elPastas: "",
        gimimoData: "",
        miestas: "",
        vairavimosStazas: "",
      });
    } catch (err) {
      setWorkerError(err instanceof Error ? err.message : "Nepavyko sukurti paskyros");
    } finally {
      setWorkerLoading(false);

    }
  };

  // Handle worker role update
  const handleUpdateWorkerRole = async (workerId: number, newRole: string) => {
    const prevWorkers = [...workers];
    // optimistic update
    setWorkers((prev) => prev.map((w) => (w.idNaudotojas === workerId ? { ...w, role: newRole } : w)));
    try {
      await adminService.updateWorkerRole(workerId, newRole as any);
      setEditingWorker(null);
      setEditingWorkerRole("");
    } catch (error) {
      console.error('Failed to update worker role', error);
      // revert
      setWorkers(prevWorkers);
    }
  };

  // Handle worker deletion
  const handleDeleteWorker = async (workerId: number) => {
    if (!confirm("Ar tikrai norite ištrinti šią darbuotojo paskyrą?")) return;
    const prevWorkers = [...workers];
    // optimistic removal
    setWorkers((prev) => prev.filter((w) => w.idNaudotojas !== workerId));
    try {
      await adminService.deleteWorker(workerId);
    } catch (error) {
      console.error('Failed to delete worker', error);
      // revert
      setWorkers(prevWorkers);
    }
  };

  // Load workers on mount (mock data for now)
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const data = await adminService.getWorkers();
        setWorkers(data);
      } catch (error) {
        console.error('Failed to load workers', error);
      }
    };
    loadWorkers();
  }, []);

  // discounts
  const handleDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.name.trim()) return;

    if (editingDiscount) {
      setDiscounts((prev) =>
        prev.map((d) =>
          d.id === editingDiscount.id ? { ...d, name: discountForm.name, percent: discountForm.percent } : d
        )
      );
    } else {
      const newId = discounts.length ? Math.max(...discounts.map((d) => d.id)) + 1 : 1;
      setDiscounts((prev) => [...prev, { id: newId, name: discountForm.name, percent: discountForm.percent }]);
    }
    setEditingDiscount(null);
    setDiscountForm({ name: "", percent: 0 });
  };

  // prices
  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceForm.name.trim()) return;

    if (editingPrice) {
      setTicketPrices((prev) =>
        prev.map((p) =>
          p.id === editingPrice.id ? { ...p, name: priceForm.name, basePrice: priceForm.basePrice } : p
        )
      );
    } else {
      const newId = ticketPrices.length ? Math.max(...ticketPrices.map((p) => p.id)) + 1 : 1;
      setTicketPrices((prev) => [...prev, { id: newId, name: priceForm.name, basePrice: priceForm.basePrice }]);
    }
    setEditingPrice(null);
    setPriceForm({ name: "", basePrice: 0 });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">E-Transit – Administratorius</h1>
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

      {/* Tab Navigation */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-4 font-medium ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Apžvalga
            </button>
            <button
              onClick={() => setActiveTab("workers")}
              className={`px-4 py-4 font-medium ${
                activeTab === "workers"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Darbuotojų valdymas
            </button>
            <button
              onClick={() => setActiveTab("discounts")}
              className={`px-4 py-4 font-medium ${
                activeTab === "discounts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nuolaidos
            </button>
            <button
              onClick={() => setActiveTab("prices")}
              className={`px-4 py-4 font-medium ${
                activeTab === "prices"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bilietų kainos
            </button>
            <button
              onClick={() => setActiveTab("statistics")}
              className={`px-4 py-4 font-medium ${
                activeTab === "statistics"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Statistika ir ataskaitos
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Routes Management Section */}
            <div className="bg-white shadow-md rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
                Maršrutų valdymas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center">
                <Link
                  to="/admin/routes"
                  className="bg-indigo-600 text-white px-6 py-4 rounded-xl hover:bg-indigo-700 transition-colors text-center font-medium shadow-sm w-full"
                >
                  Maršrutų valdymas
                </Link>
                <Link
                  to="/admin/routes/optimize"
                  className="bg-purple-600 text-white px-6 py-4 rounded-xl hover:bg-purple-700 transition-colors text-center font-medium shadow-sm w-full"
                >
                  Maršrutų optimizavimas
                </Link>
              </div>
            </div>

            {/* Other Management Sections */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Kiti valdymo skydeliai</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Bilietų valdymas
                </button>
                <Link
                  to="/vehicles"
                  className="bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition font-medium text-center"
                >
                  Transporto priemonės
                </Link>
                <Link
                  to="/admin/routes/schedules"
                  className="bg-pink-600 text-white px-6 py-4 rounded-lg hover:bg-pink-700 transition font-medium text-center"
                >
                  Tvarkaraščiai
                </Link>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold flex-1">Statistinės ataskaitos</h2>
                <button onClick={() => setStatsRange("today")} className={statsRange === "today" ? "px-3 py-1 bg-blue-100 rounded" : "px-3 py-1 bg-gray-100 rounded"}>
                  Šiandien
                </button>
                <button onClick={() => setStatsRange("week")} className={statsRange === "week" ? "px-3 py-1 bg-blue-100 rounded" : "px-3 py-1 bg-gray-100 rounded"}>
                  Savaitė
                </button>
                <button onClick={() => setStatsRange("month")} className={statsRange === "month" ? "px-3 py-1 bg-blue-100 rounded" : "px-3 py-1 bg-gray-100 rounded"}>
                  Mėnuo
                </button>
              </div>
              <div className="bg-gray-50 rounded p-4 flex gap-6">
                <div>
                  <p className="text-xs text-slate-500">Parduoti bilietai</p>
                  <p className="text-2xl font-bold">{stats?.sold ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pajamos</p>
                  <p className="text-2xl font-bold">
                    {stats ? `€${stats.revenue.toFixed(2)}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* WORKERS TAB */}
        {activeTab === "workers" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Darbuotojų paskyros</h2>

            {workerError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm mb-4">
                {workerError}
              </div>
            )}

            {workerSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-sm mb-4">
                {workerSuccess}
              </div>
            )}

            <div className="w-full">
              <form onSubmit={handleCreateWorker} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Vardas *
                    </label>
                    <input
                      type="text"
                      name="vardas"
                      value={workerForm.vardas}
                      onChange={handleWorkerFormChange}
                      disabled={workerLoading}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Pavardė *
                    </label>
                    <input
                      type="text"
                      name="pavarde"
                      value={workerForm.pavarde}
                      onChange={handleWorkerFormChange}
                      disabled={workerLoading}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pareigos *
                  </label>
                  <select
                    name="role"
                    value={workerForm.role}
                    onChange={handleWorkerFormChange}
                    disabled={workerLoading}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                  >
                    <option value="Vairuotojas">Vairuotojas</option>
                    <option value="Kontrolierius">Kontrolierius</option>
                    <option value="Administratorius">Administratorius</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Naudotojo vardas *
                  </label>
                  <input
                    type="text"
                    name="slapyvardis"
                    value={workerForm.slapyvardis}
                    onChange={handleWorkerFormChange}
                    disabled={workerLoading}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                    placeholder="Min. 3 simboliai"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Slaptažodis *
                    </label>
                    <input
                      type="password"
                      name="slaptazodis"
                      value={workerForm.slaptazodis}
                      onChange={handleWorkerFormChange}
                      disabled={workerLoading}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                      placeholder="Min. 6 simboliai"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Pakartokite slaptažodį *
                    </label>
                    <input
                      type="password"
                      name="slaptazodisRepeat"
                      value={workerForm.slaptazodisRepeat}
                      onChange={handleWorkerFormChange}
                      disabled={workerLoading}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      El. paštas
                    </label>
                    <input
                      type="email"
                      name="elPastas"
                      value={workerForm.elPastas}
                      onChange={handleWorkerFormChange}
                      disabled={workerLoading}
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
                      value={workerForm.miestas}
                      onChange={handleWorkerFormChange}
                      disabled={workerLoading}
                      className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Gimimo data
                  </label>
                  <input
                    type="date"
                    name="gimimoData"
                    value={workerForm.gimimoData}
                    onChange={handleWorkerFormChange}
                    disabled={workerLoading}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                  />
                </div>

                {/* Driver-specific fields */}
                {workerForm.role === "Vairuotojas" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm font-medium text-blue-900 mb-3">Vairuotojo duomenys</p>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Vairavimo stažas (metais)
                      </label>
                      <input
                        type="number"
                        name="vairavimosStazas"
                        value={workerForm.vairavimosStazas}
                        onChange={handleWorkerFormChange}
                        disabled={workerLoading}
                        className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                        placeholder="0"
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={workerLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 font-medium transition"
                >
                  {workerLoading ? "Kuriama..." : "Sukurti darbuotojo paskyrą"}
                </button>
              </form>

                        {/* Workers List */}
                        <div className="mt-10 w-full">
                          <h3 className="text-lg font-bold mb-4">Darbuotojų sąrašas</h3>
                          <div className="overflow-x-auto w-full">
                            <table className="min-w-full w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Vardas
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Pavardė
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Naudotojo vardas
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Pareigos
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    El. paštas
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Veiksmai
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {workers.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                      Nėra darbuotojų
                                    </td>
                                  </tr>
                                ) : (
                                  workers.map((worker) => (
                                    <tr key={worker.idNaudotojas} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {worker.vardas}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {worker.pavarde}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {worker.slapyvardis}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {editingWorker?.idNaudotojas === worker.idNaudotojas ? (
                                          <select
                                            value={editingWorkerRole}
                                            onChange={(e) => setEditingWorkerRole(e.target.value)}
                                            className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                                          >
                                            <option value="Vairuotojas">Vairuotojas</option>
                                            <option value="Kontrolierius">Kontrolierius</option>
                                            <option value="Administratorius">Administratorius</option>
                                          </select>
                                        ) : (
                                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${roleBadgeClass(worker.role)}`}>
                                            {worker.role}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {worker.elPastas || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        {editingWorker?.idNaudotojas === worker.idNaudotojas ? (
                                          <>
                                            <button
                                              onClick={() => handleUpdateWorkerRole(worker.idNaudotojas, editingWorkerRole)}
                                              className="text-green-600 hover:text-green-900 font-medium"
                                            >
                                              Išsaugoti
                                            </button>
                                            <button
                                              onClick={() => setEditingWorker(null)}
                                              className="text-gray-600 hover:text-gray-900 font-medium"
                                            >
                                              Atšaukti
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => {
                                                setEditingWorker(worker);
                                                setEditingWorkerRole(worker.role);
                                              }}
                                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                                            >
                                              Redaguoti
                                            </button>
                                            <button
                                              onClick={() => handleDeleteWorker(worker.idNaudotojas)}
                                              className="text-red-600 hover:text-red-900 font-medium"
                                            >
                                              Ištrinti
                                            </button>
                                          </>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
            </div>
          </div>
        )}

        {/* DISCOUNTS TAB */}
        {activeTab === "discounts" && (
          <div className="bg-white shadow rounded-lg">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Nuolaidų valdymas</h2>
              {editingDiscount && (
                <button
                  onClick={() => {
                    setEditingDiscount(null);
                    setDiscountForm({ name: "", percent: 0 });
                  }}
                  className="text-sm text-slate-600 underline"
                >
                  Atšaukti
                </button>
              )}
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-2">
            <div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pavadinimas
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      %
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veiksmai
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discounts.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm">{d.name}</td>
                      <td className="px-4 py-2 text-sm">{d.percent}%</td>
                      <td className="px-4 py-2 text-sm space-x-2">
                        <button onClick={() => { setEditingDiscount(d); setDiscountForm({ name: d.name, percent: d.percent }); }} className="text-indigo-600">
                          Redaguoti
                        </button>
                        <button onClick={() => setDiscounts(prev => prev.filter(x => x.id !== d.id))} className="text-red-600">
                          Ištrinti
                        </button>
                      </td>
                    </tr>
                  ))}
                  {discounts.length === 0 && (
                    <tr>
                      <td className="px-4 py-2 text-sm text-slate-500" colSpan={3}>
                        Nėra nuolaidų.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-sm font-semibold mb-3">
                {editingDiscount ? "Redaguoti nuolaidą" : "Nauja nuolaida"}
              </h3>
              <form onSubmit={handleDiscountSubmit} className="space-y-3">
                <div>
                    <label className="block text-sm mb-1">Pavadinimas</label>
                    <input
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={discountForm.name}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                </div>
                <div>
                    <label className="block text-sm mb-1">Nuolaidos dydis (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={discountForm.percent}
                      onChange={(e) => setDiscountForm(prev => ({ ...prev, percent: Number(e.target.value) }))}
                      required
                    />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
                  {editingDiscount ? "Išsaugoti" : "Pridėti"}
                </button>
              </form>
            </div>
          </div>
          </div>
        )}

        {/* PRICES TAB */}
        {activeTab === "prices" && (
          <div className="bg-white shadow rounded-lg p-6 space-y-4 mb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Bilietų kainos</h2>
              {editingPrice && (
                <button
                  onClick={() => {
                    setEditingPrice(null);
                    setPriceForm({ name: "", basePrice: 0 });
                  }}
                  className="text-sm text-slate-600 underline"
                >
                  Atšaukti
                </button>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
            <div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pavadinimas
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kaina
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veiksmai
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ticketPrices.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-sm">{p.name}</td>
                      <td className="px-4 py-2 text-sm">€{p.basePrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm space-x-2">
                        <button onClick={() => { setEditingPrice(p); setPriceForm({ name: p.name, basePrice: p.basePrice }); }} className="text-indigo-600">
                          Redaguoti
                        </button>
                        <button onClick={() => setTicketPrices(prev => prev.filter(x => x.id !== p.id))} className="text-red-600">
                          Ištrinti
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ticketPrices.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm text-slate-500">
                        Nėra kainų.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <h3 className="text-sm font-semibold mb-3">
                {editingPrice ? "Redaguoti kainą" : "Nauja kaina"}
              </h3>
              <form onSubmit={handlePriceSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Pavadinimas</label>
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={priceForm.name}
                    onChange={(e) => setPriceForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Kaina (€)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={priceForm.basePrice}
                    onChange={(e) => setPriceForm(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                    required
                  />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">
                  {editingPrice ? "Išsaugoti" : "Pridėti"}
                </button>
              </form>
            </div>
          </div>
          </div>
        )}

        {/* Statistics & Reports Tab */}
        {activeTab === "statistics" && (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-6">Statistika ir ataskaitos</h2>
            
            {/* Statistics Navigation */}
            <div className="bg-white shadow-md rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800 text-center">
                Pasirinkite statistikos tipą
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  to="/admin/routes/stats"
                  className="bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-colors text-center font-medium shadow-sm"
                >
                  Maršrutų statistika
                </Link>
                <button
                  className="bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition-colors text-center font-medium shadow-sm"
                  disabled
                >
                  Bilietų statistika
                  <span className="block text-xs mt-1 opacity-75">(Netrukus)</span>
                </button>
                <Link
                  to="/admin/fuel-stats"
                  className="bg-orange-600 text-white px-6 py-4 rounded-xl hover:bg-orange-700 transition-colors text-center font-medium shadow-sm"
                >
                  Kuro sąnaudų statistika
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
