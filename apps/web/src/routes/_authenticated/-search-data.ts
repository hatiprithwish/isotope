import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";

export class SearchQueries {
  static readonly keys = {
    all: () => ["search"] as const,
    query: (q: string) => ["search", q] as const,
  };

  static results(q: string, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: SearchQueries.keys.query(q),
      queryFn: ({ signal }) =>
        apiClient<Schemas.SearchApiResponse>(`/search?q=${encodeURIComponent(q)}`, getToken, {
          signal,
        }),
      enabled: q.length > 0,
    });
  }
}
