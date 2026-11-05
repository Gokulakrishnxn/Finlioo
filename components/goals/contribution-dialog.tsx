"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Field } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, formatMoney, todayLocal } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Goal } from "@/lib/types";

// Mount with a `key` per goal so the form starts fresh.
export function ContributionDialog({
  goal,
  open,
  onOpenChange,
  onAdded,
}: {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (goal: Goal, amount: number) => void;
}) {
  const { addContribution, removeContribution } = useStore();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [problem, setProblem] = useState<{ message: string; attempt: number } | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const fail = (message: string) => setProblem((p) => ({ message, attempt: (p?.attempt ?? 0) + 1 }));
    if (!(Number(amount) > 0)) return fail("Enter an amount above zero.");
    if (!date || date > todayLocal()) return fail("Pick today or an earlier date.");
    addContribution(goal.id, { amount: Number(amount), date });
    onAdded(goal, Number(amount));
    onOpenChange(false);
  }

  const history = [...goal.contributions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 [--dialog-width:26rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Add money</DialogTitle>
          <DialogDescription>Record what you put towards {goal.name}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div key={problem?.attempt ?? 0} className={problem ? "t-input is-shaking" : "t-input"}>
              <Field id="contribution-amount" label="Amount (₹)">
                <Input
                  id="contribution-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  autoFocus
                  value={amount}
                  aria-invalid={Boolean(problem)}
                  onChange={(e) => setAmount(e.target.value)}
                  className="nums h-11 rounded-xl"
                />
              </Field>
            </div>
            <Field id="contribution-date" label="Date">
              <Input
                id="contribution-date"
                type="date"
                max={todayLocal()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
          {problem && (
            <p role="alert" className="text-[13px] text-loss">
              {problem.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" className="h-11 w-full rounded-xl text-[15px]">
              Add money
            </Button>
          </DialogFooter>
        </form>

        {history.length > 0 && (
          <div className="border-t border-line pt-4">
            <p className="eyebrow mb-2">History</p>
            <ul className="max-h-40 overflow-y-auto">
              {history.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-1.5 text-[13px]">
                  <span className="flex-1 text-body">{formatDate(c.date)}</span>
                  <span className="nums text-ink">{formatMoney(c.amount)}</span>
                  <button
                    type="button"
                    onClick={() => removeContribution(goal.id, c.id)}
                    aria-label={`Remove ${formatMoney(c.amount)} from ${formatDate(c.date)}`}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-sand hover:text-loss"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
