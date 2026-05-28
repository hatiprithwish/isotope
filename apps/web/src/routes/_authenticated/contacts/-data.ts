import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class ContactsQueries {
  static readonly keys = {
    all: () => ["contacts"] as const,
    detail: (id: number) => ["contacts", id] as const,
    history: (id: number) => ["contacts", id, "history"] as const,
  };

  static list(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: ContactsQueries.keys.all(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetContactsApiResponse>("/contacts", getToken, { signal }),
    });
  }

  static detail(id: number, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: ContactsQueries.keys.detail(id),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetContactApiResponse>(`/contacts/${id}`, getToken, { signal }),
    });
  }

  static history(id: number, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: ContactsQueries.keys.history(id),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetContactHistoryApiResponse>(`/contacts/${id}/history`, getToken, {
          signal,
        }),
    });
  }
}

export function useCreateContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.CreateContactApiRequest) =>
      apiClient<Schemas.CreateContactApiResponse>("/contacts", getToken, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to create contact. Please try again.");
    },
  });
}

export function useUpdateContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Schemas.UpdateContactApiRequest }) =>
      apiClient<Schemas.UpdateContactApiResponse>(`/contacts/${id}`, getToken, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async (response) => {
      if (response.contact) {
        queryClient.setQueryData(ContactsQueries.keys.detail(response.contact.id), response);
      }
      await queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to update contact. Please try again.");
    },
  });
}

export function useDeleteContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient<void>(`/contacts/${id}`, getToken, { method: "DELETE" }),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: ContactsQueries.keys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to delete contact. Please try again.");
    },
  });
}

export function useCreateContactHistory() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      body,
    }: {
      contactId: number;
      body: Schemas.CreateContactHistoryApiRequest;
    }) =>
      apiClient<Schemas.CreateContactHistoryApiResponse>(
        `/contacts/${contactId}/history`,
        getToken,
        { method: "POST", body: JSON.stringify(body) },
      ),
    onSuccess: async (_data, { contactId }) => {
      await queryClient.invalidateQueries({
        queryKey: ContactsQueries.keys.history(contactId),
      });
    },
    onError: () => {
      toast.error("Failed to save history entry. Please try again.");
    },
  });
}
