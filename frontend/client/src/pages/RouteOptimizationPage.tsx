import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routesService, Route, Stop } from "../services/RoutesService";

interface OptimizationResult {
  routeNumber: string;
  routeName: string;

  reportedDistance: number;   // DB bendrasAtstumas (jei yra)
  calculatedDistance: number; // apskaičiuotas pagal koordinates

  optimizedDistance: number;  // realiai apskaičiuotas po optimizavimo
  savings: number;
  savingsPercent: number;

  currentStopOrder: string[];
  optimizedStopOrder?: string[];

  recommendations: string[];
  issuesFound: number;
}

type StopCoord = { name: string; x: number; y: number };

const RouteOptimizationPage: React.FC = () => {
  const navigate = useNavigate();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  // ---- Load data ----
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      alert(err?.message || "Nepavyko užkrauti duomenų");
    } finally {
      setLoading(false);
    }
  };

  // ---- Stop lookup map for speed ----
  const stopMap = useMemo(() => {
    const m = new Map<string, Stop>();
    for (const s of stops) m.set(s.pavadinimas, s);
    return m;
  }, [stops]);

  // ---- Distance (Haversine) ----
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    // Pastaba: x/y turi atitikti lon/lat (arba lat/lon), bet svarbiausia nuoseklumas.
    const R = 6371; // km
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

  const distKm = (a: StopCoord, b: StopCoord) => calculateDistance(a.x, a.y, b.x, b.y);

  const routeDistance = (order: StopCoord[]) => {
    let total = 0;
    for (let i = 0; i < order.length - 1; i++) total += distKm(order[i], order[i + 1]);
    return total;
  };

  const bearingDeg = (a: StopCoord, b: StopCoord) => {
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
    return (ang + 360) % 360;
  };

  const angleDiff = (a: number, b: number) => {
    let d = Math.abs(a - b);
    if (d > 180) d = 360 - d;
    return d;
  };

  // ---- Nearest Neighbor (start/end fixed) ----
  const nearestNeighborOrder = (start: StopCoord, end: StopCoord, mids: StopCoord[]) => {
    const remaining = [...mids];
    const result: StopCoord[] = [start];
    let current = start;

    while (remaining.length) {
      let bestIdx = 0;
      let bestD = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const d = distKm(current, remaining[i]);
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      }

      const next = remaining.splice(bestIdx, 1)[0];
      result.push(next);
      current = next;
    }

    result.push(end);
    return result;
  };

  // ---- 2-opt improvement (keičia tik tarpines) ----
  const twoOptImprove = (order: StopCoord[]) => {
    if (order.length <= 4) return order;

    let best = [...order];
    let bestDist = routeDistance(best);
    let improved = true;

    // 0 = start, last = end, keičiam tik 1..last-1
    while (improved) {
      improved = false;

      for (let i = 1; i < best.length - 2; i++) {
        for (let k = i + 1; k < best.length - 1; k++) {
          const newOrder = [
            ...best.slice(0, i),
            ...best.slice(i, k + 1).reverse(),
            ...best.slice(k + 1),
          ];
          const newDist = routeDistance(newOrder);
          if (newDist + 1e-9 < bestDist) {
            best = newOrder;
            bestDist = newDist;
            improved = true;
          }
        }
      }
    }

    return best;
  };

  // ---- Main optimization ----
  const optimizeRoute = (route: Route): OptimizationResult => {
    const reportedDistance = route.bendrasAtstumas || 0;

    const currentStopOrderNames = [
      route.pradziosStotele,
      ...(route.stoteles ?? [])
        .slice()
        .sort((a, b) => a.eilesNr - b.eilesNr)
        .map((s) => s.stotelesPavadinimas),
      route.pabaigosStotele,
    ];

    const recommendations: string[] = [];
    let issuesFound = 0;

    // map to coords (null if missing)
    const coordsMaybe = currentStopOrderNames.map((name) => {
      const s = stopMap.get(name);
      return s ? ({ name, x: s.koordinatesX, y: s.koordinatesY } as StopCoord) : null;
    });

    const missing = coordsMaybe
      .map((c, i) => (c ? null : currentStopOrderNames[i]))
      .filter(Boolean) as string[];

    if (missing.length) {
      recommendations.push(
        `Trūksta koordinačių šioms stotelėms: ${missing.join(", ")}. Rezultatai gali būti netikslūs.`
      );
      issuesFound++;
    }

    const coords = coordsMaybe.filter(Boolean) as StopCoord[];

    if (coords.length < 2) {
      return {
        routeNumber: route.numeris,
        routeName: route.pavadinimas,
        reportedDistance,
        calculatedDistance: reportedDistance,
        optimizedDistance: reportedDistance,
        savings: 0,
        savingsPercent: 0,
        currentStopOrder: currentStopOrderNames,
        optimizedStopOrder: undefined,
        recommendations: recommendations.length ? recommendations : ["Nepakanka duomenų optimizavimui"],
        issuesFound: Math.max(1, issuesFound),
      };
    }

    const calculatedDistance = routeDistance(coords);

    // reported vs calculated
    if (reportedDistance > 0) {
      const diff = Math.abs(calculatedDistance - reportedDistance);
      const pct = (diff / reportedDistance) * 100;
      if (pct > 10) {
        recommendations.push(
          `Nurodytas atstumas (${reportedDistance.toFixed(1)} km) skiriasi nuo apskaičiuoto (${calculatedDistance.toFixed(
            1
          )} km) apie ${pct.toFixed(0)}%. Patikrinkite "bendrasAtstumas" arba koordinates.`
        );
        issuesFound++;
      }
    } else {
      recommendations.push(
        `DB laukas "bendrasAtstumas" nenurodytas (0). Apskaičiuotas pagal koordinates: ${calculatedDistance.toFixed(
          1
        )} km.`
      );
      issuesFound++;
    }

    // segments analysis
    const segments: Array<{ from: string; to: string; km: number }> = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      segments.push({ from: a.name, to: b.name, km: distKm(a, b) });
    }

    const closeSegs = segments.filter((s) => s.km < 0.3);
    if (closeSegs.length) {
      recommendations.push(
        `Per arti esančios atkarpos (<0.3 km): ` +
          closeSegs
            .slice(0, 5)
            .map((s) => `${s.from} → ${s.to} (${s.km.toFixed(2)} km)`)
            .join("; ") +
          (closeSegs.length > 5 ? ` (+${closeSegs.length - 5} daugiau)` : "")
      );
      issuesFound++;
    }

    const farSegs = segments.filter((s) => s.km > 5);
    if (farSegs.length) {
      recommendations.push(
        `Labai ilgos atkarpos (>5 km): ` +
          farSegs
            .slice(0, 5)
            .map((s) => `${s.from} → ${s.to} (${s.km.toFixed(1)} km)`)
            .join("; ") +
          (farSegs.length > 5 ? ` (+${farSegs.length - 5} daugiau)` : "")
      );
      issuesFound++;
    }

    // sharp turns
    const bigTurns: Array<{ at: string; deg: number }> = [];
    for (let i = 1; i < coords.length - 1; i++) {
      const prev = coords[i - 1];
      const cur = coords[i];
      const next = coords[i + 1];

      const b1 = bearingDeg(prev, cur);
      const b2 = bearingDeg(cur, next);
      const d = angleDiff(b1, b2);

      if (d > 90) bigTurns.push({ at: cur.name, deg: d });
    }

    if (bigTurns.length > 2) {
      recommendations.push(
        `Daug staigių posūkių (>90°): ` +
          bigTurns
            .slice(0, 6)
            .map((t) => `${t.at} (~${t.deg.toFixed(0)}°)`)
            .join(", ") +
          (bigTurns.length > 6 ? ` (+${bigTurns.length - 6} daugiau)` : "") +
          `. Tikėtina, kad stotelių tvarką galima pagerinti.`
      );
      issuesFound++;
    }

    // ---- Real optimization: reorder only mid stops ----
    const start = coords[0];
    const end = coords[coords.length - 1];
    const mids = coords.slice(1, -1);

    let optimizedDistance = calculatedDistance;
    let optimizedStopOrder: string[] | undefined = undefined;

    if (mids.length >= 2) {
      const nn = nearestNeighborOrder(start, end, mids);
      const improved = twoOptImprove(nn);

      const improvedDistance = routeDistance(improved);
      const gain = calculatedDistance - improvedDistance;

      if (gain > 0.1) {
        optimizedDistance = improvedDistance;
        optimizedStopOrder = improved.map((s) => s.name);
        recommendations.push(
          `Siūloma perrikiuoti tarpines stoteles (pradžia/pabaiga nekinta). Num. sutaupymas: ${gain.toFixed(1)} km.`
        );
        issuesFound++;
      } else {
        // praktiškai nėra geresnio varianto
        optimizedDistance = calculatedDistance;
        optimizedStopOrder = undefined;
      }
    } else {
      recommendations.push("Maršrutas neturi pakankamai tarpinių stotelių perrikiavimui.");
    }

    if (recommendations.length === 0) {
      recommendations.push("Maršrutas atrodo gerai optimizuotas! ✓");
    }

    const savings = Math.max(0, calculatedDistance - optimizedDistance);
    const base = calculatedDistance > 0 ? calculatedDistance : 1; // apsauga
    const savingsPercent = (savings / base) * 100;

    return {
      routeNumber: route.numeris,
      routeName: route.pavadinimas,
      reportedDistance,
      calculatedDistance,
      optimizedDistance,
      savings,
      savingsPercent,
      currentStopOrder: currentStopOrderNames,
      optimizedStopOrder,
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
      alert(err?.message || "Nepavyko optimizuoti");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimizeAll = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const results = routes.map((r) => optimizeRoute(r));
      results.sort((a, b) => b.savings - a.savings);
      setOptimizationResults(results);
      setAnalyzing(false);
    }, 600);
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

            <button
              onClick={loadData}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              disabled={loading || analyzing}
            >
              Atnaujinti
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Controls */}
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
                  disabled={analyzing || loading}
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
                  disabled={!selectedRoute || analyzing || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                >
                  {analyzing ? "..." : "Optimizuoti"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Arba optimizuoti visus maršrutus
              </label>
              <button
                onClick={handleOptimizeAll}
                disabled={analyzing || routes.length === 0 || loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
              >
                {analyzing ? "Analizuojama..." : "Optimizuoti visus maršrutus"}
              </button>
            </div>
          </div>

          {loading && <p className="text-sm text-slate-500">Kraunama...</p>}
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

                  <div className="flex gap-2 flex-wrap justify-end">
                    {result.savings > 0.05 && (
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
                        {result.issuesFound}{" "}
                        {result.issuesFound === 1 ? "pastebėjimas" : "pastebėjimai"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Distances */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs text-slate-500">Apskaičiuotas atstumas</p>
                    <p className="text-2xl font-bold text-slate-700">
                      {result.calculatedDistance.toFixed(1)} km
                    </p>
                    {result.reportedDistance > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        DB nurodytas: {result.reportedDistance.toFixed(1)} km
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-blue-600">Optimizuotas atstumas</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {result.optimizedDistance.toFixed(1)} km
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {result.optimizedStopOrder ? "Perrikiuotos tarpinės" : "Nėra geresnio varianto"}
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-green-600">Sutaupyta</p>
                    <p className="text-2xl font-bold text-green-700">
                      {result.savings.toFixed(1)} km
                    </p>
                  </div>
                </div>

                {/* Stop orders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs text-slate-500 mb-1">Dabartinė stotelių tvarka</p>
                    <p className="text-sm text-slate-700 break-words">
                      {result.currentStopOrder.join(" → ")}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-blue-600 mb-1">
                      Siūloma tvarka (pradžia/pabaiga nekinta)
                    </p>
                    <p className="text-sm text-blue-800 break-words">
                      {result.optimizedStopOrder
                        ? result.optimizedStopOrder.join(" → ")
                        : "Nėra geresnės tvarkos pagal koordinates."}
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold mb-2">Rekomendacijos / pastebėjimai:</h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className={`mt-0.5 ${result.issuesFound === 0 ? "text-green-600" : "text-blue-600"}`}>
                          {result.issuesFound === 0 ? "✓" : "•"}
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
                    <p className="text-sm text-slate-600">Maršrutų su pagerinimu</p>
                    <p className="text-3xl font-bold text-green-600">
                      {optimizationResults.filter((r) => (r.optimizedStopOrder ? r.savings > 0.1 : false)).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Bendra sutaupyta</p>
                    <p className="text-3xl font-bold text-green-600">
                      {optimizationResults.reduce((sum, r) => sum + r.savings, 0).toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Vidutinis taupymas</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {(
                        optimizationResults.reduce((sum, r) => sum + r.savingsPercent, 0) /
                        (optimizationResults.length || 1)
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
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Kaip veikia optimizavimas?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Apskaičiuojamas realus atstumas tarp stotelių pagal koordinates (Haversine)</li>
              <li>• Randamos probleminės atkarpos (per arti / per toli) su konkrečiomis stotelėmis</li>
              <li>• Analizuojami staigūs posūkiai (galimas užsisukimas / backtracking)</li>
              <li>• Atliekamas tikras optimizavimas: perrikiuojamos tik tarpinės stotelės (pradžia/pabaiga fiksuotos)</li>
              <li>• Pateikiama siūloma stotelių tvarka ir sutaupymas (km ir %)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizationPage;
