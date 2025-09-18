"use client"

import { ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"

interface AlertDialogAdditionalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  actionText: string
  cancelText: string
  onAction: () => void
  icon?: ReactNode
}

export function AlertDialogAdditional({
  open,
  onOpenChange,
  title,
  description,
  actionText,
  cancelText,
  onAction,
  icon = <AlertCircle className="h-5 w-5 text-primary" />
}: AlertDialogAdditionalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-primary/30 shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <div className="rounded-full bg-secondary/20 p-2 dark:bg-secondary/30">
              {icon}
            </div>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-3 text-base text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <AlertDialogAction 
            onClick={onAction}
            className="w-full bg-primary hover:bg-primary/90 text-white dark:bg-primary/80 dark:hover:bg-primary sm:w-auto"
          >
            {actionText}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full border-primary/20 text-muted-foreground hover:bg-primary/5 hover:text-foreground dark:border-primary/30 sm:w-auto">
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}