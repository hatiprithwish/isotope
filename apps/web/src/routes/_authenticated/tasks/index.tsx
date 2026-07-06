import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/shadcn/ui/input";
import * as Schemas from "@app/schemas";
import { TasksQueries, useUpdateTaskStatus } from "./-data";
import { WeekStrip } from "./-WeekStrip";
import { TaskSection } from "./-TaskSection";
import {
  addDays,
  formatSectionDate,
  fromDateKey,
  getSectionLabel,
  getWeekDates,
  toDateKey,
} from "./-utils";

export const Route = createFileRoute("/_authenticated/tasks/")({
  component: TasksPage,
});

function TasksPage() {
  const { getToken } = useAuth();
  const updateTaskStatus = useUpdateTaskStatus();
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery.trim());

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const selectedDate = useMemo(() => fromDateKey(selectedDateKey), [selectedDateKey]);

  const calendarStart = toDateKey(weekDates[0]!);
  const calendarEnd = toDateKey(addDays(weekDates[6]!, 1));
  const calendarQuery = useQuery(TasksQueries.calendar(calendarStart, calendarEnd, getToken));
  const selectedDayQuery = useQuery(TasksQueries.day(selectedDateKey, getToken));
  const pastQuery = useQuery(TasksQueries.past(getToken));
  const searchQueryResult = useQuery(TasksQueries.search(deferredQuery, getToken));

  // Derived from the mutation itself — no parallel state to desync.
  const updatingTaskId = updateTaskStatus.isPending ? updateTaskStatus.variables.id : null;

  function toggleTask(task: Schemas.TaskWithMeta) {
    updateTaskStatus.mutate({
      id: task.id,
      status:
        task.status === Schemas.TaskStatusIntEnum.Completed
          ? Schemas.TaskStatusIntEnum.Pending
          : Schemas.TaskStatusIntEnum.Completed,
    });
  }

  const isSearching = deferredQuery.length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="max-w-[1280px] w-full mx-auto p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-foreground">Tasks</h1>
            <p className="text-[13px] text-(--text-secondary) mt-0.5">
              Stay on top of every follow-up.
            </p>
          </div>
          <div className="relative w-64 shrink-0">
            <MagnifyingGlassIcon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8"
            />
          </div>
        </div>

        {!isSearching && (
          <>
            <WeekStrip
              weekDates={weekDates}
              selectedDateKey={selectedDateKey}
              todayKey={todayKey}
              monthAnchor={weekAnchor}
              calendarDays={calendarQuery.data?.days ?? []}
              onSelectDate={setSelectedDateKey}
              onPrevWeek={() => setWeekAnchor((d) => addDays(d, -7))}
              onNextWeek={() => setWeekAnchor((d) => addDays(d, 7))}
              onToday={() => {
                setWeekAnchor(new Date());
                setSelectedDateKey(todayKey);
              }}
            />
            {calendarQuery.isError && (
              <p className="text-[13px] text-(--danger-text)">Failed to load calendar.</p>
            )}
          </>
        )}

        {isSearching ? (
          <TaskSection
            title={`Search results for “${deferredQuery}”`}
            tasks={searchQueryResult.data?.tasks ?? []}
            isLoading={searchQueryResult.isPending}
            isError={searchQueryResult.isError}
            emptyLabel="No tasks found."
            onToggleTask={toggleTask}
            updatingTaskId={updatingTaskId}
            collapsible={false}
          />
        ) : (
          <>
            <TaskSection
              title={getSectionLabel(selectedDateKey, todayKey)}
              dateLabel={formatSectionDate(selectedDate)}
              tasks={selectedDayQuery.data?.tasks ?? []}
              isLoading={selectedDayQuery.isPending}
              isError={selectedDayQuery.isError}
              emptyLabel="No follow-ups for this day."
              onToggleTask={toggleTask}
              updatingTaskId={updatingTaskId}
              collapsible={false}
            />

            <TaskSection
              title="Past tasks"
              tasks={pastQuery.data?.tasks ?? []}
              isLoading={pastQuery.isPending}
              isError={pastQuery.isError}
              defaultOpen={false}
              emptyLabel="No past follow-ups."
              onToggleTask={toggleTask}
              updatingTaskId={updatingTaskId}
            />
          </>
        )}
      </div>
    </div>
  );
}
