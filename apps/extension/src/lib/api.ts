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

export async function captureContact(
  payload: Schemas.CaptureContactApiRequest,
  token: string | null,
) {
  return await apiClient<Schemas.CaptureContactApiResponse>("/contacts/capture", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
