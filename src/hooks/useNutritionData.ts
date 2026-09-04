import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildNutritionPlan,
  type ActivityLevel,
  type BiologicalSex,
  type NutritionPlan,
} from "@/lib/nutrition";

export interface Profile {
  id: string;
  display_name: string | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  height_cm: number | null;
  age_years: number | null;
  biological_sex: BiologicalSex | null;
  activity_level: ActivityLevel | null;
  onboarded: boolean;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  meal: MealType;
  food_name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
}

export function todayKey(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, weight_kg, target_weight_kg, height_cm, age_years, biological_sex, activity_level, onboarded",
        )
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function planFromProfile(profile?: Profile | null): NutritionPlan | null {
  if (
    !profile?.weight_kg ||
    !profile.height_cm ||
    !profile.age_years ||
    !profile.biological_sex ||
    !profile.activity_level
  ) {
    return null;
  }
  return buildNutritionPlan({
    weightKg: Number(profile.weight_kg),
    heightCm: Number(profile.height_cm),
    ageYears: Number(profile.age_years),
    sex: profile.biological_sex,
    activityLevel: profile.activity_level,
  });
}

export function useFoodEntries(userId?: string, date = todayKey()) {
  return useQuery({
    queryKey: ["food_entries", userId, date],
    enabled: Boolean(userId),
    queryFn: async (): Promise<FoodEntry[]> => {
      const { data, error } = await supabase
        .from("food_entries")
        .select(
          "id, meal, food_name, grams, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg",
        )
        .eq("user_id", userId!)
        .eq("log_date", date)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FoodEntry[];
    },
  });
}

export function useWaterTotal(userId?: string, date = todayKey()) {
  return useQuery({
    queryKey: ["water", userId, date],
    enabled: Boolean(userId),
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", userId!)
        .eq("log_date", date);
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + Number(row.amount_ml), 0);
    },
  });
}

export function useAddWater(userId?: string, date = todayKey()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amountMl: number) => {
      const { error } = await supabase
        .from("water_logs")
        .insert({ user_id: userId!, log_date: date, amount_ml: amountMl });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["water", userId, date] }),
  });
}

export function useRemoveWater(userId?: string, date = todayKey()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await supabase
        .from("water_logs")
        .select("id")
        .eq("user_id", userId!)
        .eq("log_date", date)
        .order("created_at", { ascending: false })
        .limit(1);
      const firstLog = data?.[0];
      if (firstLog) {
        const { error } = await supabase.from("water_logs").delete().eq("id", firstLog.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["water", userId, date] }),
  });
}

export function useAddFoodEntry(userId?: string, date = todayKey()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<FoodEntry, "id">) => {
      const { error } = await supabase
        .from("food_entries")
        .insert({ ...entry, user_id: userId!, log_date: date });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food_entries", userId, date] }),
  });
}

export function useDeleteFoodEntry(userId?: string, date = todayKey()) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food_entries", userId, date] }),
  });
}

export interface ProfileUpdate {
  weight_kg?: number;
  target_weight_kg?: number;
  height_cm?: number;
  age_years?: number;
  biological_sex?: BiologicalSex;
  activity_level?: ActivityLevel;
}

export function useUpdateProfile(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

export function sumEntries(entries: FoodEntry[] = []) {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + Number(entry.calories),
      protein: acc.protein + Number(entry.protein_g),
      carbs: acc.carbs + Number(entry.carbs_g),
      fat: acc.fat + Number(entry.fat_g),
      fiber: acc.fiber + Number(entry.fiber_g),
      sodium: acc.sodium + Number(entry.sodium_mg),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
  );
}
