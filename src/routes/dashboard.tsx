import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Droplets, Flame, Plus, Minus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { ProgressRing } from "@/components/app/ProgressRing";
import { MacroBar } from "@/components/app/MacroBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  planFromProfile,
  sumEntries,
  useAddWater,
  useRemoveWater,
  useFoodEntries,
  useProfile,
  useWaterTotal,
} from "@/hooks/useNutritionData";
import { GLASS_ML } from "@/lib/nutrition";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel do dia" },
      { name: "description", content: "Acompanhe calorias, macronutrientes, micronutrientes e hidratação do seu dia em um só lugar." },
      { property: "og:title", content: "Painel do dia" },
      { property: "og:description", content: "Calorias restantes, macros, micros e copos de água em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: entries } = useFoodEntries(user?.id);
  const { data: waterMl = 0 } = useWaterTotal(user?.id);
  const addWater = useAddWater(user?.id);
  const removeWater = useRemoveWater(user?.id);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarded) void navigate({ to: "/onboarding" });
  }, [profileLoading, profile, navigate]);

  const plan = planFromProfile(profile);
  const totals = sumEntries(entries);

  if (!plan) {
    return (
      <AppShell title="Carregando..." subtitle="Preparando suas metas">
        <div className="card-surface h-40 animate-pulse" />
      </AppShell>
    );
  }

  const remaining = Math.max(0, plan.calorieGoal - totals.calories);
  const glasses = Math.floor(waterMl / GLASS_ML);
  const glassGoal = Math.ceil(plan.waterGoalMl / GLASS_ML);

  return (
    <AppShell
      title={`Olá, ${(profile?.display_name ?? "").split(" ")[0] || "bem-vindo"}!`}
      subtitle="Seu progresso de hoje"
    >
      <section className="card-surface flex flex-col items-center gap-3 p-5">
        <ProgressRing value={totals.calories} goal={plan.calorieGoal} label="consumidas" />
        <p className="text-sm text-muted-foreground">
          Restam <strong className="text-primary">{Math.round(remaining)} kcal</strong> para a sua meta
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <article className="card-surface p-4">
          <span className="inline-flex rounded-xl bg-secondary p-2 text-primary">
            <Flame className="size-4" />
          </span>
          <p className="mt-2 text-xs text-muted-foreground">Gasto em repouso (TMB)</p>
          <p className="font-display text-xl font-bold">{plan.bmr} kcal</p>
        </article>
        <article className="card-surface p-4">
          <span className="inline-flex rounded-xl bg-secondary p-2 text-primary">
            <Sparkles className="size-4" />
          </span>
          <p className="mt-2 text-xs text-muted-foreground">Meta com déficit de 500</p>
          <p className="font-display text-xl font-bold">{plan.calorieGoal} kcal</p>
        </article>
      </section>

      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-semibold">Macronutrientes</h2>
        <MacroBar label="Proteínas" value={totals.protein} goal={plan.macros.protein} tone="protein" />
        <MacroBar label="Carboidratos" value={totals.carbs} goal={plan.macros.carbs} tone="carbs" />
        <MacroBar label="Gorduras" value={totals.fat} goal={plan.macros.fat} tone="fat" />
      </section>

      <section className="card-surface space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Hidratação</h2>
          <span className="text-sm text-muted-foreground">
            {(waterMl / 1000).toFixed(2)} L de {(plan.waterGoalMl / 1000).toFixed(2)} L
          </span>
        </div>
        <MacroBar label="Água" value={waterMl} goal={plan.waterGoalMl} unit="ml" tone="water" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: glassGoal }).map((_, index) => (
            <Droplets
              key={index}
              className={`size-5 ${index < glasses ? "text-water" : "text-muted-foreground/35"}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => addWater.mutate(GLASS_ML)}
            disabled={addWater.isPending}
          >
            <Plus className="size-4" /> Adicionar ({GLASS_ML}ml)
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-muted-foreground"
            onClick={() => removeWater.mutate()}
            disabled={removeWater.isPending || waterMl <= 0}
          >
            <Minus className="size-4" /> Remover ({GLASS_ML}ml)
          </Button>
        </div>
      </section>

      <section className="card-surface space-y-4 p-4">
        <h2 className="font-display text-base font-semibold">Micronutrientes principais</h2>
        <MacroBar label="Fibras" value={totals.fiber} goal={plan.micros.fiberG} tone="primary" />
        <MacroBar label="Sódio (limite)" value={totals.sodium} goal={plan.micros.sodiumMg} unit="mg" tone="fat" />
        <p className="text-xs text-muted-foreground">
          Valores estimados a partir dos alimentos registrados no diário.
        </p>
      </section>
    </AppShell>
  );
}
