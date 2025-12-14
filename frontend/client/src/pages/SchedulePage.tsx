import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { routesService } from "../services/RoutesService";
import { vehicleService, Vehicle } from "../services/vehicleService";

interface Tvarkarastis {
  id: number;
  marsrutoNr: number;   // <-- buvo string
  pavadinimas?: string;
  atvykimoLaikas: string;
  isvykimoLaikas: string;
  dienosTipas: string;
  transportoPriemonesKodas?: string;
}

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Tvarkarastis[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    marsrutoNr: "",
    pavadinimas: "",
    atvykimoLaikas: "",
    isvykimoLaikas: "",
    dienosTipas: "Darbo_diena",
    transportoPriemonesKodas: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load routes for dropdown
      const routesData = await routesService.getAll();
      setRoutes(routesData);
      
      // Load vehicles for dropdown
      const vehiclesData = await vehicleService.getAllVehicles();
      setVehicles(vehiclesData);
      
      // Load schedules from API
      const response = await fetch("http://localhost:5011/api/Schedule");
      if (!response.ok) throw new Error("Failed to fetch schedules");
      const data = await response.json();
      setSchedules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEditing 
        ? `http://localhost:5011/api/Schedule/${editingId}`
        : "http://localhost:5011/api/Schedule";
      
      const method = isEditing ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        marsrutoNr: Number(formData.marsrutoNr),
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // <-- NAUDOJAM payload
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save schedule");
      }
      
      await loadData();
      resetForm();
      alert(`Tvarkaraštis ${isEditing ? "atnaujintas" : "sukurtas"}!`);
    } catch (err: any) {
      alert("Klaida: " + err.message);
    }
  };

  const handleEdit = (schedule: Tvarkarastis) => {
    setFormData({
      marsrutoNr: String(schedule.marsrutoNr), // <-- svarbiausia
      pavadinimas: schedule.pavadinimas || "",
      atvykimoLaikas: schedule.atvykimoLaikas,
      isvykimoLaikas: schedule.isvykimoLaikas,
      dienosTipas: schedule.dienosTipas,
      transportoPriemonesKodas: schedule.transportoPriemonesKodas || ""
    });
    setIsEditing(true);
    setEditingId(schedule.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ar tikrai norite ištrinti šį tvarkaraštį?")) return;
    
    try {
        const response = await fetch(`http://localhost:5011/api/Schedule/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) throw new Error("Failed to delete schedule");
      
      await loadData();
      alert("Tvarkaraštis ištrintas!");
    } catch (err: any) {
      alert("Klaida trinant: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      marsrutoNr: "",
      pavadinimas: "",
      atvykimoLaikas: "",
      isvykimoLaikas: "",
      dienosTipas: "Darbo_diena",
      transportoPriemonesKodas: ""
    });
    setIsEditing(false);
    setEditingId(null);
  };

const filteredSchedules = schedules.filter(s =>
  String(s.marsrutoNr).toLowerCase().includes(searchTerm.toLowerCase()) ||
  (s.pavadinimas ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (s.transportoPriemonesKodas ?? "").toLowerCase().includes(searchTerm.toLowerCase())
);

  const formatTime = (timeString: string) => {
    try {
      // If it's already in HH:mm format, return as is
      if (timeString.match(/^\d{2}:\d{2}$/)) return timeString;
      
      // Parse TimeSpan format (HH:mm:ss)
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const getDayTypeDisplay = (type: string) => {
    switch(type) {
      case "Darbo_diena": return "Darbo diena";
      case "Savaitgalis": return "Savaitgalis";
      case "Sventine_diena": return "Šventinė diena";
      default: return type;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm"
          >
            ← Atgal į valdymo skydelį
          </button>
          <h1 className="text-2xl font-bold">Tvarkaraščių valdymas</h1>
        </div>
        <button
          onClick={loadData}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md text-sm"
        >
          Atnaujinti
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section - Left */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {isEditing ? "Redaguoti tvarkaraštį" : "Naujas tvarkaraštis"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Maršrutas *</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={formData.marsrutoNr}
                  onChange={(e) => setFormData({...formData, marsrutoNr: e.target.value})}
                  required
                  disabled={isEditing}
                >
                  <option value="">Pasirinkite maršrutą</option>
                  {routes.map(route => (
                    <option key={route.numeris} value={route.numeris}>
                      {route.numeris} - {route.pavadinimas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pavadinimas</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={formData.pavadinimas}
                  onChange={(e) => setFormData({...formData, pavadinimas: e.target.value})}
                  placeholder="pvz. Rytinis reisas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Atvykimas *</label>
                  <input
                    type="time"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={formData.atvykimoLaikas}
                    onChange={(e) => setFormData({...formData, atvykimoLaikas: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Išvykimas *</label>
                  <input
                    type="time"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={formData.isvykimoLaikas}
                    onChange={(e) => setFormData({...formData, isvykimoLaikas: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dienos tipas *</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={formData.dienosTipas}
                  onChange={(e) => setFormData({...formData, dienosTipas: e.target.value})}
                  required
                >
                  <option value="Darbo_diena">Darbo diena</option>
                  <option value="Savaitgalis">Savaitgalis</option>
                  <option value="Sventine_diena">Šventinė diena</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Transporto priemonė</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={formData.transportoPriemonesKodas}
                  onChange={(e) => setFormData({...formData, transportoPriemonesKodas: e.target.value})}
                >
                  <option value="">Pasirinkite transporto priemonę</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.valstybiniaiNum} value={vehicle.valstybiniaiNum}>
                      {vehicle.valstybiniaiNum} ({vehicle.vietuSk} vietos)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  {isEditing ? "Atnaujinti" : "Sukurti"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-sm"
                  >
                    Atšaukti
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Table Section - Right */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Tvarkaraščiai ({filteredSchedules.length})
                </h2>
                <input
                  type="text"
                  className="border rounded px-3 py-1 text-sm w-64"
                  placeholder="Ieškoti pagal maršrutą, pavadinimą..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <p className="p-6 text-sm text-slate-500">Kraunama...</p>
            ) : error ? (
              <p className="p-6 text-sm text-red-500">{error}</p>
            ) : filteredSchedules.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">
                Tvarkaraščių nerasta
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Maršrutas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Pavadinimas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Laikas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Tipas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Transportas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                        Veiksmai
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSchedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-blue-600">
                            {schedule.marsrutoNr}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {schedule.pavadinimas || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatTime(schedule.atvykimoLaikas)} - {formatTime(schedule.isvykimoLaikas)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {getDayTypeDisplay(schedule.dienosTipas)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {schedule.transportoPriemonesKodas || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(schedule)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Redaguoti
                            </button>
                            <button
                              onClick={() => handleDelete(schedule.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Šalinti
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;