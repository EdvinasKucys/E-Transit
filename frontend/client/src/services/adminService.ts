import { API_CONFIG } from '../api/apiClient';

export interface CreateWorkerRequest {
  vardas: string;
  pavarde: string;
  slapyvardis: string;
  slaptazodis: string;
  role: 'Vairuotojas' | 'Kontrolierius' | 'Administratorius';
  elPastas?: string;
  gimimoData?: string;
  miestas?: string;
  vairavimosStazas?: number;
}

export interface CreateWorkerResponse {
  idNaudotojas: number;
  slapyvardis: string;
  role: string;
  message: string;
}

export interface Worker {
  idNaudotojas: number;
  vardas: string;
  pavarde: string;
  slapyvardis: string;
  role: string;
  elPastas?: string;
}

class AdminService {
  private baseURL = `${API_CONFIG.baseURL}/auth`;

  async createWorker(data: CreateWorkerRequest): Promise<CreateWorkerResponse> {
    try {
      const response = await fetch(`${this.baseURL}/create-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'Administratorius',
        },
        body: JSON.stringify({
          vardas: data.vardas,
          pavarde: data.pavarde,
          slapyvardis: data.slapyvardis,
          slaptazodis: data.slaptazodis,
          role: data.role,
          elPastas: data.elPastas && data.elPastas.trim() ? data.elPastas : null,
          gimimoData: data.gimimoData ? new Date(data.gimimoData).toISOString() : null,
          miestas: data.miestas && data.miestas.trim() ? data.miestas : null,
          vairavimosStazas: data.vairavimosStazas,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || `Failed to create worker account (${response.status})`);
        } else {
          const text = await response.text();
          throw new Error(`Server error (${response.status}): ${text || 'No response body'}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid response format: expected JSON but got ${contentType || 'unknown'}. Response: ${text}`);
      }

      return response.json();
    } catch (error) {
      console.error('Worker creation error:', error);
      throw error;
    }
  }

  async getWorkers(): Promise<Worker[]> {
    const response = await fetch(`${this.baseURL}/workers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Administratorius' },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch workers (${response.status})`);
      } else {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text || 'No response body'}`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid response format: expected JSON but got ${contentType || 'unknown'}. Response: ${text}`);
    }

    return response.json();
  }

  async updateWorkerRole(id: number, role: Worker['role']): Promise<void> {
    const response = await fetch(`${this.baseURL}/workers/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Administratorius' },
      body: JSON.stringify({ role })
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update role (${response.status})`);
      } else {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text || 'No response body'}`);
      }
    }
  }

  async deleteWorker(id: number): Promise<void> {
    const response = await fetch(`${this.baseURL}/workers/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': 'Administratorius' },
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.message || `Failed to delete worker (${response.status})`);
      } else {
        const text = await response.text();
        throw new Error(`Server error (${response.status}): ${text || 'No response body'}`);
      }
    }
  }
}

export default new AdminService();
