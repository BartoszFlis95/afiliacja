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
      <Card className="border-blue-100">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#0F172A]">
              {doneCount} / {total} kroków ukończonych
            </span>
            <span className="text-slate-500">{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
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
              step.done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"
            )}
          >
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                )}
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-emerald-800" : "text-slate-700"
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
