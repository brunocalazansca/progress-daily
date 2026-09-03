import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Trash2, Plus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { MacroBar } from "@/components/app/MacroBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  planFromProfile,
  sumEntries,
  useAddFoodEntry,
  useDeleteFoodEntry,
  useFoodEntries,
  useProfile,
  type MealType,
} from "@/hooks/useNutritionData";
import { searchFoods, type FoodItem } from "@/lib/food.functions";

export const Route = createFileRoute("/diario")({
  head: () => ({
    meta: [
      { title: "Diário alimentar — Leve" },
      { name: "description", content: "Registre café da manhã, almoço, jantar e lanches, com busca de alimentos e contagem de macros restantes." },
      { property: "og:title", content: "Diário alimentar — Leve" },
      { property: "og:description", content: "Busque alimentos reais e acompanhe calorias consumidas e restantes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiaryPage,
});

const MEALS: Array<{ value: MealType; label: string }> = [
  { value: "breakfast", label: "Café da manhã" },
  { value: "lunch", label: "Almoço" },
  { value: "dinner", label: "Jantar" },
  { value: "snack", label: "Lanches" },
];

function DiaryPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: entries = [] } = useFoodEntries(user?.id);
  const addEntry = useAddFoodEntry(user?.id);
  const deleteEntry = useDeleteFoodEntry(user?.id);

  const [meal, setMeal] = useState<MealType>("breakfast");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState("100");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/" });
  }, [loading, user, navigate]);

  const search = useMutation({
    mutationFn: async (term: string) => searchFoods({ data: { query: term } }),
  });

  const plan = planFromProfile(profile);
  const totals = sumEntries(entries);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setSelected(null);
    search.mutate(query.trim());
  };

  const handleAdd = async () => {
    if (!selected) return;
    const factor = (Number(grams) || 0) / 100;
    await addEntry.mutateAsync({
      meal,
      food_name: selected.name,
      grams: Number(grams) || 0,
      calories: Math.round(selected.calories * factor),
      protein_g: Math.round(selected.protein * factor * 10) / 10,
      carbs_g: Math.round(selected.carbs * factor * 10) / 10,
      fat_g: Math.round(selected.fat * factor * 10) / 10,
      fiber_g: Math.round(selected.fiber * factor * 10) / 10,
      sodium_mg: Math.round(selected.sodiumMg * factor),
    });
    setSelected(null);
    setQuery("");
    setGrams("100");
    search.reset();
  };

  return (
    <AppShell title="Diário alimentar" subtitle="Tudo o que você consumiu hoje">
      {plan ? (
        <section className="card-surface space-y-4 p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Consumidas</p>
              <p className="font-display text-2xl font-bold">{Math.round(totals.calories)} kcal</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Restantes</p>
              <p className="font-display text-2xl font-bold text-primary">
                {Math.round(Math.max(0, plan.calorieGoal - totals.calories))} kcal
              </p>
            </div>
          </div>
          <MacroBar label="Proteínas" value={totals.protein} goal={plan.macros.protein} tone="protein" />
          <MacroBar label="Carboidratos" value={totals.carbs} goal={plan.macros.carbs} tone="carbs" />
          <MacroBar label="Gorduras" value={totals.fat} goal={plan.macros.fat} tone="fat" />
        </section>
      ) : null}

      <section className="card-surface space-y-3 p-4">
        <h2 className="font-display text-base font-semibold">Adicionar alimento</h2>

        <div className="flex flex-wrap gap-2">
          {MEALS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMeal(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                meal === value ? "border-primary bg-secondary text-secondary-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar alimento (ex.: arroz integral)"
            aria-label="Buscar alimento"
          />
          <Button type="submit" size="icon" disabled={search.isPending} aria-label="Buscar">
            <Search className="size-4" />
          </Button>
        </form>

        {search.isPending ? <p className="text-sm text-muted-foreground">Buscando alimentos...</p> : null}
        {search.data?.error ? <p className="text-sm text-destructive">{search.data.error}</p> : null}
        {search.data && !search.data.error && search.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum alimento encontrado. Tente outro termo.</p>
        ) : null}

        {!selected && search.data?.items.length ? (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {search.data.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                >
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand ? `${item.brand} · ` : ""}
                    {item.calories} kcal · P {item.protein}g · C {item.carbs}g · G {item.fat}g (100 g)
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {selected ? (
          <div className="space-y-3 rounded-xl border border-primary/40 bg-secondary/50 p-3">
            <p className="text-sm font-medium">{selected.name}</p>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label htmlFor="grams" className="text-xs text-muted-foreground">
                  Quantidade (g)
                </label>
                <Input id="grams" inputMode="numeric" value={grams} onChange={(event) => setGrams(event.target.value)} />
              </div>
              <Button onClick={() => void handleAdd()} disabled={addEntry.isPending}>
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              ≈ {Math.round((selected.calories * (Number(grams) || 0)) / 100)} kcal nesta porção
            </p>
          </div>
        ) : null}
      </section>

      {MEALS.map(({ value, label }) => {
        const mealEntries = entries.filter((entry) => entry.meal === value);
        const mealCalories = mealEntries.reduce((sum, entry) => sum + Number(entry.calories), 0);
        return (
          <section key={value} className="card-surface p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-base font-semibold">{label}</h2>
              <span className="text-sm text-muted-foreground">{Math.round(mealCalories)} kcal</span>
            </div>
            {mealEntries.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nada registrado ainda.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mealEntries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{entry.food_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(Number(entry.grams))} g · {Math.round(Number(entry.calories))} kcal · P{" "}
                        {Number(entry.protein_g)}g · C {Number(entry.carbs_g)}g · G {Number(entry.fat_g)}g
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteEntry.mutate(entry.id)}
                      aria-label={`Remover ${entry.food_name}`}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </AppShell>
  );
}
