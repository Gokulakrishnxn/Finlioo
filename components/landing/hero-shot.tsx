"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Landmark, LayoutGrid, LineChart, Wallet } from "lucide-react";
import { Window } from "@/components/landing/stage-kit/window";
import { CountUp } from "@/components/count-up";
import {
  NET_WORTH,
  NET_WORTH_CHANGE,
  NET_WORTH_CHANGE_PCT,
  QUARTERS,
  formatLakh,
  formatRupees,
  formatRupeesShort,
} from "@/lib/landing-content";
import { cn } from "@/lib/utils";
import { reducedMotion } from "./smooth-scroll";

const MIN = 737_000;
const MAX = 1_053_000;
const barHeight = (value: number) => 30 + ((value - MIN) / (MAX - MIN)) * 74;

// The rail: three real destinations, then filler. The satellite covers most of
// it, so only what identifies the app needs to be true.
const RAIL = [
  { icon: LayoutGrid, label: "Dashboard", active: true },
  { icon: LineChart, label: "Analytics" },
  { icon: Wallet, label: "Holdings" },
];

// Two real rows carry the crop; the last is filler the stage edge takes.
const STOCKS = [
  { what: "Reliance", when: "+1.8% today", filler: false },
  { what: "Infosys", when: "+0.6% today", filler: false },
  { what: "HDFC Bank", when: "−0.4% today", filler: false },
];

// Three real rows, then filler under the crop.
const ACTIVITY = [
  { name: "Big Basket", kind: "Groceries · 6 Nov", amount: "−₹4.6K", positive: false },
  { name: "Airtel", kind: "Bills · 4 Nov", amount: "−₹599", positive: false },
  { name: "Salary", kind: "Salary · 1 Nov", amount: "+₹95.0K", positive: true },
  { name: "", kind: "", amount: "", positive: false },
  { name: "", kind: "", amount: "", positive: false },
  { name: "", kind: "", amount: "", positive: false },
];

function Rail() {
  return (
    <div className="flex h-full flex-col gap-0.5 px-2.5 pb-3">
      <div className="flex items-center gap-2 px-1.5 pb-3 pt-1">
        <Image src="/finlio-mark.png" alt="" width={1024} height={1024} className="size-5 mix-blend-multiply" />
        <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#343433]">Finlio</span>
      </div>
      {RAIL.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2 rounded-[7px] px-1.5 py-1.5 text-[11px]",
            active ? "bg-white font-medium text-[#343433] shadow-[0_1px_2px_rgb(24_22_20/6%)]" : "text-[#716f6b]",
          )}
        >
          <Icon className="size-3.5 shrink-0" strokeWidth={1.9} />
          {label}
        </div>
      ))}
      <div className="mt-3 px-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a5a29b]">Wealth</div>
      {[
        { icon: Landmark, width: 52 },
        { icon: null, width: 38 },
        { icon: null, width: 46 },
        { icon: null, width: 30 },
      ].map(({ icon: Icon, width }, index) => (
        <div key={index} className="flex items-center gap-2 px-1.5 py-[7px]">
          {Icon ? (
            <Icon className="size-3 shrink-0 text-[#a5a29b]" strokeWidth={1.9} />
          ) : (
            <span className="size-3 shrink-0 rounded-[4px] bg-[rgb(24_22_20/8%)]" />
          )}
          <span className="h-[5px] rounded-full bg-[rgb(24_22_20/8%)]" style={{ width }} />
        </div>
      ))}
    </div>
  );
}

