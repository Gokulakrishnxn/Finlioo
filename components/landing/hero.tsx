"use client";

import Link from "next/link";
import { HeroShot } from "./hero-shot";
import { Reveal } from "./reveal";
import { SplitHeadline } from "./split-headline";
import { useAnchorScroll } from "./smooth-scroll";


const INK_BUTTON =
  "group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary/88 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const QUIET_BUTTON =
  "group inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-5 py-3.5 text-[15px] font-medium text-ink backdrop-blur transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function Hero() {
  const anchor = useAnchorScroll();
  return (
    <section className="px-3 pt-20 sm:px-5 sm:pt-24">
      <div className="fl-hero mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-line pt-10 sm:rounded-[36px] sm:pt-14 lg:pt-16">
        <div className="relative mx-auto max-w-[1120px] px-5 sm:px-10">
          <SplitHeadline
            className="max-w-[740px] text-balance text-[clamp(2.75rem,6.4vw,5.5rem)] font-medium leading-[1.02] tracking-[-0.045em] text-ink"
            delay={0.08}
          >
            Know why your money moved.
          </SplitHeadline>

          <Reveal delay={0.42} className="mt-5 max-w-[400px] text-pretty text-[17px] leading-[1.62] text-body sm:text-[18px]">
            Your money, in one view. Understand what changed and why.
          </Reveal>

          <Reveal delay={0.55} className="mt-7 flex flex-wrap items-center gap-2.5">
            
              <Link href="/dashboard" className={INK_BUTTON}>
                Get started
                
              </Link>
            
            <a href="#features" onClick={(event) => anchor(event, "#features")} className={QUIET_BUTTON}>
              Explore Finlio
              
            </a>
          </Reveal>

          <Reveal delay={0.65} className="mt-5">
            <a
              href="https://www.producthunt.com/products/kivo-4?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-kivo-4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Kivo - Free on device dictation for any Mac app and AI agent | Product Hunt"
                width={250}
                height={54}
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1305759&theme=light&t=1793985347553"
              />
            </a>
          </Reveal>

        </div>

        <div className="relative mx-auto mt-10 max-w-[1120px] px-3 sm:mt-12 sm:px-8">
          <div>
            <HeroShot />
          </div>
        </div>
      </div>
    </section>
  );
}
