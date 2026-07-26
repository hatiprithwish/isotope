import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { apiClient } from "@/providers/apiClient";
import type * as Schemas from "@app/schemas";
import { toast } from "sonner";

export class FollowUpSettingsQueries {
  static readonly keys = {
    latest: () => ["followup-settings", "latest"] as const,
  };

  static latest(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: FollowUpSettingsQueries.keys.latest(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetFollowUpSettingsApiResponse>("/followup-settings", getToken, {
          signal,
        }),
    });
  }
}

export function useSaveFollowUpSettings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.SaveFollowUpSettingsApiRequest) =>
      apiClient<Schemas.SaveFollowUpSettingsApiResponse>("/followup-settings", getToken, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: FollowUpSettingsQueries.keys.latest(),
      });
    },
    onError: () => {
      toast.error("Failed to save follow-up settings. Please try again.");
    },
  });
}

export class ContactRolePillsQueries {
  static readonly keys = {
    latest: () => ["contact-role-pills", "latest"] as const,
  };

  static latest(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: ContactRolePillsQueries.keys.latest(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetContactRolePillsApiResponse>("/contact-role-pills", getToken, {
          signal,
        }),
    });
  }
}

export function useSaveContactRolePills() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.SaveContactRolePillsApiRequest) =>
      apiClient<Schemas.SaveContactRolePillsApiResponse>("/contact-role-pills", getToken, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ContactRolePillsQueries.keys.latest(),
      });
    },
    onError: () => {
      toast.error("Failed to save contact role pills. Please try again.");
    },
  });
}

export class RoleTypesQueries {
  static readonly keys = {
    latest: () => ["role-types", "latest"] as const,
  };

  static latest(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: RoleTypesQueries.keys.latest(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetRoleTypesApiResponse>("/role-types", getToken, { signal }),
    });
  }
}

export function useSaveRoleTypes() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.SaveRoleTypesApiRequest) =>
      apiClient<Schemas.SaveRoleTypesApiResponse>("/role-types", getToken, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: RoleTypesQueries.keys.latest(),
      });
    },
    onError: () => {
      toast.error("Failed to save role types. Please try again.");
    },
  });
}

export class MessageTemplateQueries {
  static readonly keys = {
    all: () => ["message-templates"] as const,
  };

  static all(getToken: () => Promise<string | null>) {
    return queryOptions({
      queryKey: MessageTemplateQueries.keys.all(),
      queryFn: ({ signal }) =>
        apiClient<Schemas.GetMessageTemplatesApiResponse>("/message-template", getToken, {
          signal,
        }),
    });
  }
}

export function useSaveMessageTemplate() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Schemas.SaveMessageTemplateApiRequest) =>
      apiClient<Schemas.SaveMessageTemplateApiResponse>("/message-template", getToken, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: MessageTemplateQueries.keys.all(),
      });
    },
    onError: () => {
      toast.error("Failed to save message template. Please try again.");
    },
  });
}
