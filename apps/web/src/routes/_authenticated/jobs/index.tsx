import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/jobs/")({
  component: JobsPage,
});

function JobsPage() {
  return <div className="p-6 text-foreground">Jobs</div>;
}
