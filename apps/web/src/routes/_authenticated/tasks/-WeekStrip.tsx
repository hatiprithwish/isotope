import { CaretLeftIcon, CaretRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import { formatMonthYear, getWeekdayLabel, toDateKey } from "./-utils";

interface WeekStripProps {
  weekDates: Date[];
  selectedDateKey: string;
  todayKey: string;
  monthAnchor: Date;
  calendarDays: Schemas.TaskCalendarDay[];
  onSelectDate: (dateKey: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekStrip({
  weekDates,
  selectedDateKey,
  todayKey,
  monthAnchor,
  calendarDays,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekStripProps) {
  const dotsByDate = new Map(calendarDays.map((day) => [day.date, day]));

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Button type="button" variant="outline" size="lg" onClick={onToday}>
          Today
        </Button>
        <Button type="button" variant="outline" size="icon-lg" onClick={onPrevWeek}>
          <CaretLeftIcon size={16} />
        </Button>
        <Button type="button" variant="outline" size="icon-lg" onClick={onNextWeek}>
          <CaretRightIcon size={16} />
        </Button>
        <span className="text-[15px] font-semibold text-foreground flex items-center gap-1">
          {formatMonthYear(monthAnchor)}
          <CaretDownIcon size={14} className="text-(--text-secondary)" />
        </span>
      </div>

      <div className="grid grid-cols-7 divide-x divide-border overflow-x-auto">
        {weekDates.map((date) => {
          const dateKey = toDateKey(date);
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDateKey;
          const dots = dotsByDate.get(dateKey);
          const dotColor = dots?.hasPending
            ? "bg-(--warning)"
            : dots?.hasMissed
              ? "bg-(--danger)"
              : dots?.hasCompleted
                ? "bg-(--success)"
                : null;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={[
                "flex flex-col items-center gap-2 py-3 min-w-[64px] transition-colors",
                isSelected && !isToday ? "bg-(--surface-raised)" : "hover:bg-(--surface-raised)",
              ].join(" ")}
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                {getWeekdayLabel(date)}
              </span>
              <span
                className={[
                  "w-8 h-8 rounded-full inline-flex items-center justify-center text-[15px] font-semibold",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                ].join(" ")}
              >
                {date.getDate()}
              </span>
              <span className="h-1.5 w-1.5">
                {dotColor && (
                  <span className={["block w-1.5 h-1.5 rounded-full", dotColor].join(" ")} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
