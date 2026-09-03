import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, Flame, Droplets, Salad } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, signInWithGoogle } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useNutritionData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leve — Emagreça com metas de calorias e água" },
      {
        name: "description",
        content:
          "App de saúde e nutrição para emagrecer: calcule sua TMB, meta diária com déficit de 500 kcal, macros, água e registre suas refeições.",
      },
      { property: "og:title", content: "Leve — Emagreça com metas de calorias e água" },
      {
        property: "og:description",
        content: "Calcule TMB, meta com déficit de 500 kcal, macros e água. Registre o que comeu em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const highlights = [
  { icon: Flame, title: "Déficit inteligente", text: "Meta diária com 500 kcal a menos que seu gasto." },
  { icon: Salad, title: "Diário simples", text: "Busque alimentos reais e registre em segundos." },
  { icon: Droplets, title: "Hidratação", text: "35 ml por kg com copos de um toque." },
];

function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || profileLoading) return;
    void navigate({ to: profile?.onboarded ? "/dashboard" : "/onboarding" });
  }, [loading, user, profile, profileLoading, navigate]);

  const handleGoogle = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
      setSigningIn(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between bg-background">
      <section className="gradient-hero px-6 pb-14 pt-16 text-primary-foreground">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <Leaf className="size-3.5" /> Saúde &amp; Nutrição
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight">
          Emagreça com clareza,
          <br />
          sem complicação.
        </h1>
        <p className="mt-3 text-sm leading-relaxed opacity-90">
          Metas calculadas a partir da sua Taxa Metabólica Basal, com déficit calórico automático de 500 kcal.
        </p>
      </section>

      <section className="-mt-8 space-y-3 rounded-t-3xl bg-background px-4 pt-6">
        {highlights.map(({ icon: Icon, title, text }) => (
          <article key={title} className="card-surface flex items-start gap-3 p-4">
            <span className="rounded-2xl bg-secondary p-2.5 text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className="space-y-3 px-4 pb-10 pt-6">
        <Button size="lg" className="w-full" onClick={handleGoogle} disabled={signingIn || loading}>
          {signingIn ? "Conectando..." : "Continuar com o Google"}
        </Button>
        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
        <p className="text-center text-xs text-muted-foreground">
          Ao continuar você concorda em usar o app como apoio, não como orientação médica.
        </p>
      </footer>
    </div>
  );
}
