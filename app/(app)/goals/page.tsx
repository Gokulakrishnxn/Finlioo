import { Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function GoalsPage() {
  return (
    <>
      <PageHeader title="Goals" subtitle="What you're saving towards." />
      <section className="card-surface flex flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
          <Target className="size-5" strokeWidth={1.75} />
        </span>
        <p className="text-[16px] font-semibold tracking-tight text-ink">Goals are coming soon</p>
        <p className="max-w-md text-[14px] leading-relaxed text-body">
          This is where you&apos;ll set savings targets and track your progress towards them.
        </p>
      </section>
    </>
  );
}
