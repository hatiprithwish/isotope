import type { ApiResponse } from "../common";

export type BrowserRunBudget = {
  id: number;
  usedSeconds: number;
  resetAt: string;
  updatedAt: string | null;
};

export interface GetBrowserRunBudgetApiResponse extends ApiResponse {
  budget?: BrowserRunBudget;
}

export interface UpdateBrowserRunBudgetApiResponse extends ApiResponse {
  budget?: BrowserRunBudget;
}

export type IncrementBrowserRunBudgetDALRequest = {
  elapsedSeconds: number;
};
