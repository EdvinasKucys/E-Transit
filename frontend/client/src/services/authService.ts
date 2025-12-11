import { API_CONFIG } from '../api/apiClient';

export interface LoginRequest {
  slapyvardis: string;
  slaptazodis: string;
}

export interface LoginResponse {
  idNaudotojas: number;
  vardas: string;
  pavarde: string;
  elPastas: string;
  role: string;
  slapyvardis: string;
}

export interface RegisterRequest {
  vardas: string;
  pavarde: string;
  gimimoData?: string;
  miestas?: string;
  elPastas?: string;
  slapyvardis: string;
  slaptazodis: string;
}

export interface RegisterResponse {
  idNaudotojas: number;
  slapyvardis: string;
  role: string;
  message: string;
}

export interface AuthError {
  message: string;
}

class AuthService {
  private baseURL = `${API_CONFIG.baseURL}/auth`;

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slapyvardis: credentials.slapyvardis,
        slaptazodis: credentials.slaptazodis,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseURL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vardas: data.vardas,
        pavarde: data.pavarde,
        gimimoData: data.gimimoData ? new Date(data.gimimoData).toISOString() : null,
        miestas: data.miestas && data.miestas.trim() ? data.miestas : null,
        elPastas: data.elPastas && data.elPastas.trim() ? data.elPastas : null,
        slapyvardis: data.slapyvardis,
        slaptazodis: data.slaptazodis,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }
}

export default new AuthService();
