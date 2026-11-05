"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "cn"

import { Dialog, DialogContent as ArcDialogContent, type DialogContentProps as ArcProps } from "@/components/arc/dialog/dialog"

const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

// The uiarc dialog, for screens that lay out their own title and body. Width and
// height are set with the --dialog-width and --dialog-height variables.
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Omit<ArcProps, "title" | "description"> & { showCloseButton?: boolean }) {
  return (
    <ArcDialogContent
      aria-describedby={undefined}
      className={cn("grid gap-4 p-4 text-sm text-popover-foreground", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-4" aria-hidden />
        </DialogPrimitive.Close>
      )}
    </ArcDialogContent>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-base leading-none font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
