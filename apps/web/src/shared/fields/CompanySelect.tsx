import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { CompaniesQueries } from "@/routes/_authenticated/companies/-data";
import SearchSelect from "./SearchSelect";

interface Props {
  value: number | null;
  onChange: (companyId: number | null) => void;
  onBlur?: () => void;
  error?: string;
}

export default function CompanySelect({ value, onChange, onBlur, error }: Props) {
  const { getToken } = useAuth();
  const { data } = useQuery(CompaniesQueries.list({}, getToken));
  const companies = data?.companies ?? [];

  return (
    <SearchSelect
      value={value}
      options={companies.map((c) => ({ id: c.id, label: c.name }))}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      placeholder="Search companies…"
    />
  );
}
