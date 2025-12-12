// src/pages/DriverPage.tsx
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { vehicleService, Vehicle } from "../services/vehicleService";
import { routesService, Route } from "../services/RoutesService";
import { gedimasService, Gedimas } from "../services/gedimasService";
import fuelStatsService from "../services/fuelStatsService";

export default function DriverPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [gedimai, setGedimai] = useState<Gedimas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMalfunctionForm, setShowMalfunctionForm] = useState(false);
  const [malfunctionForm, setMalfunctionForm] = useState({
    gedimoTipas: "",
    komentaras: "",
  });
  const [submittingMalfunction, setSubmittingMalfunction] = useState(false);
  const [malfunctionError, setMalfunctionError] = useState<string | null>(null);

  // Fuel usage form
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    data: new Date().toISOString().split("T")[0],
    nukeliautasAtstumas: "",
    kuroKiekis: "",
  });
  const [fuelSubmitting, setFuelSubmitting] = useState(false);
  const [fuelError, setFuelError] = useState<string | null>(null);
  const [fuelSuccess, setFuelSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "driver") {
      navigate("/login");
      return;
    }
    fetchDriverVehicle();
  }, [user, navigate]);

  const fetchDriverVehicle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch vehicle assigned to this driver
      const vehicles = await vehicleService.getAllVehicles("driver", user?.idNaudotojas);
      
      if (vehicles.length > 0) {
        const assignedVehicle = vehicles[0];
        setVehicle(assignedVehicle);
        
        // Fetch malfunctions for this vehicle
        try {
          const malfunctions = await gedimasService.getVehicleGedimai(assignedVehicle.valstybiniaiNum);
          setGedimai(malfunctions);
        } catch (err) {
          console.error("Failed to fetch malfunctions:", err);
        }
        
        // If vehicle has a route, fetch route details
        if (assignedVehicle.fkMarsrutasNumeris) {
          try {
            const routeData = await routesService.getOne(assignedVehicle.fkMarsrutasNumeris.toString());
            setRoute(routeData);
          } catch (err) {
            console.error("Failed to fetch route:", err);
          }
        }
      } else {
        setVehicle(null);
        setRoute(null);
      }
    } catch (err) {
      console.error("Failed to fetch vehicle:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vehicle information");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const handleMalfunctionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMalfunctionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitMalfunction = async (e: React.FormEvent) => {
    e.preventDefault();
    setMalfunctionError(null);

    if (!malfunctionForm.gedimoTipas) {
      setMalfunctionError("Prašome pasirinkti gedimo tipą");
      return;
    }

    if (!vehicle) {
      setMalfunctionError("Nėra priskirto transporto");
      return;
    }

    setSubmittingMalfunction(true);
    try {
      await gedimasService.createGedimas(
        {
          valstybiniaiNum: vehicle.valstybiniaiNum,
          gedimoTipas: malfunctionForm.gedimoTipas,
          komentaras: malfunctionForm.komentaras,
        },
        user?.idNaudotojas
      );

      // Refresh malfunctions list
      const updatedGedimai = await gedimasService.getVehicleGedimai(vehicle.valstybiniaiNum);
      setGedimai(updatedGedimai);

      // Reset form
      setMalfunctionForm({
        gedimoTipas: "",
        komentaras: "",
      });
      setShowMalfunctionForm(false);
    } catch (err) {
      setMalfunctionError(err instanceof Error ? err.message : "Nepavyko įregistruoti gedimo");
    } finally {
      setSubmittingMalfunction(false);
    }
  };

  const handleFuelFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFuelForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError(null);
    setFuelSuccess(null);

    if (!vehicle) {
      setFuelError("Nėra priskirto transporto");
      return;
    }

    const distance = parseFloat(fuelForm.nukeliautasAtstumas);
    const fuel = parseFloat(fuelForm.kuroKiekis);
    if (isNaN(distance) || distance <= 0) {
      setFuelError("Nukeliautas atstumas turi būti teigiamas skaičius");
      return;
    }
    if (isNaN(fuel) || fuel <= 0) {
      setFuelError("Kuro kiekis turi būti teigiamas skaičius");
      return;
    }

    setFuelSubmitting(true);
    try {
      await fuelStatsService.createFuelRecord({
        data: fuelForm.data,
        nukeliautasAtstumas: distance,
        kuroKiekis: fuel,
        valstybiniaiNum: vehicle.valstybiniaiNum,
      });
      setFuelSuccess("Kuro sąnaudos sėkmingai užregistruotos");
      setShowFuelForm(false);
      setFuelForm({
        data: new Date().toISOString().split("T")[0],
        nukeliautasAtstumas: "",
        kuroKiekis: "",
      });
    } catch (err) {
      setFuelError(err instanceof Error ? err.message : "Nepavyko užregistruoti kuro sąnaudų");
    } finally {
      setFuelSubmitting(false);
    }
  };

  const getFuelTypeLabel = (kuroTipas: number) => {
    const fuelTypes: Record<number, string> = {
      1: "Benzinas",
      2: "LPG",
      3: "Dyzelinas",
      4: "Elektra",
    };
    return fuelTypes[kuroTipas] || "Nežinomas";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Kraunama...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vairuotojo valdymo skydelis</h1>
            <p className="text-sm text-slate-600 mt-1">
              Sveiki, {user?.slapyvardis || "Vairuotojas"}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition font-medium"
          >
            Atsijungti
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!vehicle ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Jums dar nepriskirtas transportas</h3>
            <p className="text-slate-600">Susisiekite su administratoriumi, kad jums būtų priskirtas transporto priemonė</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vehicle Information Card */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Jūsų transporto priemonė</h2>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Valstybiniai numeriai
                    </label>
                    <div className="text-lg font-semibold text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                      {vehicle.valstybiniaiNum}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Kuro tipas
                    </label>
                    <div className="text-lg text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                      {getFuelTypeLabel(vehicle.kuroTipas)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Rida (km)
                    </label>
                    <div className="text-lg text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                      {vehicle.rida.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Vietų skaičius
                    </label>
                    <div className="text-lg text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                      {vehicle.vietuSk}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Information Card */}
            {vehicle.fkMarsrutasNumeris ? (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-900">Priskirtas maršrutas</h2>
                </div>
                <div className="px-6 py-6">
                  {route ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Maršruto numeris
                          </label>
                          <div className="text-lg font-semibold text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                            {route.numeris}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Pavadinimas
                          </label>
                          <div className="text-lg text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                            {route.pavadinimas}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Pradžios stotelė
                          </label>
                          <div className="text-lg text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                            {route.pradziosStotele}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Pabaigos stotelė
                          </label>
                          <div className="text-lg text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                            {route.pabaigosStotele}
                          </div>
                        </div>

                        {route.bendrasAtstumas && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Bendras atstumas (km)
                            </label>
                            <div className="text-lg text-slate-900 bg-slate-50 px-4 py-2 rounded border border-slate-200">
                              {route.bendrasAtstumas.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Route Stops */}
                      {route.stoteles && route.stoteles.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium text-slate-900 mb-3">Maršruto stotelės</h3>
                          <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                      Eilės Nr.
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                      Stotelė
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                      Atvykimo laikas
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                      Išvykimo laikas
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                  {route.stoteles
                                    .sort((a, b) => a.eilesNr - b.eilesNr)
                                    .map((stop) => (
                                      <tr key={stop.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                          {stop.eilesNr}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                          {stop.stotelesPavadinimas}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                          {stop.atvykimoLaikas || "-"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                          {stop.isvykimoLaikas || "-"}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-slate-600">Kraunami maršruto duomenys...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-slate-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Jūsų transportui dar nepriskirtas maršrutas</h3>
                <p className="text-slate-600">Maršrutas bus priskirtas vėliau</p>
              </div>
            )}

            {/* Malfunctions Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Registruoti gedimus</h2>
                <button
                  onClick={() => setShowMalfunctionForm(!showMalfunctionForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-sm"
                >
                  {showMalfunctionForm ? "Atšaukti" : "Pranešti apie gedimą"}
                </button>
              </div>

              <div className="px-6 py-6">
                {showMalfunctionForm && (
                  <form onSubmit={handleSubmitMalfunction} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Naujas gedimo pranešimas</h3>

                    {malfunctionError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm mb-4">
                        {malfunctionError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Gedimo tipas *
                        </label>
                        <select
                          name="gedimoTipas"
                          value={malfunctionForm.gedimoTipas}
                          onChange={handleMalfunctionChange}
                          disabled={submittingMalfunction}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                        >
                          <option value="">-- Pasirinkite gedimo tipą --</option>
                          <option value="Interjero">Interjero</option>
                          <option value="Išorės kosmetinis">Išorės kosmetinis</option>
                          <option value="Kitas stambus">Kitas stambus</option>
                          <option value="Kitas smulkus">Kitas smulkus</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Komentaras
                        </label>
                        <textarea
                          name="komentaras"
                          value={malfunctionForm.komentaras}
                          onChange={handleMalfunctionChange}
                          disabled={submittingMalfunction}
                          rows={3}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
                          placeholder="Trumpai aprašykite gedimą..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingMalfunction}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 font-medium transition"
                      >
                        {submittingMalfunction ? "Siunčiama..." : "Pranešti apie gedimą"}
                      </button>
                    </div>
                  </form>
                )}

                {gedimai.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Registruoti gedimai</h3>
                    <div className="space-y-4">
                      {gedimai.map((gedimas) => (
                        <div
                          key={gedimas.idGedimas}
                          className={`p-4 rounded-lg border ${
                            gedimas.gedimoBusena === "Sutvarkyta"
                              ? "bg-green-50 border-green-200"
                              : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-slate-900">{gedimas.gedimoTipas}</h4>
                              <p className="text-sm text-slate-600 mt-1">
                                {gedimas.data ? new Date(gedimas.data).toLocaleDateString("lt-LT") : "-"}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                gedimas.gedimoBusena === "Sutvarkyta"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {gedimas.gedimoBusena}
                            </span>
                          </div>
                          {gedimas.komentaras && (
                            <p className="text-sm text-slate-700 mt-2">{gedimas.komentaras}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-slate-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-600">Nėra registruotų gedimų</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fuel Usage Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Registruoti kuro sąnaudas</h2>
                <button
                  onClick={() => setShowFuelForm(!showFuelForm)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition font-medium text-sm"
                >
                  {showFuelForm ? "Atšaukti" : "Pridėti įrašą"}
                </button>
              </div>
              <div className="px-6 py-6">
                {showFuelForm && (
                  <form onSubmit={handleSubmitFuel} className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Naujas kuro įrašas</h3>

                    {fuelError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm mb-4">
                        {fuelError}
                      </div>
                    )}
                    {fuelSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 text-green-700 text-sm mb-4">
                        {fuelSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                        <input
                          type="date"
                          name="data"
                          value={fuelForm.data}
                          onChange={handleFuelFormChange}
                          disabled={fuelSubmitting}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-slate-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nukeliautas atstumas (km) *</label>
                        <input
                          type="number"
                          name="nukeliautasAtstumas"
                          value={fuelForm.nukeliautasAtstumas}
                          onChange={handleFuelFormChange}
                          disabled={fuelSubmitting}
                          step="0.1"
                          min="0"
                          className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-slate-100"
                          placeholder="0.0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kuro kiekis ({vehicle.kuroTipas === 4 ? 'kWh' : 'L'}) *</label>
                        <input
                          type="number"
                          name="kuroKiekis"
                          value={fuelForm.kuroKiekis}
                          onChange={handleFuelFormChange}
                          disabled={fuelSubmitting}
                          step="0.01"
                          min="0"
                          className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-600 disabled:bg-slate-100"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={fuelSubmitting}
                      className="mt-4 w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 disabled:bg-slate-400 font-medium transition"
                    >
                      {fuelSubmitting ? "Siunčiama..." : "Išsaugoti kuro įrašą"}
                    </button>
                  </form>
                )}

                {!showFuelForm && (
                  <p className="text-slate-600 text-sm">Naudokite „Pridėti įrašą“, kad užregistruotumėte naujas kuro sąnaudas.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
