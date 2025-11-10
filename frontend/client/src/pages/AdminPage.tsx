// src/pages/AdminPage.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const AdminPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

      <div className="container mx-auto px-4 py-10 space-y-8">
        {/* Routes Management Section */}
        <div className="bg-white shadow-md rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            Maršrutų valdymas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
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
            <Link
              to="/admin/routes/stats"
              className="bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-colors text-center font-medium shadow-sm w-full"
            >
              Statistika ir ataskaitos
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
            <button
              className="bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Transporto priemonės
            </button>
            <Link
              to="/admin/routes/schedules"
              className="bg-pink-600 text-white px-6 py-4 rounded-lg hover:bg-pink-700 transition font-medium text-center"
            >
              Tvarkaraščiai
            </Link>
          </div>
        </div>
        {/* nuolaidos */}
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

        {/* statistika */}
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

        {/* kainos */}
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
      </div>
    </div>
  );
};

export default AdminPage;
