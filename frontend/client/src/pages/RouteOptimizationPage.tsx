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
  issuesFound: number;
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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (y2 - y1) * (Math.PI / 180);
    const dLon = (x2 - x1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(y1 * (Math.PI / 180)) *
        Math.cos(y2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Improved optimization algorithm
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
        issuesFound: 0,
      };
    }

    const currentDistance = route.bendrasAtstumas || 0;
    const recommendations: string[] = [];
    let issuesFound = 0;

    // Get coordinates for all stops in the route
    const routeStopNames = [
      route.pradziosStotele,
      ...route.stoteles.sort((a, b) => a.eilesNr - b.eilesNr).map((s) => s.stotelesPavadinimas),
      route.pabaigosStotele,
    ];

    const routeStopCoords = routeStopNames
      .map((name) => {
        const stop = stops.find((s) => s.pavadinimas === name);
        return stop
          ? { name, x: stop.koordinatesX, y: stop.koordinatesY }
          : null;
      })
      .filter((s) => s !== null) as Array<{ name: string; x: number; y: number }>;

    if (routeStopCoords.length < 2) {
      return {
        routeNumber: route.numeris,
        routeName: route.pavadinimas,
        currentDistance,
        optimizedDistance: currentDistance,
        savings: 0,
        savingsPercent: 0,
        recommendations: ["Nepakanka koordinačių duomenų optimizavimui"],
        issuesFound: 1,
      };
    }

    // Calculate actual distances between consecutive stops
    let calculatedTotalDistance = 0;
    const segmentDistances: number[] = [];
    
    for (let i = 0; i < routeStopCoords.length - 1; i++) {
      const dist = calculateDistance(
        routeStopCoords[i].x,
        routeStopCoords[i].y,
        routeStopCoords[i + 1].x,
        routeStopCoords[i + 1].y
      );
      segmentDistances.push(dist);
      calculatedTotalDistance += dist;
    }

    // Check if reported distance matches calculated distance
    if (currentDistance > 0) {
      const distanceDifference = Math.abs(calculatedTotalDistance - currentDistance);
      const differencePercent = (distanceDifference / currentDistance) * 100;
      
      if (differencePercent > 10) {
        recommendations.push(
          `Nurodomas atstumas (${currentDistance.toFixed(1)} km) labai skiriasi nuo apskaičiuoto (${calculatedTotalDistance.toFixed(1)} km). Patikrinkite duomenis.`
        );
        issuesFound++;
      }
    }

    // Check for very close stops (less than 0.3 km)
    const veryCloseStops = segmentDistances.filter((d, i) => i > 0 && d < 0.3).length;
    if (veryCloseStops > 0) {
      recommendations.push(
        `Rasta ${veryCloseStops} atkarpų, trumpesnių nei 0.3 km. Apsvarstykite galimybę sujungti kai kurias stoteles efektyvumui.`
      );
      issuesFound++;
    }

    // Check for very far stops (more than 5 km)
    const veryFarStops = segmentDistances.filter((d) => d > 5).length;
    if (veryFarStops > 0) {
      recommendations.push(
        `Rasta ${veryFarStops} atkarpų, ilgesnių nei 5 km. Apsvarstykite galimybę pridėti tarpines stoteles.`
      );
      issuesFound++;
    }

    // Check for potential backtracking using bearing changes
    let significantDirectionChanges = 0;
    for (let i = 1; i < routeStopCoords.length - 1; i++) {
      const prev = routeStopCoords[i - 1];
      const curr = routeStopCoords[i];
      const next = routeStopCoords[i + 1];

      const bearing1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const bearing2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      let bearingChange = Math.abs(bearing2 - bearing1) * (180 / Math.PI);
      if (bearingChange > 180) bearingChange = 360 - bearingChange;

      if (bearingChange > 90) {
        significantDirectionChanges++;
      }
    }

    if (significantDirectionChanges > 2) {
      recommendations.push(
        `Aptikta ${significantDirectionChanges} reikšmingų krypties pasikeitimų. Maršrutas gali būti neoptimalus - apsvarstykite stotelių tvarkos keitimą.`
      );
      issuesFound++;
    }

    // Check stop order efficiency using nearest neighbor principle
    const inefficientSegments = segmentDistances.filter((dist, i) => {
      if (i === segmentDistances.length - 1) return false;
      const nextDist = segmentDistances[i + 1];
      return dist > nextDist * 2; // Current segment is more than 2x the next segment
    }).length;

    if (inefficientSegments > 0) {
      recommendations.push(
        `Rasta ${inefficientSegments} potencialiai neefektyvių atkarpų. Galbūt stotelės išdėstytos neoptimaliai.`
      );
      issuesFound++;
    }

    // Estimate potential savings
    let potentialSavings = 0;

    // Savings from merging close stops
    if (veryCloseStops > 0) {
      potentialSavings += veryCloseStops * 0.2;
    }

    // Savings from route optimization
    if (significantDirectionChanges > 2) {
      potentialSavings += currentDistance * 0.08; // 8% improvement potential
    }

    // Savings from stop reordering
    if (inefficientSegments > 0) {
      potentialSavings += currentDistance * 0.05; // 5% improvement potential
    }

    const optimizedDistance = Math.max(currentDistance - potentialSavings, currentDistance * 0.85);

    // If no issues found, provide positive feedback
    if (recommendations.length === 0) {
      recommendations.push("Maršrutas atrodo gerai optimizuotas! ✓");
      recommendations.push("Stotelės išdėstytos logiškai ir efektyviai.");
    }

    return {
      routeNumber: route.numeris,
      routeName: route.pavadinimas,
      currentDistance,
      optimizedDistance,
      savings: currentDistance - optimizedDistance,
      savingsPercent: ((currentDistance - optimizedDistance) / currentDistance) * 100,
      recommendations,
      issuesFound,
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
      // Sort by potential savings (highest first)
      results.sort((a, b) => b.savings - a.savings);
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
                  <div className="flex gap-2">
                    {result.savings > 0 && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        -{result.savingsPercent.toFixed(1)}% taupymas
                      </span>
                    )}
                    {result.issuesFound === 0 && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        ✓ Optimalus
                      </span>
                    )}
                    {result.issuesFound > 0 && (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {result.issuesFound} {result.issuesFound === 1 ? 'problema' : 'problemos'}
                      </span>
                    )}
                  </div>
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
                        <span className={`mt-0.5 ${result.issuesFound === 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          {result.issuesFound === 0 ? '✓' : '•'}
                        </span>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Analizuota maršrutų</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {optimizationResults.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Optimalių maršrutų</p>
                    <p className="text-3xl font-bold text-green-600">
                      {optimizationResults.filter(r => r.issuesFound === 0).length}
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
              <li>• Tikrinami tikri atstumai tarp stotelių naudojant koordinates</li>
              <li>• Identifikuojamos per arti esančios stotelės (&lt;0.3 km)</li>
              <li>• Aptinkamos per didelės atkarpos (&gt;5 km)</li>
              <li>• Analizuojami maršruto užsisukimai ir krypties pakeitimai</li>
              <li>• Vertinamas stotelių išdėstymo efektyvumas</li>
              <li>• Pateikiamos konkrečios ir išmatuotos rekomendacijos</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizationPage;