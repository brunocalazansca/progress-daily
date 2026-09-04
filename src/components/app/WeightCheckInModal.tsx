import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";

interface Props {
  currentWeight: number;
  onConfirm: (newWeight: number) => Promise<void>;
}

export function WeightCheckInModal({ currentWeight, onConfirm }: Props) {
  const [weight, setWeight] = useState(String(currentWeight));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(weight);
    if (!value || value < 20 || value > 400) return;
    setSaving(true);
    await onConfirm(value);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6">
      <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-xl">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <span className="inline-flex rounded-2xl bg-secondary p-3 text-primary">
            <Scale className="size-6" />
          </span>
          <h2 className="font-display text-xl font-bold">Check-in diário</h2>
          <p className="text-sm text-muted-foreground">
            Novo dia, novo registro! Qual é o seu peso hoje?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="checkin-weight">Peso atual (kg)</Label>
            <Input
              id="checkin-weight"
              inputMode="decimal"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="72.5"
              className="text-center text-lg"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? "Salvando..." : "Confirmar peso"}
          </Button>
        </form>
      </div>
    </div>
  );
}
