// frontend/client/src/services/vehicleService.ts
import { API_CONFIG } from '../api/apiClient';

export interface Vehicle {
  valstybiniaiNum: string; // Removed id, valstybiniaiNum is now the primary key
  rida: number;
  vietuSk: number;
  kuroTipas: number;
}

export interface CreateVehicleDto {
  valstybiniaiNum: string;
  rida: number;
  vietuSk: number;
  kuroTipas: number;
}

export interface UpdateVehicleDto {
  rida: number;        // valstybiniaiNum removed since it can't be changed
  vietuSk: number;
  kuroTipas: number;
}

class VehicleService {
  private baseUrl = `${API_CONFIG.baseURL}/vehicles`;

  async getAllVehicles(): Promise<Vehicle[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
    }
    return response.json();
  }

  async getVehicleByNumber(valstybiniaiNum: string): Promise<Vehicle> {
    const response = await fetch(`${this.baseUrl}/${valstybiniaiNum}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle ${valstybiniaiNum}: ${response.statusText}`);
    }
    return response.json();
  }

  async createVehicle(vehicleData: CreateVehicleDto): Promise<Vehicle> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create vehicle: ${response.statusText}`);
    }
    return response.json();
  }

  async updateVehicle(valstybiniaiNum: string, vehicleData: UpdateVehicleDto): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${valstybiniaiNum}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update vehicle ${valstybiniaiNum}: ${response.statusText}`);
    }
  }

  async deleteVehicle(valstybiniaiNum: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${valstybiniaiNum}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete vehicle ${valstybiniaiNum}: ${response.statusText}`);
    }
  }
}

export const vehicleService = new VehicleService();