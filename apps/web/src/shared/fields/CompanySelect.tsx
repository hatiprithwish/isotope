import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { CompanyStatusIntEnum } from "@app/schemas";
import { CompaniesQueries, useCreateCompany } from "@/routes/_authenticated/companies/-data";
import SearchSelect from "./SearchSelect";

interface Props {
  value: number | null;
  /** `companyName` is the selected/created company's name — pass it through when you need the label without a separate (and possibly stale, right after an inline-create) lookup. */
  onChange: (companyId: number | null, companyName?: string) => void;
  onBlur?: () => void;
  error?: string;
  /** Lets the user create a new company inline from the search text. New companies are created with status ContactsAdded, since this is only offered from flows that immediately attach a contact to the new company. */
  allowCreate?: boolean;
}

export default function CompanySelect({ value, onChange, onBlur, error, allowCreate }: Props) {
  const { getToken } = useAuth();
  const { data } = useQuery(CompaniesQueries.list({}, getToken));
  const companies = data?.companies ?? [];
  const createCompany = useCreateCompany();

  async function handleCreateNewCompany(name: string): Promise<number> {
    const response = await createCompany.mutateAsync({
      company: { name, status: CompanyStatusIntEnum.ContactsAdded },
    });
    if (!response.company) throw new Error("Company creation failed");
    return response.company.id;
  }

  return (
    <SearchSelect
      value={value}
      options={companies.map((c) => ({ id: c.id, label: c.name }))}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      placeholder="Search companies…"
      onCreateNew={allowCreate ? handleCreateNewCompany : undefined}
      createNewLabel={(s) => `+ Create "${s}"`}
    />
  );
}
