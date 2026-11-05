"use client";

import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function Welcome({ onAdd }: { onAdd: () => void }) {
  const { addSample } = useStore();

  return (
    <section className="card-surface overflow-hidden">
      <div className="flex flex-col items-start gap-6 p-10">
        <div className="max-w-lg">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            {t("All your money in one place.")}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            {t("Add the stocks you own and see them next to your savings, loans and spending. Your portfolio stays in this browser.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onAdd} className="h-11 rounded-xl px-5 text-[15px]">
            <Plus className="size-4" />
            {t("Add your first stock")}
          </Button>
          <Button variant="outline" onClick={addSample} className="h-11 rounded-xl px-5 text-[15px]">
            <Sparkles className="size-4" />
            {t("Try a sample portfolio")}
          </Button>
        </div>
      </div>
    </section>
  );
}
