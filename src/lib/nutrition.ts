/**
 * Núcleo de cálculo nutricional do app (foco em emagrecimento).
 *
 * Todas as fórmulas ficam isoladas aqui para serem testáveis e reutilizáveis
 * por qualquer tela (onboarding, dashboard, diário).
 */

export type BiologicalSex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

/** Déficit calórico fixo aplicado à meta diária (Regra de Ouro do app). */
export const WEIGHT_LOSS_DEFICIT_KCAL = 500;

/** Água recomendada: 35 ml por kg de peso corporal. */
export const WATER_ML_PER_KG = 35;

/** Volume padrão de um copo d'água. */
export const GLASS_ML = 500;

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentário (pouco ou nenhum exercício)",
  light: "Leve (1-3 dias por semana)",
  moderate: "Moderado (3-5 dias por semana)",
  active: "Ativo (6-7 dias por semana)",
  very_active: "Muito ativo (trabalho físico / 2x por dia)",
};

/** Distribuição de macronutrientes usada sobre a meta com déficit. */
export const MACRO_SPLIT = { protein: 0.3, carbs: 0.4, fat: 0.3 } as const;

/** Calorias por grama de cada macronutriente. */
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

export interface BodyMetrics {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: BiologicalSex;
  activityLevel: ActivityLevel;
}

export interface NutritionPlan {
  /** Taxa Metabólica Basal — calorias gastas em repouso. */
  bmr: number;
  /** Gasto energético total diário (TMB × fator de atividade). */
  tdee: number;
  /** Meta diária para emagrecer: TDEE − 500 kcal. */
  calorieGoal: number;
  macros: { protein: number; carbs: number; fat: number };
  waterGoalMl: number;
  /** Referências diárias simplificadas de micronutrientes. */
  micros: { fiberG: number; sodiumMg: number };
}

/**
 * Taxa Metabólica Basal pelas fórmulas de Harris-Benedict (revisadas).
 * Homens:   88,362 + (13,397 × peso) + (4,799 × altura) − (5,677 × idade)
 * Mulheres: 447,593 + (9,247 × peso) + (3,098 × altura) − (4,330 × idade)
 */
export function calculateBMR({
  weightKg,
  heightCm,
  ageYears,
  sex,
}: Pick<BodyMetrics, "weightKg" | "heightCm" | "ageYears" | "sex">): number {
  if (sex === "male") {
    return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears;
  }
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears;
}

/** Gasto total = TMB × fator de atividade. */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

/** Meta de água: 35 ml × peso (kg). */
export function calculateWaterGoalMl(weightKg: number): number {
  return Math.round(weightKg * WATER_ML_PER_KG);
}

/** Converte uma meta calórica em gramas de cada macronutriente. */
export function calculateMacros(calorieGoal: number) {
  return {
    protein: Math.round((calorieGoal * MACRO_SPLIT.protein) / KCAL_PER_GRAM.protein),
    carbs: Math.round((calorieGoal * MACRO_SPLIT.carbs) / KCAL_PER_GRAM.carbs),
    fat: Math.round((calorieGoal * MACRO_SPLIT.fat) / KCAL_PER_GRAM.fat),
  };
}

/** Plano completo derivado das medidas corporais. */
export function buildNutritionPlan(metrics: BodyMetrics): NutritionPlan {
  const bmr = calculateBMR(metrics);
  const tdee = calculateTDEE(bmr, metrics.activityLevel);
  // Regra de Ouro: déficit de exatamente 500 kcal sobre o gasto base.
  const calorieGoal = Math.max(1200, Math.round(tdee - WEIGHT_LOSS_DEFICIT_KCAL));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieGoal,
    macros: calculateMacros(calorieGoal),
    waterGoalMl: calculateWaterGoalMl(metrics.weightKg),
    micros: { fiberG: 25, sodiumMg: 2300 },
  };
}

export const clampPercent = (value: number, goal: number) =>
  goal <= 0 ? 0 : Math.min(100, Math.round((value / goal) * 100));
