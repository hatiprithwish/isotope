import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { ContactsQueries } from "../-data";
import { ContactDetailContent, type ContactDetailTab } from "../-ContactDetailContent";

const searchSchema = z.object({
  tab: z.enum(["history", "about", "draft"]).optional(),
});

export const Route = createFileRoute("/_authenticated/contacts/$contactId/")({
  validateSearch: searchSchema,
  component: ContactDetailPage,
});

function ContactDetailPage() {
  const { contactId } = Route.useParams();
  const { tab: tabParam } = Route.useSearch();
  const { getToken } = useAuth();
  const router = useRouter();
  const navigate = useNavigate({ from: Route.fullPath });
  // Derived from the URL (Route.useSearch is reactive) so back/forward and deep links always render the right tab.
  const activeTab: ContactDetailTab = tabParam ?? "history";

  const { data, isPending, isError } = useQuery(
    ContactsQueries.detail(Number(contactId), getToken),
  );
  const contact = data?.contact;

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError || !contact)
    return <div className="p-6 text-(--text-secondary) text-sm">Contact not found.</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ContactDetailContent
        contact={contact}
        getToken={getToken}
        activeTab={activeTab}
        onTabChange={(tab) => void navigate({ search: (prev) => ({ ...prev, tab }) })}
        onBack={() => router.history.back()}
        onDeleted={() => navigate({ to: "/contacts" })}
      />
    </div>
  );
}