function ShotBody() {
  return (
    <div className="px-4 pb-6 pt-4 sm:pl-6 sm:pr-[72px]">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-[#343433]">Good morning</div>
          <div className="text-[11px] text-[#a5a29b]">Friday, 6 November</div>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#a5a29b]">Net worth · ₹ INR</div>
        <div className="mt-1 nums text-[26px] font-semibold leading-none tracking-[-0.045em] text-[#343433] sm:text-[38px]">
          <CountUp value={NET_WORTH} format={formatRupees} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[11.5px]">
          <span className="inline-flex items-center gap-0.5 font-medium text-[#21803d]">
            <ArrowUpRight className="size-3" strokeWidth={2.4} />+<CountUp value={NET_WORTH_CHANGE} format={formatRupeesShort} />
          </span>
          <span className="text-[#21803d]">({NET_WORTH_CHANGE_PCT}%)</span>
          <span className="text-[#a5a29b]">since 30 Sept</span>
        </div>
      </div>

      <div className="mt-4 border-t border-[#f2f1ee] pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] text-[#a5a29b]">By quarter · financial year (Apr–Mar)</span>
          <span className="hidden text-[10px] text-[#a5a29b] sm:inline">Assets ₹13.31L · Liabilities ₹2.78L</span>
        </div>
        <div className="mt-2 flex items-end gap-2.5">
          {QUARTERS.map((quarter, index) => (
            <div key={`${quarter.label}-${quarter.fy}`} className="flex flex-1 flex-col items-center justify-end">
              <span className="fl-bar-label nums hidden pb-1.5 text-[10px] text-[#a5a29b] sm:block">
                {formatLakh(quarter.value)}
              </span>
              <div
                className={cn("fl-bar w-full rounded-[5px]", index === QUARTERS.length - 1 ? "bg-[#21803d]" : "bg-[#eef8f1]")}
                style={{ height: `${Math.round(barHeight(quarter.value) * 0.86)}px` }}
              />
              <span className="pt-1.5 text-[10px] font-medium leading-none text-[#474645]">
                {quarter.label} <span className="text-[#a5a29b]">{quarter.fy}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-[#f2f1ee] pt-3">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#a5a29b]">Your stocks</div>
        <div className="mt-1.5 flex flex-col">
          {STOCKS.map((row, index) =>
            row.filler ? (
              <div key={`cu-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="h-[6px] w-[92px] rounded-full bg-[rgb(24_22_20/7%)]" />
                <span className="h-[6px] w-[122px] rounded-full bg-[rgb(24_22_20/5%)]" />
              </div>
            ) : (
              <div key={row.what} className="flex items-baseline justify-between gap-3 py-2">
                <span className="text-[11.5px] font-medium text-[#343433]">{row.what}</span>
                <span className="text-[10.5px] text-[#a5a29b]">{row.when}</span>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="mt-3 hidden border-t border-[#f2f1ee] pt-3 sm:block">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#a5a29b]">Recent activity</div>
        <div className="mt-1.5 flex flex-col">
          {ACTIVITY.map((row, index) =>
            row.name ? (
              <div key={row.name} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] font-medium leading-tight text-[#343433]">{row.name}</span>
                  <span className="block truncate text-[10px] leading-tight text-[#a5a29b]">{row.kind}</span>
                </span>
                <span className={cn("nums shrink-0 text-[11px] font-medium", row.positive ? "text-[#21803d]" : "text-[#343433]")}>
                  {row.amount}
                </span>
              </div>
            ) : (
              <div key={`act-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                <span className="h-[6px] w-[120px] rounded-full bg-[rgb(24_22_20/7%)]" />
                <span className="h-[6px] w-[54px] rounded-full bg-[rgb(24_22_20/5%)]" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The hero's product shot, after the stageshow skill: a real window on the
 * page's own ground, pinned top-left and running off the right and bottom
 * edges, with one satellite card straddling its edge over the rail (chrome,
 * never content). Built from the product's own numbers, drawn rather than
 * screenshotted, so the figure can count up and the bars can grow.
 */
export function HeroShot() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".fl-bar", {
        scaleY: 0,
        transformOrigin: "bottom center",
        duration: 1.05,
        ease: "power3.out",
        stagger: 0.06,
        delay: 0.45,
      });
      gsap.from(".fl-bar-label", {
        opacity: 0,
        y: 5,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.05,
        delay: 0.6,
      });
      gsap.from(".fl-satellite", { opacity: 0, y: 14, duration: 0.8, ease: "power3.out", delay: 0.75 });
    },
    { scope },
  );

  return (
    <div ref={scope} className="fl-stage relative mx-auto w-full max-w-[1120px]">
      <div className="fl-shot-clip relative h-[280px] overflow-hidden rounded-t-[20px] sm:h-[360px] lg:h-[420px]">
        <Window
          url="finlio.app/dashboard"
          urlShape="pill"
          nav
          sidebar={<Rail />}
          sidebarWidth={176}
          className="absolute left-0 top-0 h-[440px] w-full shadow-[var(--ss-shadow-hero)] sm:left-[3%] sm:h-[660px] sm:w-[97%]"
          body={{ className: "!p-0" }}
        >
          <ShotBody />
        </Window>

        <aside className="fl-satellite absolute left-0 top-[216px] hidden w-[220px] lg:block">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-[#a5a29b]">This month</span>
            <span className="rounded-full bg-[#f6f4ef] px-1.5 py-0.5 text-[9px] font-medium text-[#716f6b]">NOV 2026</span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {[
              { label: "In", value: "₹95.0K", tone: "text-[#21803d]" },
              { label: "Out", value: "₹28.3K", tone: "text-[#c53030]" },
              { label: "Saved", value: "₹66.7K", tone: "text-[#343433]" },
            ].map((cell) => (
              <div key={cell.label}>
                <div className="text-[9px] uppercase tracking-[0.07em] text-[#a5a29b]">{cell.label}</div>
                <div className={cn("nums text-[12px] font-semibold leading-tight", cell.tone)}>{cell.value}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
