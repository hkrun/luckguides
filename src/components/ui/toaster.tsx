"use client"

import { useToast, ToasterToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastPosition,
} from "@/components/ui/toast"

function groupToastsByPosition(toasts: ToasterToast[]) {
  return toasts.reduce<Record<string, ToasterToast[]>>((acc, toast) => {
    const position = toast.position || "bottom-right";
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {});
}

export function Toaster() {
  const { toasts } = useToast()

  const toastsByPosition = groupToastsByPosition(toasts);

  return (
    <ToastProvider>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <ToastViewport key={position} position={position as ToastPosition}>
          {positionToasts.map(({ id, title, description, action, ...props }) => (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          ))}
        </ToastViewport>
      ))}
    </ToastProvider>
  )
}
