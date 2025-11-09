import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routesService, Route, Stop } from "../services/RoutesService";

interface OptimizationResult {
  routeNumber: string;
  routeName: string;
  currentDistance: number;
  optimizedDistance: number;
  savings: number;
  savingsPercent: number;
  recommendations: string[];
}

const RouteOptimizationPage: React.FC = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, stopsData] = await Promise.all([
        routesService.getAll(),
        routesService.getAllStops(),
      ]);
      setRoutes(routesData);
      setStops(stopsData);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simplified optimization algorithm
  const optimizeRoute = (route: Route): OptimizationResult => {
    if (!route.stoteles || route.stoteles.length === 0) {
      return {
        routeNumber: route.numeris,
        routeName: route.pavadinimas,
        currentDistance: route.bendrasAtstumas || 0,
        optimizedDistance: route.bendrasAtstumas || 0,
        savings: 0,
        savingsPercent: 0,
        recommendations: ["Maršrutas neturi tarpinių stotelių"],
      };
    }

    const currentDistance = route.bendrasAtstumas || 0;
    const recommendations: string[] = [];

    // Calculate distances between consecutive stops
    const stopDistances = route.stoteles
      .sort((a, b) => a.eilesNr - b.eilesNr)
      .map((stop, index, array) => {
        if (index === 0) return 0;
        const prevStop = array[index - 1];
        return (stop.atstumasNuoPradzios || 0) - (prevStop.atstumasNuoPradzios || 0);
      });

    // Find stops that might be too close together
    const veryCloseStops = stopDistances.filter((d, i) => i > 0 && d < 0.5);
    if (veryCloseStops.length > 0) {
      recommendations.push(
        `Rasta ${veryCloseStops.length} stotelių, esančių arčiau nei 0.5 km viena nuo kitos. Apsvarstykite galimybę sujungti kai kurias stoteles.`
      );
    }

    // Find stops that might be too far apart
    const veryFarStops = stopDistances.filter((d) => d > 3);
    if (veryFarStops.length > 0) {
      recommendations.push(
        `Rasta ${veryFarStops.length} atkarpų, ilgesnių nei 3 km. Apsvarstykite galimybę pridėti tarpines stoteles.`
      );
    }

    // Check if route is efficient (not zigzagging)
    const hasBacktracking = route.stoteles.some((stop, i) => {
      if (i === 0) return false;
      const prev = route.stoteles![i - 1];
      return (stop.atstumasNuoPradzios || 0) < (prev.atstumasNuoPradzios || 0);
    });

    if (hasBacktracking) {
      recommendations.push(
        "Aptiktas galimas maršruto užsisukimas. Pakeiskite stotelių tvarką efektyvumui."
      );
    }

    // Estimate potential savings (simplified)
    let optimizedDistance = currentDistance;
    let potentialSavings = 0;

    if (veryCloseStops.length > 0) {
      potentialSavings += veryCloseStops.length * 0.3; // Assume 0.3 km saved per merge
    }

    if (hasBacktracking) {
      potentialSavings += currentDistance * 0.1; // Assume 10% savings from better routing
    }

    optimizedDistance = Math.max(currentDistance - potentialSavings, currentDistance * 0.8);

    if (recommendations.length === 0) {
      recommendations.push("Maršrutas atrodo optimaliai suplanuotas! ✓");
    }

    return {
      routeNumber: route.numeris,
      routeName: route.pavadinimas,
      currentDistance,
      optimizedDistance,
      savings: currentDistance - optimizedDistance,
      savingsPercent: ((currentDistance - optimizedDistance) / currentDistance) * 100,
      recommendations,
    };
  };

  const handleOptimizeSingle = async () => {
    if (!selectedRoute) return;

    setAnalyzing(true);
    try {
      const route = await routesService.getOne(selectedRoute);
      const result = optimizeRoute(route);
      setOptimizationResults([result]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimizeAll = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const results = routes.map((route) => optimizeRoute(route));
      setOptimizationResults(results);
      setAnalyzing(false);
    }, 1000);
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
              <h1 className="text-2xl font-bold">Maršrutų optimizavimas</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Optimization Controls */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-bold">Pasirinkite maršrutą optimizavimui</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Optimizuoti vieną maršrutą
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  disabled={analyzing}
                >
                  <option value="">Pasirinkite maršrutą...</option>
                  {routes.map((route) => (
                    <option key={route.numeris} value={route.numeris}>
                      {route.numeris} - {route.pavadinimas}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleOptimizeSingle}
                  disabled={!selectedRoute || analyzing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                >
                  Optimizuoti
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Arba optimizuoti visus maršrutus
              </label>
              <button
                onClick={handleOptimizeAll}
                disabled={analyzing || routes.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                {analyzing ? "Analizuojama..." : "Optimizuoti visus maršrutus"}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {optimizationResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Optimizavimo rezultatai</h2>
            {optimizationResults.map((result) => (
              <div key={result.routeNumber} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-mono text-xl font-semibold text-blue-600">
                      {result.routeNumber}
                    </h3>
                    <p className="text-lg font-medium">{result.routeName}</p>
                  </div>
                  {result.savings > 0 && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      -{result.savingsPercent.toFixed(1)}% taupymas
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs text-slate-500">Dabartinis atstumas</p>
                    <p className="text-2xl font-bold text-slate-700">
                      {result.currentDistance.toFixed(1)} km
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-blue-600">Optimizuotas atstumas</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {result.optimizedDistance.toFixed(1)} km
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-green-600">Sutaupyta</p>
                    <p className="text-2xl font-bold text-green-700">
                      {result.savings.toFixed(1)} km
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Rekomendacijos:</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Summary */}
            {optimizationResults.length > 1 && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow p-6">
                <h3 className="text-xl font-bold mb-4">Bendra santrauka</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Analizuota maršrutų</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {optimizationResults.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Bendra sutaupyta</p>
                    <p className="text-3xl font-bold text-green-600">
                      {optimizationResults
                        .reduce((sum, r) => sum + r.savings, 0)
                        .toFixed(1)}{" "}
                      km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Vidutinis taupymas</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {(
                        optimizationResults.reduce((sum, r) => sum + r.savingsPercent, 0) /
                        optimizationResults.length
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        {optimizationResults.length === 0 && !analyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              ℹ️ Kaip veikia optimizavimas?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Analizuojami atstumai tarp stotelių</li>
              <li>• Ieškoma per arti esančių stotelių, kurias galima sujungti</li>
              <li>• Identifikuojamos per didelės atkarpos, kurioms reikia papildomų stotelių</li>
              <li>• Aptinkamas galimas maršruto neefektyvumas (užsisukimai)</li>
              <li>• Pateikiamos konkrečios rekomendacijos</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizationPage;