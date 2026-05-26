import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class CompaniesQueries {
  static readonly keys = {
    all: () => ["companies"] as const,
    detail: (id: number) => ["companies", id] as const,
  };

  static list(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: CompaniesQueries.keys.all(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetCompaniesApiResponse>("/companies", getToken, { signal }),
    });
  }

  static detail(id: number, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: CompaniesQueries.keys.detail(id),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetCompanyApiResponse>(`/companies/${id}`, getToken, { signal }),
    });
  }
}

export function useCreateCompany() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.CreateCompanyApiRequest) =>
      apiClient<Schemas.CreateCompanyApiResponse>("/companies", getToken, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CompaniesQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to create company. Please try again.");
    },
  });
}

export function useUpdateCompany() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Schemas.UpdateCompanyApiRequest }) =>
      apiClient<Schemas.UpdateCompanyApiResponse>(`/companies/${id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async (response) => {
      if (response.company) {
        queryClient.setQueryData(CompaniesQueries.keys.detail(response.company.id), response);
      }
      await queryClient.invalidateQueries({ queryKey: CompaniesQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to update company. Please try again.");
    },
  });
}

export function useDeleteCompany() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient<void>(`/companies/${id}`, getToken, { method: "DELETE" }),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: CompaniesQueries.keys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: CompaniesQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to delete company. Please try again.");
    },
  });
}
