// frontend/client/src/services/vehicleService.ts
import { API_CONFIG } from '../api/apiClient';

export interface Vehicle {
  valstybiniaiNum: string;
  rida: number;
  vietuSk: number;
  kuroTipas: number;
  fkVairuotojasIdNaudotojas?: number | null;
  vairuotojasVardas?: string | null;
  vairuotojasPavarde?: string | null;
  fkMarsrutasNumeris?: number | null;
  marsrutasPavadinimas?: string | null;
}

export interface CreateVehicleDto {
  valstybiniaiNum: string;
  rida: number;
  vietuSk: number;
  kuroTipas: number;
  fkVairuotojasIdNaudotojas?: number | null;
  fkMarsrutasNumeris?: number | null;
}

export interface UpdateVehicleDto {
  rida: number;
  vietuSk: number;
  kuroTipas: number;
  fkVairuotojasIdNaudotojas?: number | null;
  fkMarsrutasNumeris?: number | null;
}

export interface Driver {
  idNaudotojas: number;
  vardas: string;
  pavarde: string;
}

export interface Route {
  numeris: number;
  pavadinimas: string;
}

class VehicleService {
  private baseUrl = `${API_CONFIG.baseURL}/vehicles`;

  private getHeaders(userRole?: string, userId?: number): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (userRole) {
      // Map frontend role to backend role
      const roleMap: Record<string, string> = {
        "passenger": "Keleivis",
        "driver": "Vairuotojas",
        "inspector": "Kontrolierius",
        "admin": "Administratorius",
      };
      headers['X-User-Role'] = roleMap[userRole] || userRole;
    }
    if (userId !== undefined) {
      headers['X-User-Id'] = userId.toString();
    }
    
    return headers;
  }

  async getAllVehicles(userRole?: string, userId?: number): Promise<Vehicle[]> {
    const response = await fetch(this.baseUrl, {
      headers: this.getHeaders(userRole, userId),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
    }
    return response.json();
  }

  async getVehicleByNumber(valstybiniaiNum: string): Promise<Vehicle> {
    const response = await fetch(`${this.baseUrl}/${valstybiniaiNum}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle ${valstybiniaiNum}: ${response.statusText}`);
    }
    return response.json();
  }

  async createVehicle(vehicleData: CreateVehicleDto): Promise<Vehicle> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to create vehicle: ${response.statusText}`);
    }

    return response.json();
  }

  async updateVehicle(valstybiniaiNum: string, vehicleData: UpdateVehicleDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${valstybiniaiNum}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to update vehicle: ${response.statusText}`);
    }
  }

  async deleteVehicle(valstybiniaiNum: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${valstybiniaiNum}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Failed to delete vehicle: ${response.statusText}`);
    }
  }

  // Get available drivers (workers with role Vairuotojas)
  async getDrivers(): Promise<Driver[]> {
    // Use dedicated backend endpoint for drivers
    const response = await fetch(`${API_CONFIG.baseURL}/auth/drivers`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': 'Administratorius',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch drivers');
    }
    const workers = await response.json();
    return workers.map((w: any) => ({
      idNaudotojas: w.idNaudotojas,
      vardas: w.vardas,
      pavarde: w.pavarde,
    }));
  }

  // Get available routes
  async getRoutes(): Promise<Route[]> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/routes`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(`Routes endpoint returned ${response.status}:`, text);
        throw new Error(`Failed to fetch routes: ${response.status} ${response.statusText}`);
      }
      const routes = await response.json();
      return routes.map((r: any) => ({
        numeris: r.numeris,
        pavadinimas: r.pavadinimas,
      }));
    } catch (err) {
      console.error('getRoutes error:', err);
      throw err;
    }
  }
}

export const vehicleService = new VehicleService();
