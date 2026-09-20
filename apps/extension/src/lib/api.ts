import type * as Schemas from "@app/schemas";

const API_ORIGIN = import.meta.env.WXT_API_ORIGIN;

/** Thrown with the server's own message so the panel can surface it verbatim. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Calls the Isotope API from the side panel. The panel is an extension-origin page, so requests
 * carry `chrome-extension://<id>` as their Origin — that value has to be present in the API's
 * ALLOWED_CORS_ORIGIN, which AuthMiddleware also reuses as Clerk's `authorizedParties`.
 */
async function apiClient<TResponse extends Schemas.ApiResponse>(
  path: string,
  token: string | null,
  init?: RequestInit,
): Promise<TResponse> {
  if (!token) throw new ApiError("Not signed in to Isotope", 401);

  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
  } catch {
    // fetch() rejects on network failure and on a CORS rejection — both look identical here.
    throw new ApiError("Could not reach Isotope. Check your connection.", 0);
  }

  let body: TResponse;
  try {
    body = (await response.json()) as TResponse;
  } catch {
    throw new ApiError(`Unexpected response from Isotope (${response.status})`, response.status);
  }

  if (!response.ok || !body.isSuccess) {
    throw new ApiError(body.message ?? `Request failed (${response.status})`, response.status);
  }

  return body;
}

export async function checkDuplicate(linkedinUrl: string, token: string | null) {
  const query = new URLSearchParams({ linkedinUrl });
  return await apiClient<Schemas.CheckDuplicateContactApiResponse>(
    `/contacts/duplicate-check?${query.toString()}`,
    token,
    { method: "GET" },
  );
}

/**
 * Messaging threads link to participants by opaque member URN, not by `/in/<slug>`, so a thread
 * can only be matched to a contact by name. Kept small: the panel shows the matches for the user
 * to choose between rather than guessing past the first page.
 */
export async function searchContacts(search: string, token: string | null) {
  const query = new URLSearchParams({ search, pageSize: "10" });
  return await apiClient<Schemas.GetContactsApiResponse>(`/contacts?${query.toString()}`, token, {
    method: "GET",
  });
}

export async function getContactHistory(contactId: number, token: string | null) {
  return await apiClient<Schemas.GetContactHistoryApiResponse>(
    `/contacts/${contactId}/history`,
    token,
    { method: "GET" },
  );
}

export async function bulkLogHistory(
  payload: Schemas.BulkLogContactHistoryApiRequest,
  token: string | null,
) {
  return await apiClient<Schemas.BulkLogContactHistoryApiResponse>(
    "/contacts/history/bulk",
    token,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function parseProfile(payload: Schemas.ParseProfileApiRequest, token: string | null) {
  return await apiClient<Schemas.ParseProfileApiResponse>("/contacts/parse-profile", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function captureContact(
  payload: Schemas.CaptureContactApiRequest,
  token: string | null,
) {
  return await apiClient<Schemas.CaptureContactApiResponse>("/contacts/capture", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
