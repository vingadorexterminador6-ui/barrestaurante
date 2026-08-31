import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/gestao/store";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "safe" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    safe: "text-safe",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <Card className="glass-card transition-transform hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        </div>
        <p className={cn("mt-2 font-display text-2xl font-semibold", toneClass)}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="font-display text-base">{title}</CardTitle>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Blocks a module until the initial setup wizard has been completed. */
export function RequireSetup({ children }: { children: ReactNode }) {
  const { state, hydrated } = useStore();
  if (!hydrated) return <div className="h-40 animate-pulse rounded-xl bg-muted/40" />;
  if (!state.setupDone) {
    return (
      <EmptyState
        message="Configure primeiro o seu estabelecimento para começar a usar este módulo."
        action={
          <Button asChild>
            <Link to="/app">Ir para a configuração</Link>
          </Button>
        }
      />
    );
  }
  return <>{children}</>;
}
