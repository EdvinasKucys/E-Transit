// frontend/client/src/services/gedimasService.ts
import { API_CONFIG } from '../api/apiClient';

export interface Gedimas {
  idGedimas: number;
  data?: string;
  komentaras?: string;
  gedimoTipas?: string;
  gedimoBusena?: string;
  valstybiniaiNum?: string;
}

export interface CreateGedimasRequest {
  valstybiniaiNum: string;
  gedimoTipas?: string;
  komentaras?: string;
}

class GedimasService {
  private baseUrl = `${API_CONFIG.baseURL}/gedimas`;

  async getVehicleGedimai(valstybiniaiNum: string): Promise<Gedimas[]> {
    try {
      const response = await fetch(`${this.baseUrl}/vehicle/${valstybiniaiNum}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch malfunctions: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching gedimai:', error);
      throw error;
    }
  }

  async createGedimas(data: CreateGedimasRequest, driverId?: number): Promise<Gedimas> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (driverId !== undefined) {
        headers['X-User-Id'] = driverId.toString();
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to create malfunction: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error creating gedimas:', error);
      throw error;
    }
  }

  async resolveGedimas(id: number): Promise<Gedimas> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to resolve malfunction: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error resolving gedimas:', error);
      throw error;
    }
  }
}

export const gedimasService = new GedimasService();
