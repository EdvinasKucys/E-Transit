import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ticketService } from "../services/TicketService";
import { API_CONFIG } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

interface DiscountDto {
  id: number;
  // API may return different casing (Pavadinimas / pavadinimas / name)
  Pavadinimas?: string;
  pavadinimas?: string;
  name?: string;
  // percent might be Procentas / procentas / percent
  Procentas?: number;
  procentas?: number;
  percent?: number;
}

interface NormalizedDiscount {
  id: number;
  name: string;
  percent: number;
}

const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [discounts, setDiscounts] = useState<NormalizedDiscount[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);

  const [selectedDiscount, setSelectedDiscount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("kortele");
  const [ticketId, setTicketId] = useState<string>("");
  const [vehicleCode, setVehicleCode] = useState<string>("");
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [cashCode, setCashCode] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [paypalEmail, setPaypalEmail] = useState<string>("");
  const [paypalPassword, setPaypalPassword] = useState<string>("");

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Load existing tickets
  useEffect(() => {
    const fetchTickets = async () => {
      // Ensure we have a user ID before fetching
      if (!user?.idNaudotojas) return; 

      try {
        setLoading(true);
        // CORRECTED: Pass the User ID to filter tickets
        const data = await ticketService.getPassengerTickets(user.idNaudotojas);
        setTickets(data);
      } catch (err) {
        console.error(err);
        setError("Nepavyko gauti bilietų duomenų.");
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch when 'user' is available
    if (user) { 
        fetchTickets();
    }
  }, [user]); // Dependency on user ensures it runs after login loads

  // Load available vehicles for dropdown
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const res = await fetch(`${API_CONFIG.baseURL}/vehicles`);
        if (!res.ok) return;
        const data = await res.json();
        // normalize plates (handle different casing)
        const plates = data.map((v: any) => v.ValstybiniaiNum ?? v.valstybiniaiNum ?? v.valstybiniai_num ?? "").filter((p: string) => !!p);
        setVehicles(plates);
      } catch (e) {
        console.error("Failed to load vehicles", e);
      }
    };
    loadVehicles();
  }, []);

  // Load discounts from database
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoadingDiscounts(true);
        const data = await ticketService.getDiscounts();

        // Normalize API response to a consistent shape (name, percent)
        const normalized = (data || []).map((d) => ({
          id: d.id,
          name: d.Pavadinimas ?? d.pavadinimas ?? d.name ?? "Nuolaida",
          percent: d.Procentas ?? d.procentas ?? d.percent ?? 0,
        }));

        // Deduplicate by id (keep first occurrence)
        const byId = new Map<number, NormalizedDiscount>();
        for (const d of normalized) {
          if (!byId.has(d.id)) byId.set(d.id, d);
        }
        const unique = Array.from(byId.values());

        // If DB already contains the "Be nuolaidos" record (id === 1), prefer it as first choice.
        // Otherwise fall back to a local "Be nuolaidos" option with id 0.
        let final: NormalizedDiscount[] = [];
        const idOne = unique.find((x) => x.id === 1);
        if (idOne) {
          final = [idOne, ...unique.filter((x) => x.id !== 1)];
          // ensure we don't include duplicate local placeholder
        } else {
          final = [{ id: 0, name: "Be nuolaidos", percent: 0 }, ...unique];
        }

        setDiscounts(final);
        // set default selected discount to the first option (prefer id 1 when present)
        if (final.length > 0) setSelectedDiscount(String(final[0].id));
      } catch (err) {
        console.error("Nepavyko įkelti nuolaidų:", err);
        setError("Nepavyko įkelti nuolaidų.");
        setDiscounts([{ id: 0, name: "Be nuolaidos", percent: 0 }]);
        setSelectedDiscount("0");
      } finally {
        setLoadingDiscounts(false);
      }
    };
    fetchDiscounts();
  }, []);

  // Buy a new ticket
  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?. idNaudotojas
    ) {
        setError("Nepavyko nustatyti vartotojo ID.");
        return;
    }

    // Validate payment fields depending on chosen method
    if (paymentMethod === "kortele") {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        setError("Įveskite kortelės numerį, galiojimo datą ir CVV.");
        return;
      }
    }

    if (paymentMethod === "paypal") {
      if (!paypalEmail.trim() || !paypalPassword.trim()) {
        setError("Įveskite PayPal el. paštą ir slaptažodį.");
        return;
      }
    }

    if (paymentMethod === "grynais") {
      if (!cashCode.trim()) {
        setError("Įveskite arba sugeneruokite bilieto kodą grynais.");
        return;
      }
    }

    try {
      const newTicket = await ticketService.purchase({
        naudotojasId: user.idNaudotojas,
        nuolaidaId: parseInt(selectedDiscount) || null,
        paymentMethod,
        paymentDetails: paymentMethod === "kortele" ? { cardNumber, cardExpiry, cardCvv } :
                         paymentMethod === "paypal" ? { paypalEmail } :
                         paymentMethod === "grynais" ? { cashCode } : undefined
      });

      alert(`Bilietas sėkmingai nupirktas!\nID: ${newTicket.id}`);
      setTickets((prev) => [newTicket, ...prev]); // Add new ticket to top of list
      setError(null);
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
      setError(null);
      
      // Optional: Refresh tickets to see updated status
      if (user?.idNaudotojas) {
         const updated = await ticketService.getPassengerTickets(user.idNaudotojas);
         setTickets(updated);
      }
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
              disabled={loadingDiscounts}
            >
              {loadingDiscounts ? (
                <option>Kraunama...</option>
              ) : (
                discounts.map((discount) => (
                  <option key={discount.id} value={discount.id}>
                    {discount.name} ({discount.percent}%)
                  </option>
                ))
              )}
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
          
          {/* Payment Forms */}
          {paymentMethod === "kortele" && (
            <div className="space-y-2 mt-2">
              <label className="block text-sm font-medium text-gray-700">
                Kortelės numeris
              </label>
              <input type="text" className="w-full border rounded-md px-3 py-2" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
              <div className="flex space-x-2">
                <input type="text" className="w-1/2 border rounded-md px-3 py-2" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} required />
                <input type="text" className="w-1/2 border rounded-md px-3 py-2" placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} required />
              </div>
            </div>
          )}

          {paymentMethod === "paypal" && (
            <div className="space-y-2 mt-2">
              <label className="block text-sm font-medium text-gray-700">
                PayPal el. paštas
              </label>
              <input type="email" className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} required />
              <input type="password" className="w-full border rounded-md px-3 py-2" placeholder="Password" value={paypalPassword} onChange={(e) => setPaypalPassword(e.target.value)} required />
            </div>
          )}

          {paymentMethod === "grynais" && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-600">Apmokėjimas grynais vairuotojui transporto priemonėje.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="Bilieto kodas arba generuoti naują"
                  value={cashCode}
                  onChange={(e) => setCashCode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    // generate 8-char alphanumeric code
                    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    let code = '';
                    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
                    setCashCode(code);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-2 rounded-md"
                >
                  Generuoti
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!cashCode) return;
                    try { navigator.clipboard.writeText(cashCode); alert('Kodas nukopijuotas'); } catch { }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded-md"
                >
                  Kopijuoti
                </button>
              </div>
              <p className="text-xs text-gray-500">Pateikite šį kodą vairuotojui kaip įrodymą apie apmokėjimą.</p>
            </div>
          )}

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
            disabled={loadingDiscounts}
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
            {vehicles.length > 0 ? (
              <select
                value={vehicleCode}
                onChange={(e) => setVehicleCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pasirinkite transporto priemonę --</option>
                {vehicles.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={vehicleCode}
                onChange={(e) => setVehicleCode(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Pvz. ABC123"
              />
            )}
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
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Kaina</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Nuolaida</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Statusas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((t) => {
                const discount = discounts.find((d) => d.id === t.nuolaidaId);
                const discountName = discount ? `${discount.name} (${discount.percent}%)` : "Be nuolaidos";
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-2">{t.id}</td>
                    <td className="px-4 py-2">{t.galutineKaina} €</td>
                    <td className="px-4 py-2">{discountName}</td>
                    <td className="px-4 py-2">
                      {t.statusas === 1 ? "Nupirktas" :
                       t.statusas === 2 ? "Aktyvuotas" :
                       t.statusas === 3 ? "Pasibaigęs" :
                       "Nežinomas"}
                    </td>
                  </tr>
                );
              })}
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
