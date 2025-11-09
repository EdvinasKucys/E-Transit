// src/services/ticketService.ts
import axios from "axios";

// change this to your backend URL
const API_BASE = "http://localhost:5000";

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

export const ticketService = {
  // 1) PASSENGER: get their tickets
  async getPassengerTickets(user?: string) {
    const res = await axios.get<TicketDto[]>(
      `${API_BASE}/api/passenger/tickets`,
      user ? { params: { user } } : undefined
    );
    return res.data;
  },

  // 2) PASSENGER: buy a ticket
  async purchase(data: { naudotojas?: string | null; nuolaidaId?: number | null }) {
    const res = await axios.post<TicketDto>(
      `${API_BASE}/api/passenger/tickets/purchase`,
      {
        naudotojas: data.naudotojas ?? null,
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
};
