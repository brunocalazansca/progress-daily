import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useNutritionData";
import {
  ACTIVITY_LABELS,
  buildNutritionPlan,
  type ActivityLevel,
  type BiologicalSex,
} from "@/lib/nutrition";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [{ title: "Meu perfil" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);

  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<BiologicalSex>("female");
  const [activity, setActivity] = useState<ActivityLevel>("light");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    if (profile.weight_kg) setWeight(String(profile.weight_kg));
    if (profile.target_weight_kg) setTargetWeight(String(profile.target_weight_kg));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    await updateProfile.mutateAsync({
      weight_kg: Number(weight),
      target_weight_kg: targetWeight ? Number(targetWeight) : undefined,
      height_cm: Number(height),
      age_years: Number(age),
      biological_sex: sex,
      activity_level: activity,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell title="Meu perfil" subtitle="Atualize seus dados e metas">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card-surface space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-weight">Peso atual (kg)</Label>
              <Input id="p-weight" inputMode="decimal" required value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="72" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-target">Peso alvo (kg)</Label>
              <Input id="p-target" inputMode="decimal" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="65" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-height">Altura (cm)</Label>
              <Input id="p-height" inputMode="numeric" required value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-age">Idade (anos)</Label>
              <Input id="p-age" inputMode="numeric" required value={age} onChange={(e) => setAge(e.target.value)} placeholder="32" />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Sexo biológico</legend>
            <div className="grid grid-cols-2 gap-2">
              {([ ["female", "Feminino"], ["male", "Masculino"] ] as const).map(([value, label]) => (
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
            <h2 className="font-display text-base font-semibold">Novas metas calculadas</h2>
            <p className="text-sm text-muted-foreground">TMB: <strong className="text-foreground">{preview.bmr} kcal</strong></p>
            <p className="text-sm text-muted-foreground">Gasto total: <strong className="text-foreground">{preview.tdee} kcal</strong></p>
            <p className="text-sm text-muted-foreground">Meta diária: <strong className="text-primary">{preview.calorieGoal} kcal</strong> (−500)</p>
            <p className="text-sm text-muted-foreground">Água: <strong className="text-foreground">{(preview.waterGoalMl / 1000).toFixed(1)} L</strong></p>
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={!preview || updateProfile.isPending}>
          {saved ? "Salvo!" : updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </AppShell>
  );
}
