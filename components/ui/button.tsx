"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

import { Button as ArcButton, type ButtonProps as ArcButtonProps } from "@/components/arc/button/button"

// Kept for icon-only and link buttons, and for the calendar, which styles its own day cells.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-card hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]>

export type ButtonProps = Omit<ArcButtonProps, "variant" | "size"> & { variant?: Variant; size?: Size }

const ARC_VARIANT: Partial<Record<Variant, ArcButtonProps["variant"]>> = {
  default: "primary",
  outline: "secondary",
  secondary: "secondary",
  ghost: "ghost",
  destructive: "danger",
}

const ARC_SIZE: Partial<Record<Size, ArcButtonProps["size"]>> = { default: "md", sm: "sm", lg: "lg" }

// Every text button in the app is the uiarc Button. The same variant and size names
// keep working, and it stays type="button" unless a form asks for "submit".
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref,
) {
  const arcVariant = ARC_VARIANT[variant]
  const arcSize = ARC_SIZE[size]

  if (!arcVariant || !arcSize) {
    return (
      <button
        ref={ref}
        type={type}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }

  return (
    <ArcButton
      ref={ref}
      type={type}
      data-slot="button"
      variant={arcVariant}
      size={arcSize}
      className={className}
      {...props}
    />
  )
})

export { Button, buttonVariants }
