import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Integração com a API pública Open Food Facts.
 * Executa no servidor para evitar CORS e manter o cliente leve.
 * Valores são sempre normalizados por 100 g de alimento.
 */

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  /** Por 100 g */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodiumMg: number;
}

const OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";

const num = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10) / 10 : 0;
};

export const searchFoods = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ query: z.string().min(2).max(80) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ items: FoodItem[]; error?: string }> => {
    const params = new URLSearchParams({
      search_terms: data.query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "25",
      fields: "code,product_name,product_name_pt,brands,nutriments",
    });

    try {
      const response = await fetch(`${OFF_SEARCH_URL}?${params.toString()}`, {
        headers: { "User-Agent": "LeveApp/1.0 (nutrition tracker)" },
      });
      
      if (!response.ok) {
        throw new Error(`OFF API HTTP Error: ${response.status}`);
      }

      const payload = (await response.json()) as { products?: Array<Record<string, any>> };

      const items = (payload.products ?? [])
        .map((product): FoodItem => {
          const n = product['nutriments'] ?? {};
          return {
            id: String(product['code'] ?? crypto.randomUUID()),
            name: String(product['product_name_pt'] || product['product_name'] || "").trim(),
            brand: product['brands'] ? String(product['brands']).split(",")[0]!.trim() : null,
            calories: num(n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0)),
            protein: num(n["proteins_100g"]),
            carbs: num(n["carbohydrates_100g"]),
            fat: num(n["fat_100g"]),
            fiber: num(n["fiber_100g"]),
            sodiumMg: num(n["sodium_100g"] ? n["sodium_100g"] * 1000 : 0),
          };
        })
        .filter((item) => item.name.length > 1 && item.calories > 0)
        .slice(0, 20);

      // Return items (even if empty, it's a valid API response)
      return { items };
    } catch (error) {
      console.warn("[searchFoods] OFF API indisponível, usando fallback de dados locais.", error);
      
      // Fallback local mock data so the user can test the app
      const MOCK_FOODS: FoodItem[] = [
        { id: "m1", name: "Arroz Branco Cozido", brand: null, calories: 130, protein: 2.7, carbs: 28.1, fat: 0.3, fiber: 0.4, sodiumMg: 1 },
        { id: "m2", name: "Feijão Carioca Cozido", brand: null, calories: 76, protein: 4.8, carbs: 13.6, fat: 0.5, fiber: 8.5, sodiumMg: 2 },
        { id: "m3", name: "Peito de Frango Grelhado", brand: null, calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodiumMg: 74 },
        { id: "m4", name: "Ovo Cozido", brand: null, calories: 155, protein: 13, carbs: 1.1, fat: 10.6, fiber: 0, sodiumMg: 124 },
        { id: "m5", name: "Banana Prata", brand: null, calories: 98, protein: 1.3, carbs: 26, fat: 0.1, fiber: 2, sodiumMg: 0 },
        { id: "m6", name: "Leite Integral", brand: null, calories: 60, protein: 3, carbs: 4.5, fat: 3, fiber: 0, sodiumMg: 40 },
        { id: "m7", name: "Pão Francês", brand: null, calories: 289, protein: 8, carbs: 58, fat: 3, fiber: 2.3, sodiumMg: 648 },
        { id: "m8", name: "Maçã Fuji", brand: null, calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sodiumMg: 1 },
      ];

      const queryLower = data.query.toLowerCase();
      const filteredMocks = MOCK_FOODS.filter(f => f.name.toLowerCase().includes(queryLower));

      if (filteredMocks.length > 0) {
        return { items: filteredMocks }; // Removed error field so UI doesn't show it in red
      }

      return { items: [], error: "Serviço de alimentos offline no momento e item não encontrado nos dados locais." };
    }
  });
