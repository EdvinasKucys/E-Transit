import React, { useEffect, useState } from "react";
import { Route, routesService } from "../services/RoutesService";
import { useNavigate } from "react-router-dom";

const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const navigate = useNavigate();

  const loadRoutes = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await routesService.getAll(search);
      setRoutes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRoutes(searchTerm);
  };

  const handleViewDetails = async (numeris: string) => {
    try {
      const route = await routesService.getOne(numeris);
      setSelectedRoute(route);
    } catch (err: any) {
      alert(err.message);
    }
  };

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
          onClick={() => loadRoutes()}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm"
        >
          Atnaujinti
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Ieškoti maršruto (numeris, pavadinimas, stotelė...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Ieškoti
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                loadRoutes();
              }}
              className="bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300"
            >
              Valyti
            </button>
          )}
        </form>
      </div>

      {/* Routes List */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Routes list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">
              Maršrutai ({routes.length})
            </h2>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Kraunama...</p>
          ) : error ? (
            <p className="p-6 text-sm text-red-500">{error}</p>
          ) : routes.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Maršrutų nerasta.</p>
          ) : (
            <ul className="divide-y max-h-[600px] overflow-y-auto">
              {routes.map((route) => (
                <li key={route.numeris} className="px-6 py-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-lg font-semibold text-blue-600">
                        {route.numeris}
                      </span>
                      <h3 className="font-medium text-slate-800">
                        {route.pavadinimas}
                      </h3>
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
                  {route.bendrasAtstumas && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Atstumas:</span>{" "}
                      {route.bendrasAtstumas.toFixed(1)} km
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
            <p className="text-sm text-slate-500">
              Pasirinkite maršrutą iš sąrašo
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-2xl font-semibold text-blue-600">
                  {selectedRoute.numeris}
                </h3>
                <p className="text-lg font-medium text-slate-800">
                  {selectedRoute.pavadinimas}
                </p>
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
                {selectedRoute.bendrasAtstumas && (
                  <div>
                    <p className="text-slate-500">Bendras atstumas</p>
                    <p className="font-medium">
                      {selectedRoute.bendrasAtstumas.toFixed(1)} km
                    </p>
                  </div>
                )}
              </div>

              {/* Stops */}
              {selectedRoute.stoteles && selectedRoute.stoteles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">
                    Stotelės ({selectedRoute.stoteles.length})
                  </h4>
                  <ol className="space-y-2">
                    {selectedRoute.stoteles
                      .sort((a, b) => a.eilesNr - b.eilesNr)
                      .map((stop, idx) => (
                        <li
                          key={stop.id}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                            {stop.eilesNr}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{stop.stotelesPavadinimas}</p>
                            {stop.atstumasNuoPradzios !== null && (
                              <p className="text-xs text-slate-500">
                                {stop.atstumasNuoPradzios?.toFixed(1)} km nuo pradžios
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