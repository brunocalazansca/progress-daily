interface ProgressRingProps {
  value: number;
  goal: number;
  label: string;
  unit?: string;
  size?: number;
}

/** Anel de progresso circular usando o token de cor primário. */
export function ProgressRing({ value, goal, label, unit = "kcal", size = 168 }: ProgressRingProps) {
  const percent = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="fill-none stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percent / 100) * circumference}
          className="fill-none stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-3xl font-bold text-foreground">{Math.round(value)}</p>
        <p className="text-xs text-muted-foreground">
          de {Math.round(goal)} {unit}
        </p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary">{label}</p>
      </div>
    </div>
  );
}
