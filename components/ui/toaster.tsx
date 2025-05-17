"use client"

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => {
        // Add custom styling based on variant
        let bgColor = "bg-background"
        let borderColor = "border-border"
        let textColor = "text-foreground"

        if (props.variant === "destructive") {
          bgColor = "bg-destructive/15"
          borderColor = "border-destructive/30"
          textColor = "text-destructive-foreground"
        } else if (props.variant === "success") {
          bgColor = "bg-green-100"
          borderColor = "border-green-300"
          textColor = "text-green-800"
        }

        return (
          <Toast key={id} {...props} className={`${bgColor} ${borderColor} ${textColor} ${props.className || ""}`}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
