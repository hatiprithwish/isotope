import { CalendarDotIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type * as Schemas from "@app/schemas";
import { formatMonthYear, getWeekdayLabel, toDateKey } from "./-utils";

interface MobileWeekStripProps {
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

export function MobileWeekStrip({
  weekDates,
  selectedDateKey,
  todayKey,
  monthAnchor,
  calendarDays,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onToday,
}: MobileWeekStripProps) {
  const dotsByDate = new Map(calendarDays.map((day) => [day.date, day]));

  return (
    <div className="bg-background">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[13px] font-semibold text-foreground">
          {formatMonthYear(monthAnchor)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToday}
            aria-label="Jump to today"
            className="w-7 h-7 rounded-full flex items-center justify-center text-(--text-secondary) active:bg-(--surface-raised)"
          >
            <CalendarDotIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onPrevWeek}
            className="w-7 h-7 rounded-full flex items-center justify-center text-(--text-secondary) active:bg-(--surface-raised)"
          >
            <CaretLeftIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="w-7 h-7 rounded-full flex items-center justify-center text-(--text-secondary) active:bg-(--surface-raised)"
          >
            <CaretRightIcon size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 pb-2">
        {weekDates.map((date) => {
          const dateKey = toDateKey(date);
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDateKey;
          const dots = dotsByDate.get(dateKey);
          const dotColor = dots?.hasPending
            ? "bg-(--warning)"
            : dots?.hasMissed
              ? "bg-(--danger)"
              : dots?.hasPaused
                ? "bg-(--text-secondary)"
                : dots?.hasCompleted
                  ? "bg-(--success)"
                  : null;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={[
                "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-colors",
                isSelected && !isToday ? "bg-(--surface-raised)" : "",
              ].join(" ")}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                {getWeekdayLabel(date).slice(0, 1)}
              </span>
              <span
                className={[
                  "w-7 h-7 rounded-full inline-flex items-center justify-center text-[13px] font-semibold",
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                ].join(" ")}
              >
                {date.getDate()}
              </span>
              <span className="h-1 w-1">
                {dotColor && (
                  <span className={["block w-1 h-1 rounded-full", dotColor].join(" ")} />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
