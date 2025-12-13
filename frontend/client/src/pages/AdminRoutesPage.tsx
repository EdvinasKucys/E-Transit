import React, { useEffect, useState } from "react";
import { Route, Stop, routesService } from "../services/RoutesService";
import { useNavigate } from "react-router-dom";

const AdminRoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Create/Edit Route Form State
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState({
    numeris: "",
    pavadinimas: "",
    pradziosStotele: "",
    pabaigosStotele: "",
    bendrasAtstumas: 0,
  });
  const [routeStops, setRouteStops] = useState<
    Array<{
      stotelesPavadinimas: string;
      eilesNr: number;
      atstumasNuoPradzios: number;
    }>
  >([]);

  // Create Stop Form State
  const [showStopForm, setShowStopForm] = useState(false);
  const [stopForm, setStopForm] = useState({
    pavadinimas: "",
    adresas: "",
    koordinatesX: 0,
    koordinatesY: 0,
    tipas: "Tarpine",
  });

  const loadRoutes = async () => {
    try {
      const data = await routesService.getAll();
      setRoutes(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadStops = async () => {
    try {
      const data = await routesService.getAllStops();
      setStops(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadRoutes(), loadStops()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ===== ROUTE CRUD =====
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await routesService.create({
        ...routeForm,
        stoteles: routeStops,
      });
      setShowRouteForm(false);
      resetRouteForm();
      loadRoutes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    try {
      await routesService.update(editingRoute, {
        pavadinimas: routeForm.pavadinimas,
        pradziosStotele: routeForm.pradziosStotele,
        pabaigosStotele: routeForm.pabaigosStotele,
        bendrasAtstumas: routeForm.bendrasAtstumas,
        stoteles: routeStops,
      });
      setShowRouteForm(false);
      setEditingRoute(null);
      resetRouteForm();
      loadRoutes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditRoute = async (numeris: string) => {
    try {
      const route = await routesService.getOne(numeris);
      setEditingRoute(numeris);
      setRouteForm({
        numeris: route.numeris,
        pavadinimas: route.pavadinimas,
        pradziosStotele: route.pradziosStotele,
        pabaigosStotele: route.pabaigosStotele,
        bendrasAtstumas: route.bendrasAtstumas || 0,
      });
      setRouteStops(
        route.stoteles?.map((s) => ({
          stotelesPavadinimas: s.stotelesPavadinimas,
          eilesNr: s.eilesNr,
          atstumasNuoPradzios: s.atstumasNuoPradzios || 0,
        })) || []
      );
      setShowRouteForm(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRoute = async (numeris: string) => {
    if (!window.confirm(`Ar tikrai norite ištrinti maršrutą ${numeris}?`)) return;
    try {
      await routesService.delete(numeris);
      loadRoutes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetRouteForm = () => {
    setRouteForm({
      numeris: "",
      pavadinimas: "",
      pradziosStotele: "",
      pabaigosStotele: "",
      bendrasAtstumas: 0,
    });
    setRouteStops([]);
  };

  const addRouteStop = () => {
    const nextNum = routeStops.length + 1;
    setRouteStops([
      ...routeStops,
      { stotelesPavadinimas: "", eilesNr: nextNum, atstumasNuoPradzios: 0 },
    ]);
  };

  const removeRouteStop = (index: number) => {
    const updated = routeStops.filter((_, i) => i !== index);
    // Re-number
    updated.forEach((stop, idx) => {
      stop.eilesNr = idx + 1;
    });
    setRouteStops(updated);
  };

  const updateRouteStop = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...routeStops];
    (updated[index] as any)[field] = value;
    setRouteStops(updated);
  };

  // ===== STOP CRUD =====
  const handleCreateStop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await routesService.createStop(stopForm);
      setShowStopForm(false);
      setStopForm({
        pavadinimas: "",
        adresas: "",
        koordinatesX: 0,
        koordinatesY: 0,
        tipas: "Tarpine",
      });
      loadStops();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStop = async (pavadinimas: string) => {
    if (!window.confirm(`Ar tikrai norite ištrinti stotelę "${pavadinimas}"?`))
      return;
    try {
      await routesService.deleteStop(pavadinimas);
      loadStops();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm"
          >
            ← Atgal
          </button>
          <h1 className="text-2xl font-bold">Maršrutų valdymas (Admin)</h1>
        </div>
        <button
          onClick={loadData}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm"
        >
          Atnaujinti
        </button>
      </div>

      {/* Routes Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Maršrutai</h2>
          <button
            onClick={() => {
              setEditingRoute(null);
              resetRouteForm();
              setShowRouteForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            + Naujas maršrutas
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Kraunama...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-500">{error}</p>
        ) : routes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Maršrutų nėra.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nr.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pavadinimas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pradžia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pabaiga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Atstumas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Veiksmai
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.numeris}>
                  <td className="px-6 py-4 text-sm font-mono font-semibold">
                    {route.numeris}
                  </td>
                  <td className="px-6 py-4 text-sm">{route.pavadinimas}</td>
                  <td className="px-6 py-4 text-sm">{route.pradziosStotele}</td>
                  <td className="px-6 py-4 text-sm">{route.pabaigosStotele}</td>
                  <td className="px-6 py-4 text-sm">
                    {route.bendrasAtstumas?.toFixed(1)} km
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEditRoute(route.numeris)}
                      className="text-indigo-600 hover:underline"
                    >
                      Redaguoti
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.numeris)}
                      className="text-red-600 hover:underline"
                    >
                      Ištrinti
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Route Form Modal */}
      {showRouteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingRoute ? "Redaguoti maršrutą" : "Naujas maršrutas"}
              </h3>
              <button
                onClick={() => {
                  setShowRouteForm(false);
                  setEditingRoute(null);
                  resetRouteForm();
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={editingRoute ? handleUpdateRoute : handleCreateRoute}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Numeris *
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={routeForm.numeris}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, numeris: e.target.value })
                    }
                    disabled={!!editingRoute}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pavadinimas *
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={routeForm.pavadinimas}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, pavadinimas: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pradžios stotelė *
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={routeForm.pradziosStotele}
                    onChange={(e) =>
                      setRouteForm({
                        ...routeForm,
                        pradziosStotele: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Pasirinkite...</option>
                    {stops.map((stop) => (
                      <option key={stop.pavadinimas} value={stop.pavadinimas}>
                        {stop.pavadinimas}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pabaigos stotelė *
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={routeForm.pabaigosStotele}
                    onChange={(e) =>
                      setRouteForm({
                        ...routeForm,
                        pabaigosStotele: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Pasirinkite...</option>
                    {stops.map((stop) => (
                      <option key={stop.pavadinimas} value={stop.pavadinimas}>
                        {stop.pavadinimas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Bendras atstumas (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={routeForm.bendrasAtstumas}
                  onChange={(e) =>
                    setRouteForm({
                      ...routeForm,
                      bendrasAtstumas: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Route Stops */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Stotelės maršrute</h4>
                  <button
                    type="button"
                    onClick={addRouteStop}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                  >
                    + Pridėti stotelę
                  </button>
                </div>
                {routeStops.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Stotelių nėra. Pridėkite bent vieną.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {routeStops.map((stop, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                        <span className="w-8 text-center font-semibold text-sm">
                          {stop.eilesNr}
                        </span>
                        <select
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          value={stop.stotelesPavadinimas}
                          onChange={(e) =>
                            updateRouteStop(idx, "stotelesPavadinimas", e.target.value)
                          }
                          required
                        >
                          <option value="">Pasirinkite stotelę...</option>
                          {stops.map((s) => (
                            <option key={s.pavadinimas} value={s.pavadinimas}>
                              {s.pavadinimas}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="km"
                          className="w-24 border rounded px-2 py-1 text-sm"
                          value={stop.atstumasNuoPradzios}
                          onChange={(e) =>
                            updateRouteStop(
                              idx,
                              "atstumasNuoPradzios",
                              Number(e.target.value)
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeRouteStop(idx)}
                          className="text-red-600 hover:text-red-700 text-sm px-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRouteForm(false);
                    setEditingRoute(null);
                    resetRouteForm();
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingRoute ? "Išsaugoti" : "Sukurti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stops Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Stotelės</h2>
          <button
            onClick={() => setShowStopForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            + Nauja stotelė
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Kraunama...</p>
        ) : stops.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Stotelių nėra.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pavadinimas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Savivaldybė
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Veiksmai
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stops.map((stop) => (
                <tr key={stop.pavadinimas}>
                  <td className="px-6 py-4 text-sm font-medium">
                    {stop.pavadinimas}
                  </td>
                  <td className="px-6 py-4 text-sm">{stop.adresas}</td>
                  <td className="px-6 py-4 text-sm">{stop.tipas}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDeleteStop(stop.pavadinimas)}
                      className="text-red-600 hover:underline"
                    >
                      Ištrinti
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stop Form Modal */}
      {showStopForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nauja stotelė</h3>
              <button
                onClick={() => setShowStopForm(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStop} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pavadinimas *
                </label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={stopForm.pavadinimas}
                  onChange={(e) =>
                    setStopForm({ ...stopForm, pavadinimas: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Savivaldybė *
                </label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={stopForm.adresas}
                  onChange={(e) =>
                    setStopForm({ ...stopForm, adresas: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Koordinatės X *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={stopForm.koordinatesX}
                    onChange={(e) =>
                      setStopForm({
                        ...stopForm,
                        koordinatesX: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Koordinatės Y *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={stopForm.koordinatesY}
                    onChange={(e) =>
                      setStopForm({
                        ...stopForm,
                        koordinatesY: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipas *</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={stopForm.tipas}
                  onChange={(e) =>
                    setStopForm({ ...stopForm, tipas: e.target.value })
                  }
                  required
                >
                  <option value="Pradzios">Pradžios</option>
                  <option value="Tarpine">Tarpinė</option>
                  <option value="Pabaigos">Pabaigos</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowStopForm(false)}
                  className="px-4 py-2 border rounded-md hover:bg-slate-50"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Sukurti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutesPage;