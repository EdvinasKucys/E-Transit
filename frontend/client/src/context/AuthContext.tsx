// src/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import authService, { LoginResponse } from "../services/authService";

export type Role = "passenger" | "inspector" | "admin" | "driver";

export interface User {
  idNaudotojas: number;
  name: string;
  role: Role;
  email?: string;
  slapyvardis: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<User>;
  register: (data: {
    vardas: string;
    pavarde: string;
    slapyvardis: string;
    slaptazodis: string;
    gimimoData?: string;
    miestas?: string;
    elPastas?: string;
  }) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map database role to frontend role
  const mapRole = (dbRole: string): Role => {
    const roleMap: Record<string, Role> = {
      "Keleivis": "passenger",
      "Vairuotojas": "driver",
      "Kontrolierius": "inspector",
      "Administratorius": "admin",
    };
    return roleMap[dbRole] || "passenger";
  };

  // Login with username and password
  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response: LoginResponse = await authService.login({
        slapyvardis: username,
        slaptazodis: password,
      });

      const mappedRole = mapRole(response.role);

      const newUser: User = {
        idNaudotojas: response.idNaudotojas,
        name: `${response.vardas} ${response.pavarde}`,
        role: mappedRole,
        email: response.elPastas,
        slapyvardis: response.slapyvardis,
      };

      setUser(newUser);
      return newUser;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new passenger
  const register = async (data: {
    vardas: string;
    pavarde: string;
    slapyvardis: string;
    slaptazodis: string;
    gimimoData?: string;
    miestas?: string;
    elPastas?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);

      setUser({
        idNaudotojas: response.idNaudotojas,
        name: `${data.vardas} ${data.pavarde}`,
        role: "passenger",
        email: data.elPastas,
        slapyvardis: response.slapyvardis,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Registration failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
