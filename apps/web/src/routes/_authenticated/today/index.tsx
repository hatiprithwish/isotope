import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/today/")({
  component: TodayPage,
});

function TodayPage() {
  return <div className="p-6 text-foreground">Today</div>;
}
