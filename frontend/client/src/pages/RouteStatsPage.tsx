import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routesService, Route, Stop } from "../services/RoutesService";

interface RouteStats {
  totalRoutes: number;
  totalStops: number;
  averageDistance: number;
  longestRoute: Route | null;
  shortestRoute: Route | null;
  mostUsedStop: { name: string; count: number } | null;
  routesByLength: { short: number; medium: number; long: number };
}

const RouteStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [routesData, stopsData] = await Promise.all([
        routesService.getAll(),
        routesService.getAllStops(),
      ]);
      setRoutes(routesData);
      setStops(stopsData);
      calculateStats(routesData, stopsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (routes: Route[], stops: Stop[]) => {
    if (routes.length === 0) {
      setStats(null);
      return;
    }

    // Basic stats
    const totalRoutes = routes.length;
    const totalStops = stops.length;

    // Average distance
    const routesWithDistance = routes.filter((r) => r.bendrasAtstumas);
    const averageDistance =
      routesWithDistance.length > 0
        ? routesWithDistance.reduce((sum, r) => sum + (r.bendrasAtstumas || 0), 0) /
          routesWithDistance.length
        : 0;

    // Longest and shortest routes
    let longestRoute: Route | null = null;
    let shortestRoute: Route | null = null;

    if (routesWithDistance.length > 0) {
      longestRoute = routesWithDistance.reduce((prev, current) =>
        (current.bendrasAtstumas || 0) > (prev.bendrasAtstumas || 0) ? current : prev
      );
      shortestRoute = routesWithDistance.reduce((prev, current) =>
        (current.bendrasAtstumas || 0) < (prev.bendrasAtstumas || 0) ? current : prev
      );
    }

    // Most used stop (appears in most routes)
    const stopUsage: Record<string, number> = {};
    routes.forEach((route) => {
      const allStops = [
        route.pradziosStotele,
        route.pabaigosStotele,
        ...(route.stoteles?.map((s) => s.stotelesPavadinimas) || []),
      ];
      allStops.forEach((stopName) => {
        stopUsage[stopName] = (stopUsage[stopName] || 0) + 1;
      });
    });

    let mostUsedStop: { name: string; count: number } | null = null;
    Object.entries(stopUsage).forEach(([name, count]) => {
      if (!mostUsedStop || count > mostUsedStop.count) {
        mostUsedStop = { name, count };
      }
    });

    // Routes by length category
    const routesByLength = {
      short: routesWithDistance.filter((r) => (r.bendrasAtstumas || 0) < 5).length,
      medium: routesWithDistance.filter(
        (r) => (r.bendrasAtstumas || 0) >= 5 && (r.bendrasAtstumas || 0) < 10
      ).length,
      long: routesWithDistance.filter((r) => (r.bendrasAtstumas || 0) >= 10).length,
    };

    setStats({
      totalRoutes,
      totalStops,
      averageDistance,
      longestRoute,
      shortestRoute,
      mostUsedStop,
      routesByLength,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportToPDF = () => {
    alert("PDF eksportavimas: Ši funkcija būtų įgyvendinta naudojant biblioteką kaip jsPDF");
    // Implementation would use jsPDF library
  };

  const exportToExcel = () => {
    if (!stats) return;

    // Simple CSV export (can be opened in Excel)
    let csv = "Maršrutų statistika\n\n";
    csv += "Rodiklis,Reikšmė\n";
    csv += `Iš viso maršrutų,${stats.totalRoutes}\n`;
    csv += `Iš viso stotelių,${stats.totalStops}\n`;
    csv += `Vidutinis atstumas,${stats.averageDistance.toFixed(2)} km\n`;
    csv += `Ilgiausias maršrutas,${stats.longestRoute?.numeris || "-"} (${
      stats.longestRoute?.bendrasAtstumas?.toFixed(1) || "-"
    } km)\n`;
    csv += `Trumpiausias maršrutas,${stats.shortestRoute?.numeris || "-"} (${
      stats.shortestRoute?.bendrasAtstumas?.toFixed(1) || "-"
    } km)\n`;
    csv += `Populiariausia stotelė,${stats.mostUsedStop?.name || "-"} (${
      stats.mostUsedStop?.count || 0
    } maršrutuose)\n`;
    csv += `\nMaršrutai pagal ilgį\n`;
    csv += `Trumpi (<5 km),${stats.routesByLength.short}\n`;
    csv += `Vidutiniai (5-10 km),${stats.routesByLength.medium}\n`;
    csv += `Ilgi (>10 km),${stats.routesByLength.long}\n`;

    csv += `\n\nMaršrutų sąrašas\n`;
    csv += `Numeris,Pavadinimas,Pradžia,Pabaiga,Atstumas (km),Stotelių sk.\n`;
    routes.forEach((route) => {
      csv += `${route.numeris},${route.pavadinimas},${route.pradziosStotele},${
        route.pabaigosStotele
      },${route.bendrasAtstumas?.toFixed(1) || "-"},${route.stoteles?.length || 0}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `marsrutu_statistika_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm"
              >
                ← Atgal
              </button>
              <h1 className="text-2xl font-bold">Maršrutų statistika ir ataskaitos</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                disabled={!stats}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                📊 Eksportuoti CSV/Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={!stats}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                📄 Eksportuoti PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <p className="text-center text-slate-500">Kraunama...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : !stats ? (
          <p className="text-center text-slate-500">Nėra duomenų statistikai</p>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Iš viso maršrutų</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalRoutes}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Iš viso stotelių</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalStops}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Vidutinis atstumas</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.averageDistance.toFixed(1)} km
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Populiariausia stotelė</p>
                <p className="text-lg font-bold text-orange-600">
                  {stats.mostUsedStop?.name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.mostUsedStop?.count || 0} maršrutuose
                </p>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Longest and Shortest Routes */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Maršrutų rekordsmenai</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Ilgiausias maršrutas</p>
                    {stats.longestRoute ? (
                      <div className="bg-green-50 p-3 rounded">
                        <p className="font-mono text-lg font-semibold text-green-700">
                          {stats.longestRoute.numeris}
                        </p>
                        <p className="text-sm">{stats.longestRoute.pavadinimas}</p>
                        <p className="text-sm text-slate-600">
                          {stats.longestRoute.bendrasAtstumas?.toFixed(1)} km
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Nėra duomenų</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Trumpiausias maršrutas</p>
                    {stats.shortestRoute ? (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-mono text-lg font-semibold text-blue-700">
                          {stats.shortestRoute.numeris}
                        </p>
                        <p className="text-sm">{stats.shortestRoute.pavadinimas}</p>
                        <p className="text-sm text-slate-600">
                          {stats.shortestRoute.bendrasAtstumas?.toFixed(1)} km
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Nėra duomenų</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Routes by Length */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Maršrutai pagal ilgį</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trumpi (&lt; 5 km)</span>
                    <span className="font-bold text-blue-600">{stats.routesByLength.short}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.routesByLength.short / stats.totalRoutes) * 100
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vidutiniai (5-10 km)</span>
                    <span className="font-bold text-green-600">
                      {stats.routesByLength.medium}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.routesByLength.medium / stats.totalRoutes) * 100
                        }%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ilgi (&gt; 10 km)</span>
                    <span className="font-bold text-purple-600">{stats.routesByLength.long}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (stats.routesByLength.long / stats.totalRoutes) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Routes Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold">Visi maršrutai</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Numeris
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
                        Stotelės
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
                          {route.bendrasAtstumas?.toFixed(1) || "-"} km
                        </td>
                        <td className="px-6 py-4 text-sm">{route.stoteles?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RouteStatsPage;