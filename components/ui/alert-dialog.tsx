"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "cn"

import { Button, type ButtonProps } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

// A confirmation on the same uiarc dialog as every other window, so it stacks
// correctly on top of an open dialog. It closes only through its own buttons or Escape.
const AlertDialog = Dialog

function AlertDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      role="alertdialog"
      showCloseButton={false}
      onInteractOutside={(event) => event.preventDefault()}
      className={cn("gap-4 p-5 [--dialog-width:420px]", className)}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-dialog-header" className={cn("grid gap-1.5", className)} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn("mb-2 inline-flex size-10 items-center justify-center rounded-md bg-muted", className)}
      {...props}
    />
  )
}

const AlertDialogTitle = DialogTitle
const AlertDialogDescription = DialogDescription

function AlertDialogAction(props: ButtonProps) {
  return <Button data-slot="alert-dialog-action" {...props} />
}

function AlertDialogCancel({ variant = "outline", size = "default", ...props }: ButtonProps) {
  return (
    <DialogPrimitive.Close asChild>
      <Button data-slot="alert-dialog-cancel" variant={variant} size={size} {...props} />
    </DialogPrimitive.Close>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
}
