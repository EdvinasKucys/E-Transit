import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routesService, Route, Stop } from "../services/RoutesService";

interface RouteStats {
  totalRoutes: number;
  totalStops: number;
  totalDistance: number;
  averageDistance: number;
  averageStopsPerRoute: number;
  longestRoute: Route | null;
  shortestRoute: Route | null;
  mostUsedStop: { name: string; count: number } | null;
  leastUsedStop: { name: string; count: number } | null;
  routesByLength: { short: number; medium: number; long: number };
  stopsByType: { pradzios: number; tarpine: number; pabaigos: number };
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

  const calculateStats = (routes: Route[], stops: Stop[]) => {
    if (routes.length === 0) {
      setStats(null);
      return;
    }

    // Basic stats
    const totalRoutes = routes.length;
    const totalStops = stops.length;

    // Total and average distance
    const routesWithDistance = routes.filter((r) => r.bendrasAtstumas && r.bendrasAtstumas > 0);
    const totalDistance = routesWithDistance.reduce((sum, r) => sum + (r.bendrasAtstumas || 0), 0);
    const averageDistance = routesWithDistance.length > 0 ? totalDistance / routesWithDistance.length : 0;

    // Average stops per route
    const totalStopsInRoutes = routes.reduce((sum, r) => sum + (r.stoteles?.length || 0), 0);
    const averageStopsPerRoute = totalRoutes > 0 ? totalStopsInRoutes / totalRoutes : 0;

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

    // Stop usage statistics
    const stopUsage: Record<string, number> = {};
    routes.forEach((route) => {
      const allStops = new Set([
        route.pradziosStotele,
        route.pabaigosStotele,
        ...(route.stoteles?.map((s) => s.stotelesPavadinimas) || []),
      ]);
      allStops.forEach((stopName) => {
        stopUsage[stopName] = (stopUsage[stopName] || 0) + 1;
      });
    });

    let mostUsedStop: { name: string; count: number } | null = null;
    let leastUsedStop: { name: string; count: number } | null = null;

    Object.entries(stopUsage).forEach(([name, count]) => {
      if (!mostUsedStop || count > mostUsedStop.count) {
        mostUsedStop = { name, count };
      }
      if (!leastUsedStop || count < leastUsedStop.count) {
        leastUsedStop = { name, count };
      }
    });

    // Routes by length category
    const routesByLength = {
      short: routesWithDistance.filter((r) => (r.bendrasAtstumas || 0) < 5).length,
      medium: routesWithDistance.filter(
        (r) => (r.bendrasAtstumas || 0) >= 5 && (r.bendrasAtstumas || 0) < 15
      ).length,
      long: routesWithDistance.filter((r) => (r.bendrasAtstumas || 0) >= 15).length,
    };

    // Stops by type
    const stopsByType = {
      pradzios: stops.filter((s) => s.tipas === "Pradzios").length,
      tarpine: stops.filter((s) => s.tipas === "Tarpine").length,
      pabaigos: stops.filter((s) => s.tipas === "Pabaigos").length,
    };

    setStats({
      totalRoutes,
      totalStops,
      totalDistance,
      averageDistance,
      averageStopsPerRoute,
      longestRoute,
      shortestRoute,
      mostUsedStop,
      leastUsedStop,
      routesByLength,
      stopsByType,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const exportToCSV = () => {
    if (!stats) return;

    let csv = "\uFEFF"; // UTF-8 BOM for proper encoding
    csv += "Maršrutų Statistikos Ataskaita\n";
    csv += `Sugeneruota: ${new Date().toLocaleString('lt-LT')}\n\n`;

    // Overview statistics
    csv += "BENDRI RODIKLIAI\n";
    csv += "Rodiklis,Reikšmė\n";
    csv += `Iš viso maršrutų,${stats.totalRoutes}\n`;
    csv += `Iš viso stotelių,${stats.totalStops}\n`;
    csv += `Bendras atstumas,${stats.totalDistance.toFixed(2)} km\n`;
    csv += `Vidutinis maršruto atstumas,${stats.averageDistance.toFixed(2)} km\n`;
    csv += `Vidutinis stotelių skaičius maršrute,${stats.averageStopsPerRoute.toFixed(1)}\n\n`;

    // Extremes
    csv += "REKORDAI\n";
    csv += "Kategorija,Maršrutas,Reikšmė\n";
    csv += `Ilgiausias maršrutas,${stats.longestRoute?.numeris || "-"} - ${stats.longestRoute?.pavadinimas || "-"},${stats.longestRoute?.bendrasAtstumas?.toFixed(1) || "-"} km\n`;
    csv += `Trumpiausias maršrutas,${stats.shortestRoute?.numeris || "-"} - ${stats.shortestRoute?.pavadinimas || "-"},${stats.shortestRoute?.bendrasAtstumas?.toFixed(1) || "-"} km\n`;
    csv += `Populiariausia stotelė,${stats.mostUsedStop?.name || "-"},${stats.mostUsedStop?.count || 0} maršrutuose\n`;
    csv += `Mažiausiai naudojama stotelė,${stats.leastUsedStop?.name || "-"},${stats.leastUsedStop?.count || 0} maršrutuose\n\n`;

    // Routes by length
    csv += "MARŠRUTAI PAGAL ILGĮ\n";
    csv += "Kategorija,Skaičius,Procentas\n";
    csv += `Trumpi (<5 km),${stats.routesByLength.short},${((stats.routesByLength.short / stats.totalRoutes) * 100).toFixed(1)}%\n`;
    csv += `Vidutiniai (5-15 km),${stats.routesByLength.medium},${((stats.routesByLength.medium / stats.totalRoutes) * 100).toFixed(1)}%\n`;
    csv += `Ilgi (>15 km),${stats.routesByLength.long},${((stats.routesByLength.long / stats.totalRoutes) * 100).toFixed(1)}%\n\n`;

    // Stops by type
    csv += "STOTELĖS PAGAL TIPĄ\n";
    csv += "Tipas,Skaičius,Procentas\n";
    csv += `Pradžios,${stats.stopsByType.pradzios},${((stats.stopsByType.pradzios / stats.totalStops) * 100).toFixed(1)}%\n`;
    csv += `Tarpinės,${stats.stopsByType.tarpine},${((stats.stopsByType.tarpine / stats.totalStops) * 100).toFixed(1)}%\n`;
    csv += `Pabaigos,${stats.stopsByType.pabaigos},${((stats.stopsByType.pabaigos / stats.totalStops) * 100).toFixed(1)}%\n\n`;

    // Routes list
    csv += "MARŠRUTŲ SĄRAŠAS\n";
    csv += "Numeris,Pavadinimas,Pradžia,Pabaiga,Atstumas (km),Stotelių sk.,Sukurta\n";
    routes.forEach((route) => {
      csv += `${route.numeris},`;
      csv += `"${route.pavadinimas}",`;
      csv += `"${route.pradziosStotele}",`;
      csv += `"${route.pabaigosStotele}",`;
      csv += `${route.bendrasAtstumas?.toFixed(1) || "-"},`;
      csv += `${route.stoteles?.length || 0},`;
      csv += `${new Date(route.sukurimoData).toLocaleDateString('lt-LT')}\n`;
    });

    // Stops list
    csv += "\nSTOTELIŲ SĄRAŠAS\n";
    csv += "Pavadinimas,Adresas,Tipas,Koordinatės X,Koordinatės Y\n";
    stops.forEach((stop) => {
      csv += `"${stop.pavadinimas}",`;
      csv += `"${stop.adresas}",`;
      csv += `${stop.tipas},`;
      csv += `${stop.koordinatesX},`;
      csv += `${stop.koordinatesY}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `marsrutu_statistika_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!stats) return;

    // Create a formatted HTML document for printing/PDF
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Prašome leisti iššokančius langus PDF eksportavimui");
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Maršrutų Statistikos Ataskaita</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #4b5563; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
    .stat-label { color: #6b7280; font-size: 14px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background-color: #f3f4f6; padding: 12px; text-align: left; border: 1px solid #e5e7eb; }
    td { padding: 10px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .footer { margin-top: 40px; color: #6b7280; font-size: 12px; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>Maršrutų Statistikos Ataskaita</h1>
  <p><strong>Sugeneruota:</strong> ${new Date().toLocaleString('lt-LT')}</p>
  
  <h2>Bendri Rodikliai</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Iš viso maršrutų</div>
      <div class="stat-value">${stats.totalRoutes}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Iš viso stotelių</div>
      <div class="stat-value">${stats.totalStops}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Bendras atstumas</div>
      <div class="stat-value">${stats.totalDistance.toFixed(1)} km</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Vidutinis atstumas</div>
      <div class="stat-value">${stats.averageDistance.toFixed(1)} km</div>
    </div>
  </div>

  <h2>Rekordai</h2>
  <table>
    <tr>
      <th>Kategorija</th>
      <th>Maršrutas</th>
      <th>Reikšmė</th>
    </tr>
    <tr>
      <td>Ilgiausias maršrutas</td>
      <td>${stats.longestRoute?.numeris || "-"} - ${stats.longestRoute?.pavadinimas || "-"}</td>
      <td>${stats.longestRoute?.bendrasAtstumas?.toFixed(1) || "-"} km</td>
    </tr>
    <tr>
      <td>Trumpiausias maršrutas</td>
      <td>${stats.shortestRoute?.numeris || "-"} - ${stats.shortestRoute?.pavadinimas || "-"}</td>
      <td>${stats.shortestRoute?.bendrasAtstumas?.toFixed(1) || "-"} km</td>
    </tr>
    <tr>
      <td>Populiariausia stotelė</td>
      <td>${stats.mostUsedStop?.name || "-"}</td>
      <td>${stats.mostUsedStop?.count || 0} maršrutuose</td>
    </tr>
  </table>

  <h2>Maršrutai Pagal Ilgį</h2>
  <table>
    <tr>
      <th>Kategorija</th>
      <th>Skaičius</th>
      <th>Procentas</th>
    </tr>
    <tr>
      <td>Trumpi (&lt;5 km)</td>
      <td>${stats.routesByLength.short}</td>
      <td>${((stats.routesByLength.short / stats.totalRoutes) * 100).toFixed(1)}%</td>
    </tr>
    <tr>
      <td>Vidutiniai (5-15 km)</td>
      <td>${stats.routesByLength.medium}</td>
      <td>${((stats.routesByLength.medium / stats.totalRoutes) * 100).toFixed(1)}%</td>
    </tr>
    <tr>
      <td>Ilgi (&gt;15 km)</td>
      <td>${stats.routesByLength.long}</td>
      <td>${((stats.routesByLength.long / stats.totalRoutes) * 100).toFixed(1)}%</td>
    </tr>
  </table>

  <h2>Maršrutų Sąrašas</h2>
  <table>
    <tr>
      <th>Numeris</th>
      <th>Pavadinimas</th>
      <th>Pradžia</th>
      <th>Pabaiga</th>
      <th>Atstumas</th>
      <th>Stotelės</th>
    </tr>
    ${routes.map(route => `
    <tr>
      <td>${route.numeris}</td>
      <td>${route.pavadinimas}</td>
      <td>${route.pradziosStotele}</td>
      <td>${route.pabaigosStotele}</td>
      <td>${route.bendrasAtstumas?.toFixed(1) || "-"} km</td>
      <td>${route.stoteles?.length || 0}</td>
    </tr>
    `).join('')}
  </table>

  <div class="footer">
    <p>E-Transit Maršrutų Valdymo Sistema • Ataskaita sugeneruota automatiškai</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
                onClick={exportToCSV}
                disabled={!stats}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 flex items-center gap-2"
              >
                <span>📊</span> Eksportuoti CSV/Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={!stats}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 flex items-center gap-2"
              >
                <span>📄</span> Eksportuoti PDF
              </button>
              <button
                onClick={loadData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                🔄 Atnaujinti
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Iš viso maršrutų</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalRoutes}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Iš viso stotelių</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalStops}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Bendras atstumas</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.totalDistance.toFixed(1)} km
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Vidutinis atstumas</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.averageDistance.toFixed(1)} km
                </p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Vid. stotelių skaičius</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {stats.averageStopsPerRoute.toFixed(1)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Populiariausia stotelė</p>
                <p className="text-lg font-bold text-pink-600">
                  {stats.mostUsedStop?.name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.mostUsedStop?.count || 0} maršrutuose
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Mažiausiai naudojama</p>
                <p className="text-lg font-bold text-slate-600">
                  {stats.leastUsedStop?.name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.leastUsedStop?.count || 0} maršrutuose
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
                          {stats.longestRoute.bendrasAtstumas?.toFixed(1)} km •{" "}
                          {stats.longestRoute.stoteles?.length || 0} stotelės
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
                          {stats.shortestRoute.bendrasAtstumas?.toFixed(1)} km •{" "}
                          {stats.shortestRoute.stoteles?.length || 0} stotelės
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
                    <span className="font-bold text-blue-600">
                      {stats.routesByLength.short} (
                      {((stats.routesByLength.short / stats.totalRoutes) * 100).toFixed(0)}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(stats.routesByLength.short / stats.totalRoutes) * 100}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vidutiniai (5-15 km)</span>
                    <span className="font-bold text-green-600">
                      {stats.routesByLength.medium} (
                      {((stats.routesByLength.medium / stats.totalRoutes) * 100).toFixed(0)}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(stats.routesByLength.medium / stats.totalRoutes) * 100}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ilgi (&gt; 15 km)</span>
                    <span className="font-bold text-purple-600">
                      {stats.routesByLength.long} (
                      {((stats.routesByLength.long / stats.totalRoutes) * 100).toFixed(0)}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(stats.routesByLength.long / stats.totalRoutes) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stops by Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Stotelės pagal tipą</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded">
                  <p className="text-sm text-slate-500">Pradžios</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.stopsByType.pradzios}</p>
                  <p className="text-xs text-slate-500">
                    {((stats.stopsByType.pradzios / stats.totalStops) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <p className="text-sm text-slate-500">Tarpinės</p>
                  <p className="text-3xl font-bold text-green-600">{stats.stopsByType.tarpine}</p>
                  <p className="text-xs text-slate-500">
                    {((stats.stopsByType.tarpine / stats.totalStops) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded">
                  <p className="text-sm text-slate-500">Pabaigos</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.stopsByType.pabaigos}</p>
                  <p className="text-xs text-slate-500">
                    {((stats.stopsByType.pabaigos / stats.totalStops) * 100).toFixed(1)}%
                  </p>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sukurta
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {routes.map((route) => (
                      <tr key={route.numeris} className="hover:bg-slate-50">
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
                        <td className="px-6 py-4 text-sm">
                          {new Date(route.sukurimoData).toLocaleDateString("lt-LT")}
                        </td>
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