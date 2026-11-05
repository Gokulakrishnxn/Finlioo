import Link from "next/link";
import { BrandLogo, IconBadge } from "@/components/brand-logo";
import { merchantDomain } from "@/lib/brands";
import { categoryLook } from "@/lib/category-icons";
import { formatDate } from "@/lib/format";
import { compactMoney, type Activity } from "@/lib/networth";
import { t } from "@/lib/i18n";

export function RecentActivity({ items, limit = 5 }: { items: Activity[]; limit?: number }) {
  return (
    <section className="card-surface p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{t("Recent activity")}</p>
        <Link href="/transactions" className="text-[12px] text-success hover:underline">
          {t("All →")}
        </Link>
      </div>
      {items.length ? (
        <ul className="mt-2 flex flex-col">
          {items.slice(0, limit).map((a) => (
            <ActivityRow key={a.id} item={a} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[14px] leading-relaxed text-body">
          {t("Nothing yet. Add an expense or income on Transactions.")}
        </p>
      )}
    </section>
  );
}

export function ActivityRow({ item, action }: { item: Activity; action?: React.ReactNode }) {
  const income = item.type === "income";
  const look = categoryLook(item.category);
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <BrandLogo
        domain={merchantDomain(item.title)}
        fallback={<IconBadge icon={look.icon} tint={look.tint} />}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{item.title}</p>
        <p className="text-[12px] text-muted-foreground">
          {t(item.category)} · {formatDate(item.date)}
          {item.source === "gmail" && " · Gmail"}
        </p>
      </div>
      <p className={`nums text-[14px] ${income ? "text-success" : "text-ink"}`}>
        {income ? "+" : "−"}
        {compactMoney(item.amount)}
      </p>
      {action}
    </li>
  );
}
