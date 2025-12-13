import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ticketService } from "../services/TicketService";
import { useAuth } from "../context/AuthContext";

const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDiscount, setSelectedDiscount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("kortele");
  const [ticketId, setTicketId] = useState<string>("");
  const [vehicleCode, setVehicleCode] = useState<string>("");

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Load existing tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const data = await ticketService.getPassengerTickets();
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

  // Buy a new ticket
  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTicket = await ticketService.purchase({
        naudotojas: user?.name ?? null,
        nuolaidaId: parseInt(selectedDiscount) || null,
      });

      alert(`Bilietas sėkmingai nupirktas!\nID: ${newTicket.id}`);
      setTickets((prev) => [...prev, newTicket]);
    } catch (err) {
      console.error(err);
      setError("Nepavyko nupirkti bilieto.");
    }
  };

  // Mark (activate) a ticket
  const handleMarkTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ticketService.mark(ticketId, {
        transportoPriemonesKodas: vehicleCode || null,
      });
      alert("Bilietas sėkmingai pažymėtas!");
      setTicketId("");
      setVehicleCode("");
    } catch (err) {
      console.error(err);
      setError("Nepavyko pažymėti bilieto.");
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  if (loading) return <div className="p-6 text-center">Kraunama...</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mano bilietai</h1>
        <div className="space-x-3">
          <Link
            to="/routes"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            Maršrutai
          </Link>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            Atsijungti
          </button>
        </div>
      </div>

      {/* Buy Ticket Form */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Pirkti bilietą</h2>
        <form onSubmit={handleBuyTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nuolaida
            </label>
            <select
              value={selectedDiscount}
              onChange={(e) => setSelectedDiscount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Be nuolaidos</option>
              <option value="1">Moksleivio (50%)</option>
              <option value="2">Studento (30%)</option>
              <option value="3">Senjoro (20%)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mokėjimo būdas
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="kortele">Banko kortele</option>
              <option value="paypal">PayPal</option>
              <option value="grynais">Grynais</option>
            </select>
          </div>
           
           {/* Payment‑method specific form */}
            {paymentMethod === "kortele" && (
              <div className="space-y-2 mt-2">
                <label className="block text-sm font-medium text-gray-700">
                  Kortelės numeris
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="1234 5678 9012 3456"
                />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="w-1/2 border rounded-md px-3 py-2"
                    placeholder="MM/YY"
                  />
                  <input
                    type="text"
                    className="w-1/2 border rounded-md px-3 py-2"
                    placeholder="CVV"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div className="space-y-2 mt-2">
                <label className="block text-sm font-medium text-gray-700">
                  PayPal el. paštas
                </label>
                <input
                  type="email"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="you@example.com"
                />
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Password"
                  />
              </div>
              
            )}

            {paymentMethod === "grynais" && (
              <p className="mt-2 text-sm text-gray-600">
                Apmokėjimas grynais vairuotojui transporto priemonėje.
              </p>
            )}

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            Pirkti bilietą
          </button>
        </form>
      </div>

      {/* Mark Ticket Form */}
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Pažymėti bilietą</h2>
        <form onSubmit={handleMarkTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bilieto ID
            </label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Įveskite bilieto ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Transporto priemonės kodas
            </label>
            <input
              type="text"
              value={vehicleCode}
              onChange={(e) => setVehicleCode(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              placeholder="Pvz. ABC123"
            />
          </div>

          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition duration-200"
          >
            Pažymėti
          </button>
        </form>
      </div>

      {/* Ticket List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Turimi bilietai</h2>
        {tickets.length === 0 ? (
          <p className="text-gray-600">Neturite jokių bilietų.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Kaina
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Statusas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2">{t.id}</td>
                  <td className="px-4 py-2">{t.galutineKaina} €</td>
                  <td className="px-4 py-2">
                    {t.statusas === 1 ? "Aktyvus" : "Neaktyvus"}
                  </td>
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

export default TicketsPage;
