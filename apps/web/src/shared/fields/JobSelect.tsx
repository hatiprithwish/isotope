import { useJobs } from "@/routes/_authenticated/jobs/-data";
import SearchSelect from "./SearchSelect";

interface Props {
  value: number | null;
  onChange: (jobId: number | null) => void;
  onBlur?: () => void;
  error?: string;
}

export default function JobSelect({ value, onChange, onBlur, error }: Props) {
  const { data } = useJobs({});
  const jobs = data?.jobs ?? [];

  return (
    <SearchSelect
      value={value}
      options={jobs.map((j) => ({ id: j.id, label: j.title }))}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      placeholder="Search jobs…"
    />
  );
}
