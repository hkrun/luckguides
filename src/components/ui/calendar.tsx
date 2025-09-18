"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "w-full",
        month: "space-y-4",
        caption: "flex justify-center relative items-center",
        nav: "flex items-center gap-1",
        nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute top-1"),
        nav_button_previous: "left-1",
        nav_button_next: "right-1",
        table: "w-full border-collapse",
        head_row: "flex w-full",
        head_cell: cn("text-muted-foreground w-9 font-normal text-[0.8rem]", "text-center"),
        row: "flex w-full mt-2",
        cell: cn(
          "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        ),
        day: cn(
          "h-9 w-9 p-0 font-normal",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground focus:outline-none",
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary",
          "hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        ),
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames
      }}
      // components={{
      //   IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
      //   IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      // }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
