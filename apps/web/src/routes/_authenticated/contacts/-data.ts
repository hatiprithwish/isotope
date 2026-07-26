import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class ContactsQueries {
  static readonly keys = {
    all: () => ["contacts"] as const,
    list: (search: string, pageNo: number, pageSize: number) =>
      ["contacts", "list", search, pageNo, pageSize] as const,
    detail: (id: number) => ["contacts", id] as const,
    history: (id: number) => ["contacts", id, "history"] as const,
    messageTemplate: (id: number) => ["contacts", id, "message-template"] as const,
    duplicateCheck: (email: string, linkedinUrl: string, excludeId?: number) =>
      ["contacts", "duplicate-check", email, linkedinUrl, excludeId] as const,
  };

  static list(params: Schemas.GetContactsApiRequest, getToken: () => Promise<string | null>) {
    const pageNo = params.pageNo ?? 1;
    const pageSize = params.pageSize ?? 20;

    return queryOptions({
      queryKey: ContactsQueries.keys.list(params.search ?? "", pageNo, pageSize),
      queryFn: ({ signal }) => {
        const query = new URLSearchParams();
        if (params.search) query.set("search", params.search);
        query.set("pageNo", String(pageNo));
        query.set("pageSize", String(pageSize));
        return apiClient<Schemas.GetContactsApiResponse>(
          `/contacts?${query.toString()}`,
          getToken,
          { signal },
        );
      },
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

  static messageTemplate(id: number, getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: ContactsQueries.keys.messageTemplate(id),
      queryFn: ({ signal }) =>
        apiClient<Schemas.ResolveMessageTemplateApiResponse>(
          `/contacts/${id}/message-template`,
          getToken,
          { signal },
        ),
    });
  }

  static duplicateCheck(
    params: Schemas.CheckDuplicateContactApiRequest,
    getToken: () => Promise<string | null>,
  ) {
    return queryOptions({
      queryKey: ContactsQueries.keys.duplicateCheck(
        params.email ?? "",
        params.linkedinUrl ?? "",
        params.excludeId,
      ),
      queryFn: ({ signal }) => {
        const query = new URLSearchParams();
        if (params.email) query.set("email", params.email);
        if (params.linkedinUrl) query.set("linkedinUrl", params.linkedinUrl);
        if (params.excludeId != null) query.set("excludeId", String(params.excludeId));
        return apiClient<Schemas.CheckDuplicateContactApiResponse>(
          `/contacts/duplicate-check?${query.toString()}`,
          getToken,
          { signal },
        );
      },
      staleTime: 0,
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

export function useBulkDeleteContacts() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) =>
      apiClient<Schemas.BulkDeleteContactsApiResponse>("/contacts/bulk", getToken, {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: async (_data, ids) => {
      ids.forEach((id) => queryClient.removeQueries({ queryKey: ContactsQueries.keys.detail(id) }));
      await queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to delete contacts. Please try again.");
    },
  });
}

export function useBulkUpdateContacts() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.BulkUpdateContactsApiRequest) =>
      apiClient<Schemas.BulkUpdateContactsApiResponse>("/contacts/bulk", getToken, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.all() });
    },
    onError: () => {
      toast.error("Failed to update selected contacts. Please try again.");
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
      body: Schemas.LogContactHistoryApiRequest;
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

export function useUpdateContactHistory() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      historyId,
      body,
    }: {
      contactId: number;
      historyId: number;
      body: Schemas.UpdateContactHistoryApiRequest;
    }) =>
      apiClient<Schemas.UpdateContactHistoryApiResponse>(
        `/contacts/${contactId}/history/${historyId}`,
        getToken,
        { method: "PATCH", body: JSON.stringify(body) },
      ),
    onSuccess: async (_data, { contactId }) => {
      await queryClient.invalidateQueries({
        queryKey: ContactsQueries.keys.history(contactId),
      });
    },
    onError: () => {
      toast.error("Failed to update history entry. Please try again.");
    },
  });
}

export function useDeleteContactHistory() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, historyId }: { contactId: number; historyId: number }) =>
      apiClient<Schemas.DeleteContactHistoryApiResponse>(
        `/contacts/${contactId}/history/${historyId}`,
        getToken,
        { method: "DELETE" },
      ),
    onSuccess: async (_data, { contactId }) => {
      await queryClient.invalidateQueries({
        queryKey: ContactsQueries.keys.history(contactId),
      });
    },
    onError: () => {
      toast.error("Failed to delete history entry. Please try again.");
    },
  });
}
