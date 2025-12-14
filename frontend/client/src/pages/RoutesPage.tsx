import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Stop, routesService } from "../services/RoutesService";

const RoutesPage: React.FC = () => {
  const navigate = useNavigate();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFromStop, setSelectedFromStop] = useState("");
  const [selectedToStop, setSelectedToStop] = useState("");

  const stopTypeLt = (tipas?: string) => {
    switch (tipas) {
      case "Pradzios":
        return "Pradžios";
      case "Tarpine":
        return "Tarpinė";
      case "Pabaigos":
        return "Pabaigos";
      default:
        return tipas ?? "-";
    }
  };
  
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Safe normalization helper: handles number/null/undefined
  const norm = useCallback((v: unknown) => (v ?? "").toString().toLowerCase(), []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [routesData, stopsData] = await Promise.all([
        routesService.getAll(),
        routesService.getAllStops(),
      ]);

      setRoutes(routesData);
      setStops(stopsData);
    } catch (err: any) {
      setError(err?.message ?? "Įvyko klaida kraunant duomenis.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter routes based on search and stop selection (derived, not state)
  const filteredRoutes = useMemo(() => {
    let filtered = routes;

    const q = norm(searchTerm.trim());

    // Text search
    if (q) {
      filtered = filtered.filter((route) => {
        return (
          norm(route.numeris).includes(q) ||
          norm(route.pavadinimas).includes(q) ||
          norm(route.pradziosStotele).includes(q) ||
          norm(route.pabaigosStotele).includes(q)
        );
      });
    }

    // Filter by "from" stop
    if (selectedFromStop) {
      filtered = filtered.filter(
        (route) =>
          route.pradziosStotele === selectedFromStop ||
          (route.stoteles ?? []).some((s) => s.stotelesPavadinimas === selectedFromStop)
      );
    }

    // Filter by "to" stop
    if (selectedToStop) {
      filtered = filtered.filter(
        (route) =>
          route.pabaigosStotele === selectedToStop ||
          (route.stoteles ?? []).some((s) => s.stotelesPavadinimas === selectedToStop)
      );
    }

    return filtered;
  }, [routes, searchTerm, selectedFromStop, selectedToStop, norm]);

  const handleViewDetails = useCallback(async (numeris: number | string) => {
    try {
      const route = await routesService.getOne(String(numeris));
      setSelectedRoute(route);
    } catch (err: any) {
      alert(err?.message ?? "Nepavyko gauti maršruto detalių.");
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedFromStop("");
    setSelectedToStop("");
  }, []);

  const sortedSelectedStops = useMemo(() => {
    if (!selectedRoute?.stoteles?.length) return [];
    return selectedRoute.stoteles.slice().sort((a, b) => a.eilesNr - b.eilesNr);
  }, [selectedRoute]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/passenger")}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm"
          >
            ← Atgal
          </button>
          <h1 className="text-2xl font-bold">Maršrutai</h1>
        </div>
        <button
          onClick={loadData}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm"
        >
          Atnaujinti
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        <h2 className="text-lg font-semibold mb-4">Paieška ir filtravimas</h2>

        {/* Text Search */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Ieškoti pagal pavadinimą ar numerį
          </label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Įveskite maršruto numerį arba pavadinimą..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Stop Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Iš stotelės</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={selectedFromStop}
              onChange={(e) => setSelectedFromStop(e.target.value)}
            >
              <option value="">Visos stotelės</option>
              {stops.map((stop) => (
                <option key={stop.pavadinimas} value={stop.pavadinimas}>
                  {stop.pavadinimas}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Į stotelę</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={selectedToStop}
              onChange={(e) => setSelectedToStop(e.target.value)}
            >
              <option value="">Visos stotelės</option>
              {stops.map((stop) => (
                <option key={stop.pavadinimas} value={stop.pavadinimas}>
                  {stop.pavadinimas}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedFromStop || selectedToStop) && (
          <button
            onClick={handleClearFilters}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm"
          >
            Išvalyti filtrus
          </button>
        )}
      </div>

      {/* Routes List */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Routes list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Rasti maršrutai ({filteredRoutes.length})</h2>
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-500">Kraunama...</p>
          ) : error ? (
            <p className="p-6 text-sm text-red-500">{error}</p>
          ) : filteredRoutes.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              Maršrutų nerasta. Pabandykite pakeisti paieškos kriterijus.
            </p>
          ) : (
            <ul className="divide-y max-h-[600px] overflow-y-auto">
              {filteredRoutes.map((route) => (
                <li key={String(route.numeris)} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-lg font-semibold text-blue-600">
                        {route.numeris}
                      </span>
                      <h3 className="font-medium text-slate-800">{route.pavadinimas}</h3>
                    </div>
                    <button
                      onClick={() => handleViewDetails(route.numeris)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Detaliau
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Pradžia:</span> {route.pradziosStotele}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Pabaiga:</span> {route.pabaigosStotele}
                  </p>

                  {route.bendrasAtstumas !== null && route.bendrasAtstumas !== undefined && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Atstumas:</span>{" "}
                      {Number(route.bendrasAtstumas).toFixed(1)} km
                    </p>
                  )}

                  {(route.stoteles?.length ?? 0) > 0 && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Stotelės:</span> {route.stoteles!.length}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Route details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Maršruto detalės</h2>

          {!selectedRoute ? (
            <p className="text-sm text-slate-500">Pasirinkite maršrutą iš sąrašo</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-2xl font-semibold text-blue-600">
                  {selectedRoute.numeris}
                </h3>
                <p className="text-lg font-medium text-slate-800">{selectedRoute.pavadinimas}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Pradžios stotelė</p>
                  <p className="font-medium">{selectedRoute.pradziosStotele}</p>
                </div>
                <div>
                  <p className="text-slate-500">Pabaigos stotelė</p>
                  <p className="font-medium">{selectedRoute.pabaigosStotele}</p>
                </div>

                {selectedRoute.bendrasAtstumas !== null &&
                  selectedRoute.bendrasAtstumas !== undefined && (
                    <div>
                      <p className="text-slate-500">Bendras atstumas</p>
                      <p className="font-medium">
                        {Number(selectedRoute.bendrasAtstumas).toFixed(1)} km
                      </p>
                    </div>
                  )}
              </div>

              {/* Stops */}
              {sortedSelectedStops.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tarpinės stotelės ({sortedSelectedStops.length})</h4>
                  <ol className="space-y-2">
                    {sortedSelectedStops.map((stop) => (
                      <li key={stop.id} className="flex items-center gap-3 text-sm">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                          {stop.eilesNr}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{stop.stotelesPavadinimas}</p>
                          {stop.atstumasNuoPradzios !== null &&
                            stop.atstumasNuoPradzios !== undefined && (
                              <p className="text-xs text-slate-500">
                                {Number(stop.atstumasNuoPradzios).toFixed(1)} km nuo pradžios
                              </p>
                            )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutesPage;
