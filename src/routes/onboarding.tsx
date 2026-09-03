import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useNutritionData";
import {
  ACTIVITY_LABELS,
  buildNutritionPlan,
  type ActivityLevel,
  type BiologicalSex,
} from "@/lib/nutrition";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Seus dados — Leve" },
      { name: "description", content: "Informe peso, altura, idade, sexo e atividade física para calcular suas metas diárias." },
      { property: "og:title", content: "Seus dados — Leve" },
      { property: "og:description", content: "Calculamos sua TMB e a meta de emagrecimento com déficit de 500 kcal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile(user?.id);

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<BiologicalSex>("female");
  const [activity, setActivity] = useState<ActivityLevel>("light");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    if (profile.weight_kg) setWeight(String(profile.weight_kg));
    if (profile.height_cm) setHeight(String(profile.height_cm));
    if (profile.age_years) setAge(String(profile.age_years));
    if (profile.biological_sex) setSex(profile.biological_sex);
    if (profile.activity_level) setActivity(profile.activity_level);
  }, [profile]);

  const preview = useMemo(() => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    if (!w || !h || !a) return null;
    return buildNutritionPlan({ weightKg: w, heightCm: h, ageYears: a, sex, activityLevel: activity });
  }, [weight, height, age, sex, activity]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !preview) return;
    setSaving(true);
    setError(null);

    const { error: saveError } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: (user.user_metadata?.["full_name"] as string | undefined) ?? user.email ?? null,
      weight_kg: Number(weight),
      height_cm: Number(height),
      age_years: Number(age),
      biological_sex: sex,
      activity_level: activity,
      onboarded: true,
      updated_at: new Date().toISOString(),
    });

    if (saveError) {
      setError("Não foi possível salvar seus dados. Tente novamente.");
      setSaving(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background">
      <header className="gradient-hero px-5 pb-10 pt-10 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold">Vamos calcular suas metas</h1>
        <p className="mt-2 text-sm opacity-90">Leva menos de um minuto. Você pode ajustar depois.</p>
      </header>

      <form onSubmit={handleSubmit} className="-mt-6 space-y-4 rounded-t-3xl bg-background px-4 pb-12 pt-6">
        <div className="card-surface space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input id="weight" inputMode="decimal" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="72" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input id="height" inputMode="numeric" required value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="age">Idade (anos)</Label>
            <Input id="age" inputMode="numeric" required value={age} onChange={(e) => setAge(e.target.value)} placeholder="32" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Sexo biológico</legend>
            <div className="grid grid-cols-2 gap-2">
              {([["female", "Feminino"], ["male", "Masculino"]] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSex(value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    sex === value ? "border-primary bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Nível de atividade física</legend>
            <div className="space-y-2">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setActivity(level)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    activity === level ? "border-primary bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {ACTIVITY_LABELS[level]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {preview ? (
          <div className="card-surface space-y-2 p-4">
            <h2 className="font-display text-base font-semibold">Prévia das suas metas</h2>
            <p className="text-sm text-muted-foreground">TMB (gasto em repouso): <strong className="text-foreground">{preview.bmr} kcal</strong></p>
            <p className="text-sm text-muted-foreground">Gasto total estimado: <strong className="text-foreground">{preview.tdee} kcal</strong></p>
            <p className="text-sm text-muted-foreground">Meta para emagrecer: <strong className="text-primary">{preview.calorieGoal} kcal</strong> (−500)</p>
            <p className="text-sm text-muted-foreground">Água: <strong className="text-foreground">{(preview.waterGoalMl / 1000).toFixed(1)} L</strong></p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" size="lg" className="w-full" disabled={!preview || saving}>
          {saving ? "Salvando..." : "Começar"}
        </Button>
      </form>
    </div>
  );
}
