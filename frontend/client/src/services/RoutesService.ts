const API_BASE = "http://localhost:5011/api";

export interface RouteStop {
  id: number;
  stotelesPavadinimas: string;
  eilesNr: number;
  atvykimoLaikas?: string;
  isvykimoLaikas?: string;
  atstumasNuoPradzios?: number;
}

export interface Route {
  numeris: string;
  pavadinimas: string;
  pradziosStotele: string;
  pabaigosStotele: string;
  bendrasAtstumas?: number;
  sukurimoData: string;
  atnaujinimoData: string;
  stoteles?: RouteStop[];
  trukme?: number; 
}

export interface Stop {
  pavadinimas: string;
  adresas: string;
  koordinatesX: number;
  koordinatesY: number;
  tipas: string;
}

export const routesService = {
  // Routes
  async getAll(search?: string): Promise<Route[]> {
    const url = search
      ? `${API_BASE}/Routes?search=${encodeURIComponent(search)}`
      : `${API_BASE}/Routes`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch routes");
    return res.json();
  },

  async getOne(numeris: string): Promise<Route> {
    const res = await fetch(`${API_BASE}/Routes/${encodeURIComponent(numeris)}`);
    if (!res.ok) throw new Error(`Failed to fetch route ${numeris}`);
    return res.json();
  },

  async create(data: {
    numeris: string;
    pavadinimas: string;
    pradziosStotele: string;
    pabaigosStotele: string;
    bendrasAtstumas?: number;
    stoteles?: Array<{
      stotelesPavadinimas: string;
      eilesNr: number;
      atvykimoLaikas?: string;
      isvykimoLaikas?: string;
      atstumasNuoPradzios?: number;
    }>;
  }): Promise<Route> {
    const res = await fetch(`${API_BASE}/Routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to create route");
    }
    return res.json();
  },

  async update(
    numeris: string,
    data: {
      pavadinimas: string;
      pradziosStotele: string;
      pabaigosStotele: string;
      bendrasAtstumas?: number;
      stoteles?: Array<{
        stotelesPavadinimas: string;
        eilesNr: number;
        atvykimoLaikas?: string;
        isvykimoLaikas?: string;
        atstumasNuoPradzios?: number;
      }>;
    }
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/Routes/${encodeURIComponent(numeris)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to update route");
    }
  },

  async delete(numeris: string): Promise<void> {
    const res = await fetch(`${API_BASE}/Routes/${encodeURIComponent(numeris)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      let data: any;

      try {
        data = await res.json(); // ProblemDetails
      } catch {
        const t = await res.text();
        throw new Error(t || `Nepavyko ištrinti maršruto ${numeris}`);
      }

      const message = data?.message || data?.title || "Klaida";
      const details = data?.details || data?.detail || "";

      throw new Error(details ? `${message}\n\n${details}` : message);
    }
  },


  // Stops
  async getAllStops(): Promise<Stop[]> {
    const res = await fetch(`${API_BASE}/Stops`);
    if (!res.ok) throw new Error("Failed to fetch stops");
    return res.json();
  },

  async createStop(data: {
    pavadinimas: string;
    adresas: string;
    koordinatesX: number;
    koordinatesY: number;
    tipas: string;
  }): Promise<Stop> {
    const res = await fetch(`${API_BASE}/Stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to create stop");
    }
    return res.json();
  },

  async deleteStop(pavadinimas: string): Promise<void> {
    const res = await fetch(`${API_BASE}/Stops/${encodeURIComponent(pavadinimas)}`, {
      method: "DELETE",
    });
    
    if (!res.ok) {
      let data: any;

      try {
        data = await res.json();  // čia gausi ProblemDetails
      } catch {
        const t = await res.text();
        throw new Error(t || `Nepavyko ištrinti stotelės ${pavadinimas}`);
      }

      const message = data?.message || data?.title || "Klaida";
      const details = data?.details || data?.detail || "";

      throw new Error(details ? `${message}\n\n${details}` : message);
    }
  },
};