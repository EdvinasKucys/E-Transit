import React, { useEffect, useState } from "react";
import { ticketService } from "../services/TicketService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Load all tickets from backend
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await ticketService.getAllAdminTickets();
        setTickets(data);
      } catch (err) {
        console.error(err);
        setError("Nepavyko gauti bilietų duomenų.");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  // Example: aggregate total revenue and count (for demo purposes)
  const totalRevenue = tickets.reduce(
    (sum, t) => sum + (t.galutineKaina || 0),
    0
  );
  const totalTickets = tickets.length;

  if (loading) return <div className="p-6 text-center">Kraunama...</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Administratoriaus valdymas</h1>
        <button
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition duration-200"
        >
          Atsijungti
        </button>
      </div>

      {/* Edit Discounts Section */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Redaguoti nuolaidas</h2>
        <p className="text-gray-600">
          Čia bus galima redaguoti galimas bilietų nuolaidas (pvz., studento, senjoro ir pan.).
        </p>
        <button
          disabled
          className="bg-blue-500 text-white px-4 py-2 rounded-md opacity-70 cursor-not-allowed"
        >
          (Bus įgyvendinta vėliau)
        </button>
      </div>

      {/* Reports Section */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Statistinė ataskaita</h2>
        <p className="text-gray-700">Iš viso parduotų bilietų: {totalTickets}</p>
        <p className="text-gray-700">Bendros pajamos: {totalRevenue.toFixed(2)} €</p>
        <button
          disabled
          className="bg-green-500 text-white px-4 py-2 rounded-md opacity-70 cursor-not-allowed"
        >
          Generuoti ataskaitą (bus įgyvendinta vėliau)
        </button>
      </div>

      {/* Edit Ticket Prices Section */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Redaguoti bilietų kainas</h2>
        <p className="text-gray-600">
          Čia bus galima keisti bazines bilietų kainas pagal tipą ar laikotarpį.
        </p>
        <button
          disabled
          className="bg-yellow-500 text-white px-4 py-2 rounded-md opacity-70 cursor-not-allowed"
        >
          (Bus įgyvendinta vėliau)
        </button>
      </div>

      {/* Ticket Table (Preview of data) */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Bilietų sąrašas (duomenys iš serverio)</h2>
        {tickets.length === 0 ? (
          <p className="text-gray-500">Nėra bilietų duomenų.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naudotojas</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kaina (€)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statusas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2">{t.id}</td>
                  <td className="px-4 py-2">{t.naudotojas || "—"}</td>
                  <td className="px-4 py-2">{t.galutineKaina?.toFixed(2) ?? "—"}</td>
                  <td className="px-4 py-2">{t.statusas === 1 ? "Aktyvus" : "Neaktyvus"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
