
import axios from "axios";

const API_BASE = "http://localhost:5011";

export interface TicketDto {
  id: string;
  naudotojas: string | null;
  pirkimoData: string;
  aktyvavimoData?: string | null;
  bazineKaina: number;
  galutineKaina: number;
  nuolaidaId?: number | null;
  transportoPriemonesKodas?: string | null;
  statusas: number;
}

export interface TicketPrice {
  id: number;
  pavadinimas: string;
  kaina: number;
}

// Use YOUR exact DTO name + casing
export interface NuolaidaDto {
  id: number;
  Pavadinimas: string;
  Procentas: number;
}




export const ticketService = {
  // 1) PASSENGER: get their tickets
  async getPassengerTickets(userId?: number) { 
    const res = await axios.get<TicketDto[]>(
      `${API_BASE}/api/passenger/tickets`,
      userId ? { params: { userId } } : undefined // param name must match C# argument
    );
    return res.data;
  },

  // 2) PASSENGER: buy a ticket
  async purchase(data: { naudotojasId: number; nuolaidaId?: number | null }) {
    const res = await axios.post<TicketDto>(
      `${API_BASE}/api/passenger/tickets/purchase`,
      {
        naudotojasId: data.naudotojasId, // Send ID
        nuolaidaId: data.nuolaidaId ?? null,
      }
    );
    return res.data;
  },

  // 3) PASSENGER: mark (pažymėti) a ticket
  async mark(ticketId: string, data: { transportoPriemonesKodas?: string | null }) {
    await axios.post(
      `${API_BASE}/api/passenger/tickets/${ticketId}/mark`,
      {
        transportoPriemonesKodas: data.transportoPriemonesKodas ?? null,
      }
    );
  },

  // 4) ADMIN: get all tickets
  async getAllAdminTickets() {
    const res = await axios.get<TicketDto[]>(`${API_BASE}/api/admin/tickets`);
    return res.data;
  },

  // 5) ADMIN: get single global ticket price
  async getPrice(): Promise<TicketPrice> {
    const res = await axios.get<TicketPrice>(`${API_BASE}/api/ticket-price`);
    return res.data;
  },

  // 6) ADMIN: update global ticket price
  async updatePrice(data: { pavadinimas: string; kaina: number }): Promise<TicketPrice> {
    const res = await axios.put<TicketPrice>(`${API_BASE}/api/ticket-price`, data);
    return res.data;
  },
  // 7)get all discounts
  async getDiscounts(): Promise<NuolaidaDto[]> {
    const res = await axios.get<NuolaidaDto[]>(`${API_BASE}/api/discounts`);
    return res.data;
  }
};
