import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { z } from "zod";
import { Input } from "@/shadcn/ui/input";
import * as Schemas from "@app/schemas";
import { ContactDetailPanel } from "../contacts/-DesktopPanel";
import { TasksQueries, useUpdateTaskStatus } from "./-data";
import { WeekStrip } from "./-WeekStrip";
import { TaskSection } from "./-TaskSection";
import { MobileTasksHeader } from "./-MobileTasksHeader";
import { MobileWeekStrip } from "./-MobileWeekStrip";
import { MobileTaskSection } from "./-MobileTaskSection";
import {
  addDays,
  formatSectionDate,
  fromDateKey,
  getSectionLabel,
  getWeekDates,
  toDateKey,
} from "./-utils";

const searchSchema = z.object({
  /** Contact id whose conversation is shown in the desktop side panel. */
  panel: z.number().optional(),
});

export const Route = createFileRoute("/_authenticated/tasks/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Tasks · Isotope" }] }),
  component: TasksPage,
});

function TasksPage() {
  const { getToken } = useAuth();
  const { panel } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const updateTaskStatus = useUpdateTaskStatus();
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
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

  function toggleConversationPanel(contactId: number) {
    void navigate({
      search: (prev) => ({ ...prev, panel: prev.panel === contactId ? undefined : contactId }),
    });
  }

  function closeConversationPanel() {
    void navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  const isSearching = deferredQuery.length > 0;

  return (
    <>
      <div className="flex flex-col h-full md:hidden overflow-hidden">
        <MobileTasksHeader
          searchQuery={searchQuery}
          mobileSearch={mobileSearch}
          onSearchToggle={() => setMobileSearch((s) => !s)}
          onSearchChange={setSearchQuery}
        />

        {!isSearching && (
          <>
            <MobileWeekStrip
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
              <p className="px-4 pb-2 text-[12px] text-(--danger-text)">Failed to load calendar.</p>
            )}
          </>
        )}

        <div className="flex-1 overflow-y-auto pb-6">
          {isSearching ? (
            <MobileTaskSection
              title={`Search results for "${deferredQuery}"`}
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
              <MobileTaskSection
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

              <MobileTaskSection
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

      <div className="hidden md:flex h-full overflow-hidden bg-background relative">
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto p-6 flex flex-col gap-5">
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
                onOpenConversation={toggleConversationPanel}
                selectedContactId={panel ?? null}
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
                  onOpenConversation={toggleConversationPanel}
                  selectedContactId={panel ?? null}
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
                  onOpenConversation={toggleConversationPanel}
                  selectedContactId={panel ?? null}
                />
              </>
            )}
          </div>
        </div>

        <ContactDetailPanel
          contactId={panel ?? null}
          contact={null}
          onClose={closeConversationPanel}
        />
      </div>
    </>
  );
}
