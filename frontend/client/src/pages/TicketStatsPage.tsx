import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../api/apiClient";

const TicketStatsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDiscount, setSelectedDiscount] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const navigate = useNavigate();
  
  // Derived chart data
  const [lineData, setLineData] = useState<Array<{ date: string; count: number }>>([]);
  const [pieData, setPieData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [discountData, setDiscountData] = useState<{ label: string; value: number; color: string }[]>([]);
  useEffect(() => {
    const fetchTicketStats = async () => {
      try {
        setLoading(true);
        
        // Fetch tickets
        const ticketsRes = await fetch(`${API_CONFIG.baseURL}/admin/tickets`);
        if (!ticketsRes.ok) throw new Error("Nepavyko gauti bilietų duomenų");
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData);
        
        // Fetch discounts for filter dropdown (normalize different casing)
        const discountsRes = await fetch(`${API_CONFIG.baseURL}/discounts`);
        if (discountsRes.ok) {
          const discountsData = await discountsRes.json();
          const normalized = (discountsData || []).map((d: any) => ({
            id: d.id ?? d.Id ?? d.ID,
            pavadinimas: d.Pavadinimas ?? d.pavadinimas ?? d.name ?? d.pavadinimasLt ?? "",
            procentas: d.Procentas ?? d.procentas ?? d.percent ?? 0,
          }));
          setDiscounts(normalized);
        }
        
        // Extract unique vehicles from tickets
        const uniqueVehicles = Array.from(
          new Set(
            ticketsData
              .filter((t: any) => t.transportoPriemonesKodas)
              .map((t: any) => t.transportoPriemonesKodas)
          )
        ).sort();
        setVehicles(uniqueVehicles);
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nepavyko gauti statistikos");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicketStats();
  }, []);

  // Prepare chart data whenever filteredTickets or stats change
  useEffect(() => {
    // Line chart: tickets per day across the filtered range
    if (!filteredTickets || filteredTickets.length === 0) {
      setLineData([]);
    } else {
      const map = new Map<string, number>();
      filteredTickets.forEach((t: any) => {
        const d = new Date(t.pirkimoData);
        const key = d.toISOString().slice(0, 10);
        map.set(key, (map.get(key) || 0) + 1);
      });

      const keys = Array.from(map.keys()).sort();
      const start = new Date(keys[0]);
      const end = new Date(keys[keys.length - 1]);
      const days: string[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d).toISOString().slice(0, 10));
      }
      const points = days.map((date) => ({ date, count: map.get(date) || 0 }));
      setLineData(points);
    }

    // Pie chart: status breakdown
    if (stats) {
      const colors = ["#FBBF24", "#3B82F6", "#9CA3AF"]; // yellow, blue, gray
      const slices = [
        { label: "Nupirktas", value: stats.statusBreakdown.nupirktas || 0, color: colors[0] },
        { label: "Aktyvuotas", value: stats.statusBreakdown.aktyvuotas || 0, color: colors[1] },
        { label: "Pasibaigęs", value: stats.statusBreakdown.pasibaiges || 0, color: colors[2] },
      ];
      setPieData(slices);
      
      // Discount breakdown
      if (stats.discountBreakdown && Object.keys(stats.discountBreakdown).length > 0) {
        const colors2 = ["#EF4444", "#8B5CF6", "#10B981", "#F59E0B", "#06B6D4"];
        const discountSlices = Object.entries(stats.discountBreakdown)
          .map(([label, value], idx) => ({
            label,
            value: value as number,
            color: colors2[idx % colors2.length],
          }))
          .sort((a, b) => b.value - a.value);
        setDiscountData(discountSlices);
      } else {
        setDiscountData([]);
      }
    } else {
      setPieData([]);
      setDiscountData([]);
    }
  }, [filteredTickets, stats]);

  // Simple SVG Line Chart component
  const LineChartSVG: React.FC<{ data: { date: string; count: number }[]; width?: number; height?: number }> = ({ data, width = 600, height = 160 }) => {
    if (!data || data.length === 0) {
      return <div className="text-sm text-gray-500">Nėra duomenų grafike</div>;
    }
    const max = Math.max(...data.map((d) => d.count), 1);
    const padding = 12;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const stepX = innerW / Math.max(1, data.length - 1);
    const points = data
      .map((d, i) => `${padding + i * stepX},${padding + innerH - (d.count / max) * innerH}`)
      .join(" ");

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMid meet">
        <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={padding} x2={width - padding} y1={padding + innerH * p} y2={padding + innerH * p} stroke="#EEE" />
        ))}
        {/* polyline */}
        <polyline fill="none" stroke="#3B82F6" strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
        {/* area */}
        <polygon points={`${points} ${width - padding},${height - padding} ${padding},${height - padding}`} fill="rgba(59,130,246,0.08)" />
        {/* x labels (every Nth) */}
        {data.map((d, i) => {
          const show = data.length <= 8 ? true : i % Math.ceil(data.length / 8) === 0;
          if (!show) return null;
          const x = padding + i * stepX;
          return (
            <text key={d.date} x={x} y={height - 2} fontSize={9} fill="#6B7280" textAnchor="middle">
              {new Date(d.date).toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' })}
            </text>
          );
        })}
      </svg>
    );
  };

  // Simple SVG Pie Chart component
  const PieChartSVG: React.FC<{ data: { label: string; value: number; color: string }[]; size?: number }> = ({ data, size = 160 }) => {
    const total = data.reduce((s, x) => s + x.value, 0);
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;
    let acc = 0;

    if (total === 0) return <div className="text-sm text-gray-500">Nėra duomenų</div>;

    const slices = data.map((slice, idx) => {
      const startAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += slice.value;
      const endAngle = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const large = endAngle - startAngle > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      return <path key={idx} d={path} fill={slice.color} stroke="#fff" strokeWidth={1} />;
    });

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices}
      </svg>
    );
  };

  // Apply filters to tickets
  useEffect(() => {
    let filtered = [...tickets];
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter((t: any) => {
        const ticketDate = new Date(t.pirkimoData).getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) : Infinity;
        return ticketDate >= start && ticketDate <= end;
      });
    } else {
      // Apply quick date range if no custom dates set
      const now = new Date();
      if (dateRange === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter((t: any) => {
          const ticketDate = new Date(t.pirkimoData);
          ticketDate.setHours(0, 0, 0, 0);
          return ticketDate.getTime() === today.getTime();
        });
      } else if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t: any) => new Date(t.pirkimoData) >= weekAgo);
      } else if (dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((t: any) => new Date(t.pirkimoData) >= monthAgo);
      }
    }
    
    // Filter by discount
    if (selectedDiscount) {
      const discountId = parseInt(selectedDiscount);
      if (discountId === 0) {
        filtered = filtered.filter((t: any) => !t.nuolaidaId);
      } else {
        filtered = filtered.filter((t: any) => t.nuolaidaId === discountId);
      }
    }
    
    // Filter by vehicle
    if (selectedVehicle) {
      filtered = filtered.filter((t: any) => t.transportoPriemonesKodas === selectedVehicle);
    }
    
    setFilteredTickets(filtered);
    
    // Recalculate stats
    const totalSold = filtered.length;
    const totalRevenue = filtered.reduce((sum: number, t: any) => sum + (t.galutineKaina || 0), 0);
    const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;
    const activeTickets = filtered.filter((t: any) => t.statusas === 2).length;
    const activationRate = totalSold > 0 ? ((activeTickets / totalSold) * 100).toFixed(1) : 0;
    
    const statusBreakdown = {
      nupirktas: filtered.filter((t: any) => t.statusas === 1).length,
      aktyvuotas: filtered.filter((t: any) => t.statusas === 2).length,
      pasibaiges: filtered.filter((t: any) => t.statusas === 3).length,
    };
    
    // Discount breakdown - use actual discount names from database
    const discountBreakdown: Record<string, number> = {};
    filtered.forEach((t: any) => {
      let discountLabel = "Be nuolaidos";
      if (t.nuolaidaId) {
        const discount = discounts.find((d: any) => d.id === t.nuolaidaId);
        discountLabel = discount ? discount.pavadinimas : `Nuolaida #${t.nuolaidaId}`;
      }
      discountBreakdown[discountLabel] = (discountBreakdown[discountLabel] || 0) + 1;
    });
    
    setStats({
      totalSold,
      totalRevenue,
      avgPrice,
      activeTickets,
      activationRate,
      statusBreakdown,
      discountBreakdown,
    });
  }, [dateRange, startDate, endDate, selectedDiscount, selectedVehicle, tickets, discounts]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Bilietų statistika</h1>
        <button
          onClick={() => navigate("/admin")}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition duration-200"
        >
          Grįžti
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Pasirinkite laikotarpį</h2>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setDateRange("today")}
            className={`px-4 py-2 rounded-md transition ${
              dateRange === "today"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Šiandien
          </button>
          <button
            onClick={() => setDateRange("week")}
            className={`px-4 py-2 rounded-md transition ${
              dateRange === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Savaitė
          </button>
          <button
            onClick={() => setDateRange("month")}
            className={`px-4 py-2 rounded-md transition ${
              dateRange === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Mėnuo
          </button>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Arba pasirinkite datų diapazoną</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nuo</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Iki</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

          {/* Bottom Diagrams */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white shadow-md rounded-lg p-6 md:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Bilietų skaičius per dieną</h3>
              <div className="w-full">
                <LineChartSVG data={lineData} />
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 md:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Bilietų statusų pasiskirstymas</h3>
              <div className="flex flex-col items-center">
                <PieChartSVG data={pieData} size={160} />
                <div className="mt-4 flex flex-col gap-2 text-center">
                  {pieData.map((p) => (
                    <div key={p.label} className="flex items-center justify-center gap-2">
                      <span style={{ width: 12, height: 12, background: p.color, display: 'inline-block' }} className="rounded-sm" />
                      <span className="text-sm text-gray-700">{p.label} — {p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 md:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Nuolaidų pasiskirstymas</h3>
              <div className="flex flex-col items-center">
                <PieChartSVG data={discountData} size={160} />
                <div className="mt-4 flex flex-col gap-2 text-center text-xs">
                  {discountData.map((p) => (
                    <div key={p.label} className="flex items-center justify-center gap-2">
                      <span style={{ width: 10, height: 10, background: p.color, display: 'inline-block' }} className="rounded-sm" />
                      <span className="text-gray-700">{p.label.substring(0, 20)}... — {p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        <div className="border-t pt-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtruoti pagal nuolaidą</h3>
            <select
              value={selectedDiscount}
              onChange={(e) => setSelectedDiscount(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Visos nuolaidos</option>
              <option value="0">Be nuolaidos</option>
              {discounts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.pavadinimas || `Nuolaida ${d.id}`} ({d.procentas}%)
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filtruoti pagal autobusą</h3>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Visi autobusai</option>
              {vehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sold */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Parduoti bilietai</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalSold}</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Iš viso pajamų</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">€{stats.totalRevenue.toFixed(2)}</p>
          </div>

          {/* Average Price */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Vidutinė kaina</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">€{stats.avgPrice.toFixed(2)}</p>
          </div>

          {/* Activation Rate */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Aktyvacijos dalis</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.activationRate}%</p>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white shadow-md rounded-lg p-6 md:col-span-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bilietų statusas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-600">Nupirkti</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.statusBreakdown.nupirktas}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Aktyvuoti</p>
                <p className="text-2xl font-bold text-blue-600">{stats.statusBreakdown.aktyvuotas}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">Pasibaigę</p>
                <p className="text-2xl font-bold text-gray-600">{stats.statusBreakdown.pasibaiges}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded">
          {error}
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Bilietai ({filteredTickets.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Naudotojas</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pirkimo data</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bazinė kaina</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Galutinė kaina</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statusas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                    Nėra bilietų pagal filtrus
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-mono">{ticket.id.substring(0, 8)}...</td>
                    <td className="px-4 py-2 text-sm">{ticket.naudotojas || "-"}</td>
                    <td className="px-4 py-2 text-sm">{new Date(ticket.pirkimoData).toLocaleDateString('lt-LT')}</td>
                    <td className="px-4 py-2 text-sm">€{ticket.bazineKaina.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm font-semibold">€{ticket.galutineKaina.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        ticket.statusas === 1 ? "bg-yellow-100 text-yellow-800" :
                        ticket.statusas === 2 ? "bg-blue-100 text-blue-800" :
                        ticket.statusas === 3 ? "bg-gray-100 text-gray-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {ticket.statusas === 1 ? "Nupirktas" :
                         ticket.statusas === 2 ? "Aktyvuotas" :
                         ticket.statusas === 3 ? "Pasibaigęs" :
                         "Nežinomas"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TicketStatsPage;
