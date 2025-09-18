import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
        "dark:from-gray-700 dark:via-gray-600 dark:to-gray-700",
        className
      )}
      style={{
        animation: "shimmer 2s infinite linear",
      }}
      {...props}
    />
  )
}

export { Skeleton }