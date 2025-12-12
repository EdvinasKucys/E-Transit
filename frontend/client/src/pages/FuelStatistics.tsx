import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import fuelStatsService, { VehicleFuelStats } from '../services/fuelStatsService';

const FuelStatistics: React.FC = () => {
  const [fuelStats, setFuelStats] = useState<VehicleFuelStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');

  const fetchFuelStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      let startDate: string | undefined;

      if (dateRange === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      }

      const data = await fuelStatsService.getAllVehiclesFuelStats(startDate);
      setFuelStats(data);
    } catch (err) {
      console.error('Error fetching fuel stats:', err);
      setError('Nepavyko įkelti kuro sąnaudų duomenų');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelStats();
  }, [dateRange]);

  const filteredStats = selectedVehicle === 'all' 
    ? fuelStats 
    : fuelStats.filter(s => s.valstybiniaiNum === selectedVehicle);

  // Prepare data for consumption comparison chart
  const comparisonData = fuelStats.map(vehicle => ({
    name: vehicle.valstybiniaiNum,
    'Vidutinės sąnaudos (L/100km)': parseFloat(vehicle.averageConsumption.toFixed(2)),
    'Bendras kuras (L)': parseFloat(vehicle.totalFuelUsed.toFixed(2)),
    'Bendras atstumas (km)': parseFloat(vehicle.totalDistance.toFixed(2)),
  }));

  // Prepare timeline data for selected vehicle(s)
  const timelineData = filteredStats.flatMap(vehicle =>
    vehicle.fuelData.map(point => ({
      date: new Date(point.data).toLocaleDateString('lt-LT'),
      vehicle: vehicle.valstybiniaiNum,
      kuras: parseFloat(point.kuroKiekis.toFixed(2)),
      atstumas: parseFloat(point.nukeliautasAtstumas.toFixed(2)),
    }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get fuel type label
  const getFuelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Benzinas': 'Benzinas',
      'Dyzelinas': 'Dyzelinas',
      'Elektra': 'Elektra',
      'LPG': 'LPG',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-600">Kraunama...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchFuelStats}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Bandyti dar kartą
        </button>
      </div>
    );
  }

  if (fuelStats.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
        <p className="text-slate-600">Nėra kuro sąnaudų duomenų</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Laikotarpis
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as 'week' | 'month' | 'all')}
              className="px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="week">Paskutinė savaitė</option>
              <option value="month">Paskutinis mėnuo</option>
              <option value="all">Visi duomenys</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Transporto priemonė
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="all">Visos transporto priemonės</option>
              {fuelStats.map(vehicle => (
                <option key={vehicle.valstybiniaiNum} value={vehicle.valstybiniaiNum}>
                  {vehicle.valstybiniaiNum} ({getFuelTypeLabel(vehicle.kuroTipas)})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchFuelStats}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Atnaujinti
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredStats.map(vehicle => (
          <div key={vehicle.valstybiniaiNum} className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold text-lg mb-2">{vehicle.valstybiniaiNum}</h4>
            <p className="text-sm text-slate-600 mb-3">
              Kuro tipas: {getFuelTypeLabel(vehicle.kuroTipas)}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Bendras kuras:</span>
                <span className="font-medium">
                  {vehicle.totalFuelUsed.toFixed(2)} {vehicle.kuroTipas === 'Elektra' ? 'kWh' : 'L'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Bendras atstumas:</span>
                <span className="font-medium">{vehicle.totalDistance.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Vidutinės sąnaudos:</span>
                <span className="font-medium">
                  {vehicle.averageConsumption.toFixed(2)} {vehicle.kuroTipas === 'Elektra' ? 'kWh' : 'L'}/100km
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Average Consumption Comparison Chart */}
      {selectedVehicle === 'all' && fuelStats.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Vidutinių sąnaudų palyginimas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Vidutinės sąnaudos (L/100km)" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline Chart */}
      {timelineData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Kuro sąnaudos per laiką</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="kuras" 
                stroke="#3b82f6" 
                name="Kuras (L)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distance Timeline Chart */}
      {timelineData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Nuvažiuotas atstumas per laiką</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="atstumas" 
                stroke="#10b981" 
                name="Atstumas (km)" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Data Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Detalūs duomenys</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Transporto priemonė
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Kuro tipas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Bendras kuras
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Bendras atstumas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Vidutinės sąnaudos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Įrašų sk.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStats.map((vehicle) => (
                <tr key={vehicle.valstybiniaiNum} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {vehicle.valstybiniaiNum}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {getFuelTypeLabel(vehicle.kuroTipas)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {vehicle.totalFuelUsed.toFixed(2)} {vehicle.kuroTipas === 'Elektra' ? 'kWh' : 'L'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {vehicle.totalDistance.toFixed(2)} km
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {vehicle.averageConsumption.toFixed(2)} {vehicle.kuroTipas === 'Elektra' ? 'kWh' : 'L'}/100km
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {vehicle.fuelData.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FuelStatistics;
