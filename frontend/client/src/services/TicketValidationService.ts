// src/services/ticketValidationService.ts
import axios from "axios";

const API_BASE = "http://localhost:5000"; // 👈 change to your backend port
const VALIDATION_URL = `${API_BASE}/api/TicketValidation`;

export const ticketValidationService = {
  // matches: POST api/TicketValidation/{ticketId}
  async validate(ticketId: string, data: { transportoPriemonesKodas?: string | null }) {
    const res = await axios.post(`${VALIDATION_URL}/${ticketId}`, {
      transportoPriemonesKodas: data.transportoPriemonesKodas ?? null,
    });
    return res.data;
  },
};
