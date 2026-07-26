import type { MessageTemplate } from "./MessageTemplateCommon";
import type { ApiResponse } from "../common";

export interface GetMessageTemplatesApiResponse extends ApiResponse {
  templates?: MessageTemplate[];
}

export interface SaveMessageTemplateApiResponse extends ApiResponse {
  template?: MessageTemplate;
}

/** Resolved for a specific contact: which step/variant applies, and the pre-rendered body. */
export interface ResolveMessageTemplateApiResponse extends ApiResponse {
  step?: number;
  variantLabel?: string | null;
  renderedBody?: string;
  /** true when the contact's company had more than one distinct job role type, so the default template was used instead of a specific match. */
  isAmbiguousMatch?: boolean;
}
