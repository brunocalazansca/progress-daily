interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  tone: "protein" | "carbs" | "fat" | "water" | "primary";
}

const toneClasses: Record<MacroBarProps["tone"], string> = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
  water: "bg-water",
  primary: "bg-primary",
};

export function MacroBar({ label, value, goal, unit = "g", tone }: MacroBarProps) {
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const remaining = Math.max(0, goal - value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {Math.round(value)} / {Math.round(goal)} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${toneClasses[tone]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {remaining > 0 ? `faltam ${Math.round(remaining)} ${unit}` : "meta alcançada"}
      </p>
    </div>
  );
}
