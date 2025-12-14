// src/services/ticketValidationService.ts
import axios from "axios";

const API_BASE = "http://localhost:5011"; 
const VALIDATION_URL = `${API_BASE}/api/inspector/tickets`;

export const ticketValidationService = {
  // matches: POST api/inspector/tickets/{id}/validate
  async validate(ticketId: string, data: { transportoPriemonesKodas?: string | null; nuolaidaId?: number | null }) {
    const res = await axios.post(`${VALIDATION_URL}/${ticketId}/validate`, {
      transportoPriemonesKodas: data.transportoPriemonesKodas ?? null,
      nuolaidaId: data.nuolaidaId ?? null,
    });
    return res.data;
  },
};
