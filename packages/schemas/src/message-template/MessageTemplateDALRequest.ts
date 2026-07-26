export type SaveMessageTemplateDALRequest = {
  createdBy: string;
  step: number;
  variantLabel: string | null;
  body: string;
};

export type GetMessageTemplatesDALRequest = {
  createdBy: string;
};

export type FindMessageTemplateDALRequest = {
  createdBy: string;
  step: number;
  variantLabel: string | null;
};
