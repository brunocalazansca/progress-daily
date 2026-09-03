import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, NotebookPen, LogOut } from "lucide-react";
import { signOut } from "@/hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/diario", label: "Diário", icon: NotebookPen },
] as const;

/** Layout mobile-first com cabeçalho e navegação inferior. */
export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="gradient-hero px-5 pb-8 pt-7 text-primary-foreground">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm opacity-90">{subtitle}</p> : null}
          </div>
          <button
            onClick={() => void signOut()}
            aria-label="Sair da conta"
            className="rounded-full bg-primary-foreground/15 p-2 transition-colors hover:bg-primary-foreground/25"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="-mt-5 flex-1 space-y-4 rounded-t-3xl bg-background px-4 pb-28 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex w-full max-w-md justify-around border-t border-border bg-card px-4 py-2.5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
