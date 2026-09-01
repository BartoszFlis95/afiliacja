import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface OnboardingStep {
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  dashboardHref: string;
}

export function OnboardingChecklist({ steps, dashboardHref }: OnboardingChecklistProps) {
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = doneCount === total;
  const progressPct = Math.round((doneCount / total) * 100);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {doneCount} / {total} kroków ukończonych
            </span>
            <span className="text-muted-foreground">{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <Card
            key={step.label}
            className={cn(
              "border transition-colors",
              step.done ? "border-success/30 bg-success/10" : "border-border bg-card"
            )}
          >
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/60" />
                )}
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-success" : "text-foreground"
                  )}
                >
                  Krok {i + 1}: {step.label}
                </p>
              </div>
              {!step.done && (
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link href={step.href}>{step.cta} →</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button asChild variant={allDone ? "default" : "outline"}>
          <Link href={dashboardHref}>
            {allDone ? "Przejdź do dashboardu →" : "Pomiń i przejdź do dashboardu →"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
