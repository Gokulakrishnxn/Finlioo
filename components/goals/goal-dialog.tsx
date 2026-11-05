"use client";

import { useState } from "react";
import { Field, Select } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { GOAL_TEMPLATES } from "@/components/goals/goal-look";
import { todayLocal } from "@/lib/format";
import { useStore } from "@/lib/store";
import { GOAL_CATEGORIES, type Goal, type GoalCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

// Mount with a `key` per goal so the form starts fresh.
export function GoalDialog({
  goal,
  template,
  open,
  onOpenChange,
}: {
  goal?: Goal;
  template?: GoalCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { saveGoal } = useStore();
  const preset = GOAL_TEMPLATES.find((t) => t.category === template);
  const [name, setName] = useState(goal?.name ?? (preset ? t(preset.name) : ""));
  const [category, setCategory] = useState<GoalCategory>(goal?.category ?? template ?? "other");
  const [target, setTarget] = useState(goal?.targetAmount ? String(goal.targetAmount) : "");
  const [saved, setSaved] = useState(goal ? String(goal.savedAmount) : "");
  const [date, setDate] = useState(goal?.targetDate ?? "");
  const [problem, setProblem] = useState<{ field: string; message: string; attempt: number } | null>(null);

  function fail(field: string, message: string) {
    setProblem((p) => ({ field, message, attempt: (p?.attempt ?? 0) + 1 }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return fail("name", t("Give your goal a name."));
    if (!(Number(target) > 0)) return fail("target", t("Enter a target above zero."));
    if (saved !== "" && !(Number(saved) >= 0)) return fail("saved", t("Enter zero or more."));
    if (!date) return fail("date", t("Pick a target date."));
    if (!goal && date <= todayLocal()) return fail("date", t("Pick a date in the future."));
    saveGoal({
      id: goal?.id,
      name: name.trim(),
      category,
      targetAmount: Number(target),
      savedAmount: Number(saved) || 0,
      targetDate: date,
    });
    onOpenChange(false);
  }

  // Each failed attempt replays the shake on the field that needs attention.
  const shakeKey = (field: string) => (problem?.field === field ? problem.attempt : 0);
  const shakeClass = (field: string) => (problem?.field === field ? "t-input is-shaking" : "t-input");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 [--dialog-width:30rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">{goal ? t("Edit goal") : t("New goal")}</DialogTitle>
          <DialogDescription>{t("What are you saving towards, how much, and by when?")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <div key={shakeKey("name")} className={shakeClass("name")}>
            <Field id="goal-name" label={t("Name")}>
              <Input
                id="goal-name"
                value={name}
                placeholder={t("e.g. Emergency fund")}
                aria-invalid={problem?.field === "name"}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
          <Field id="goal-category" label={t("Type")}>
            <Select id="goal-category" value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)}>
              {Object.entries(GOAL_CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <div key={shakeKey("target")} className={shakeClass("target")}>
              <Field id="goal-target" label={t("Target (₹)")}>
                <Input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={target}
                  aria-invalid={problem?.field === "target"}
                  onChange={(e) => setTarget(e.target.value)}
                  className="nums h-11 rounded-xl"
                />
              </Field>
            </div>
            <div key={shakeKey("saved")} className={shakeClass("saved")}>
              <Field id="goal-saved" label={t("Saved so far (₹)")}>
                <Input
                  id="goal-saved"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={saved}
                  placeholder="0"
                  aria-invalid={problem?.field === "saved"}
                  onChange={(e) => setSaved(e.target.value)}
                  className="nums h-11 rounded-xl"
                />
              </Field>
            </div>
          </div>
          <div key={shakeKey("date")} className={shakeClass("date")}>
            <Field id="goal-date" label={t("Target date")}>
              <Input
                id="goal-date"
                type="date"
                value={date}
                aria-invalid={problem?.field === "date"}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
          <p role={problem ? "alert" : undefined} className={cn("min-h-5 text-[13px] text-loss", !problem && "invisible")}>
            {problem?.message ?? ""}
          </p>
          <DialogFooter>
            <Button type="submit" className="h-11 w-full rounded-xl text-[15px]">
              {goal ? t("Save changes") : t("Create goal")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
