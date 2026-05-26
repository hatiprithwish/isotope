import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/companies/")({
  component: CompaniesPage,
});

function CompaniesPage() {
  return <div className="p-6 text-foreground">Companies</div>;
}
