import { API_CONFIG } from '../api/apiClient';

export interface FuelDataPoint {
  data: string;
  kuroKiekis: number;
  nukeliautasAtstumas: number;
}

export interface VehicleFuelStats {
  valstybiniaiNum: string;
  kuroTipas: string;
  fuelData: FuelDataPoint[];
  totalFuelUsed: number;
  totalDistance: number;
  averageConsumption: number;
}

export interface CreateSanaudosRequest {
  data: string;
  nukeliautasAtstumas: number;
  kuroKiekis: number;
  valstybiniaiNum: string;
}

const fuelStatsService = {
  // Get fuel stats for all vehicles
  getAllVehiclesFuelStats: async (
    startDate?: string,
    endDate?: string
  ): Promise<VehicleFuelStats[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = `${API_CONFIG.baseURL}/sanaudos/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch fuel stats');
    }
    return response.json();
  },

  // Get fuel stats for a specific vehicle
  getVehicleFuelStats: async (
    valstybiniaiNum: string,
    startDate?: string,
    endDate?: string
  ): Promise<VehicleFuelStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = `${API_CONFIG.baseURL}/sanaudos/vehicle/${valstybiniaiNum}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch vehicle fuel stats');
    }
    return response.json();
  },

  // Create a new fuel consumption record
  createFuelRecord: async (request: CreateSanaudosRequest): Promise<void> => {
    const response = await fetch(`${API_CONFIG.baseURL}/sanaudos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create fuel record');
    }
  },
};

export default fuelStatsService;
