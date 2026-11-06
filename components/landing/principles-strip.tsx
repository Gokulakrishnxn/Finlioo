import { PRINCIPLES } from "@/lib/landing-content";

// One slow line of promises, repeated once for a seamless loop. The second
// copy is hidden from screen readers so the list is heard once.
export function PrinciplesStrip() {
  return (
    <section aria-label="How Finlio works" className="relative border-y border-line/70 bg-card/40 py-4">
      <div className="fl-marquee overflow-hidden">
        <div className="fl-marquee__track">
          {[0, 1].map((copy) =>
            PRINCIPLES.map((principle) => (
              <span
                key={`${copy}-${principle}`}
                aria-hidden={copy === 1 ? true : undefined}
                className="flex shrink-0 items-center gap-6 pr-6"
              >
                <span className="whitespace-nowrap text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {principle}
                </span>
                <span aria-hidden className="size-[3px] rounded-full bg-border" />
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
