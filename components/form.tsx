"use client";

import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-body">
        {label}
      </Label>
      {children}
      {error && <p className="text-[13px] text-loss">{error}</p>}
    </div>
  );
}

type Option = { value: string; label: React.ReactNode; disabled?: boolean };

function readOptions(children: React.ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
    if (child.type === "option") {
      const label = props.children;
      const text = typeof label === "string" || typeof label === "number" ? String(label) : "";
      out.push({ value: String(props.value ?? text), label, disabled: props.disabled });
    } else if (props.children) {
      out.push(...readOptions(props.children));
    }
  });
  return out;
}

// A styled dropdown that keeps the native <select> API (<option> children and
// onChange with event.target.value), so existing forms work unchanged.
export function Select({
  className,
  children,
  value,
  onChange,
  id,
  disabled,
  "aria-label": ariaLabel,
}: Omit<React.ComponentProps<"select">, "value" | "onChange"> & {
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  const options = useMemo(() => readOptions(children), [children]);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<{ up: boolean; max: number }>({ up: false, max: 256 });

  const selected = options.findIndex((o) => o.value === String(value ?? ""));
  const current = options[selected] ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    // Capture on the window so Escape closes only the list, not a dialog around it.
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      root.current?.querySelector("button")?.focus();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onEscape, true);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onEscape, true);
    };
  }, [open]);

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    const target = { value: option.value } as HTMLSelectElement;
    onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    root.current?.querySelector("button")?.focus();
  }

  // Fit the list inside whatever clips it (a dialog, a scroll area, the window):
  // open upward when there's more room above, and scroll if neither side fits.
  function show() {
    const button = root.current?.querySelector("button");
    if (button) {
      const rect = button.getBoundingClientRect();
      let top = 0;
      let bottom = window.innerHeight;
      for (let el = root.current?.parentElement; el; el = el.parentElement) {
        const overflow = getComputedStyle(el).overflowY;
        if (overflow !== "visible") {
          const box = el.getBoundingClientRect();
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
      }
      const below = bottom - rect.bottom - 12;
      const above = rect.top - top - 12;
      const want = Math.min(256, options.length * 36 + 8);
      const up = below < want && above > below;
      setPlace({ up, max: Math.max(120, Math.min(256, up ? above : below)) });
    }
    setActive(Math.max(selected, 0));
    setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return show();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + options.length) % options.length);
    } else if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={root} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 text-left text-[14px] text-ink outline-none transition-colors hover:border-ink/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-ring ring-3 ring-ring/30",
          className,
        )}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listId}-${active}`}
          style={{ maxHeight: place.max }}
          className={cn(
            "absolute right-0 left-0 z-50 min-w-full overflow-y-auto rounded-xl border border-line bg-popover p-1 text-popover-foreground shadow-[0_16px_40px_-12px_rgba(18,18,18,0.28)] animate-in fade-in-0 zoom-in-95",
            place.up ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
          )}
        >
          {options.map((option, index) => {
            const isSelected = index === selected;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[14px] text-body",
                  index === active && "bg-sand text-ink",
                  isSelected && "font-medium text-ink",
                  option.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-success" strokeWidth={2} aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
