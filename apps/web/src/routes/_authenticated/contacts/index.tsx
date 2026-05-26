import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/contacts/")({
  component: ContactsPage,
});

function ContactsPage() {
  return <div className="p-6 text-foreground">Contacts</div>;
}
