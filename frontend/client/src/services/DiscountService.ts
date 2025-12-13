import { API_CONFIG } from "../api/apiClient";

const baseURL = `${API_CONFIG.baseURL}/discounts`;

export interface Discount {
  id: number;
  pavadinimas: string;
  procentas: number;
}

export interface DiscountForm {
  name: string;
  percent: number;
}




export const discountService = {
  async getAll(): Promise<Discount[]> {
    const res = await fetch(baseURL);
    if (!res.ok) throw new Error("Nepavyko gauti nuolaidų");
    return res.json();
  },
    async remove(id: number): Promise<void> {
    const res = await fetch(`${baseURL}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Nepavyko ištrinti nuolaidos");
  },

  async create(data: DiscountForm): Promise<Discount> {
    const res = await fetch(baseURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pavadinimas: data.name,
        procentas: data.percent,
      }),
    });
    if (!res.ok) throw new Error("Nepavyko sukurti nuolaidos");
    return res.json();
  },

  async update(id: number, data: DiscountForm): Promise<Discount> {
    const res = await fetch(`${baseURL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pavadinimas: data.name,
        procentas: data.percent,
      }),
    });
    if (!res.ok) throw new Error("Nepavyko atnaujinti nuolaidos");
    return res.json();
  },
  
};
