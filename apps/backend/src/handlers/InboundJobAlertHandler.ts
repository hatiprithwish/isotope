import { Resend } from "resend";
import type { GetReceivingEmailResponseSuccess } from "resend";
import JobsDAL from "@/data-access-layer/JobsDAL";
import CompaniesDAL from "@/data-access-layer/CompaniesDAL";
import BrowserRunBudgetDAL from "@/data-access-layer/BrowserRunBudgetDAL";
import AppLogger from "@/providers/AppLogger";
import Constants from "@/config/Constants";
import EnvConfig from "@/config/EnvConfig";
import * as Schemas from "@app/schemas";

interface InboundJobAlertMessage {
  type: "InboundJobAlert";
  action: "Process";
  emailId: string;
  userId: string;
}

interface BrowserRunExtracted {
  title: string | null;
  company: string | null;
  salary: string | null;
  description: string | null;
  skills: string[];
}

export default class InboundJobAlertHandler {
  static isBlockedUrl(rawUrl: string): boolean {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return true;
    }
    const host = parsed.hostname.replace(/^www\./, "");
    for (const domain of Constants.INBOUND_BLOCKED_DOMAINS) {
      if (host === domain || host.endsWith(`.${domain}`)) return true;
    }
    const pathname = parsed.pathname.toLowerCase();
    for (const segment of Constants.INBOUND_BLOCKED_PATHS) {
      if (pathname.startsWith(segment) || pathname.includes(`${segment}/`)) return true;
    }
    return false;
  }

  static extractHttpsUrls(html: string): string[] {
    const seen = new Set<string>();
    const urls: string[] = [];
    const hrefRe = /href=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = hrefRe.exec(html)) !== null) {
      const href = match[1] ?? "";
      if (
        href.startsWith("https://") &&
        !seen.has(href) &&
        !InboundJobAlertHandler.isBlockedUrl(href)
      ) {
        seen.add(href);
        urls.push(href);
      }
    }
    return urls;
  }

  static titleFallback(url: string): string {
    try {
      const parsed = new URL(url);
      const slug =
        parsed.pathname
          .replace(/^\/|\/$/g, "")
          .split("/")
          .pop() ?? "";
      return slug || parsed.hostname;
    } catch {
      return url;
    }
  }

  static async resolveRedirectUrl(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.url && res.url !== url ? res.url : url;
    } catch {
      return url;
    }
  }

  static async scrapeJobUrl(url: string, env: Env): Promise<BrowserRunExtracted | null> {
    const accountId = EnvConfig.cloudflareAccountId(env);
    const token = EnvConfig.cloudflareIsotopeToken(env);
    const apiUrl = Constants.BROWSER_RUN_URL.replace("{accountId}", accountId);

    AppLogger.info({
      category: Schemas.LogCategory.Provider,
      action: Schemas.LogAction.InboundScrapeStarted,
      message: "Calling Browser Run /json",
      metadata: { url },
    });

    const doFetch = async (): Promise<Response | null> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Constants.BROWSER_RUN_TIMEOUT_MS);
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url, prompt: Constants.BROWSER_RUN_PROMPT }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return res;
      } catch (error) {
        clearTimeout(timeoutId);
        AppLogger.error({
          category: Schemas.LogCategory.Provider,
          action: Schemas.LogAction.InboundScrapeFailed,
          message: "Browser Run fetch failed",
          error,
          metadata: { url },
        });
        return null;
      }
    };

    try {
      let res = await doFetch();
      if (!res) return null;

      if (res.status === 429) {
        const retryAfterSec = Number(res.headers.get("Retry-After") ?? "2");
        const waitMs = (isNaN(retryAfterSec) ? 2 : retryAfterSec) * 1_000;
        AppLogger.warn({
          category: Schemas.LogCategory.Provider,
          action: Schemas.LogAction.InboundScrapeFailed,
          message: `Browser Run 429 — retrying after ${waitMs}ms`,
          metadata: { url, waitMs },
        });
        await new Promise((r) => setTimeout(r, waitMs));
        res = await doFetch();
        if (!res) return null;
      }

      if (!res.ok) {
        AppLogger.error({
          category: Schemas.LogCategory.Provider,
          action: Schemas.LogAction.InboundScrapeFailed,
          message: `Browser Run returned ${res.status}`,
          metadata: { url, status: res.status },
        });
        return null;
      }

      const json = (await res.json()) as unknown;
      const extracted = json as BrowserRunExtracted;

      return {
        title: extracted?.title ?? null,
        company: extracted?.company ?? null,
        salary: extracted?.salary ?? null,
        description: extracted?.description ?? null,
        skills: Array.isArray(extracted?.skills) ? extracted.skills : [],
      };
    } catch (error) {
      AppLogger.error({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.InboundScrapeFailed,
        message: "Browser Run response parse failed",
        error,
        metadata: { url },
      });
      return null;
    }
  }

  static async resolveCompanyId(
    companyName: string | null,
    userId: string,
    env: Env,
  ): Promise<number | null> {
    if (!companyName) return null;

    const companiesDAL = new CompaniesDAL(env);

    const existing = await companiesDAL.findCompanyByName({
      createdBy: userId,
      name: companyName,
    });
    if (existing) return existing.id;

    const created = await companiesDAL.createCompany({
      createdBy: userId,
      name: companyName,
      status: Schemas.CompanyStatusIntEnum.WaitingHuman,
      website: null,
      industry: null,
      size: null,
      location: null,
      isSalaryMatch: null,
      isLocationMatch: null,
      isEthicsCompliant: null,
      ethicsNotes: null,
      weightedScore: null,
      fitBand: null,
      aiSummary: null,
      userContext: null,
      notes: null,
    });

    return created.company?.id ?? null;
  }

  static async handle(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    const resend = new Resend(EnvConfig.resendApiKey(env));

    for (const message of batch.messages) {
      const msg = message.body as InboundJobAlertMessage;

      if (msg?.type !== "InboundJobAlert" || msg?.action !== "Process") {
        message.ack();
        continue;
      }

      const { emailId, userId } = msg;

      const emailResult = await resend.emails.receiving.get(emailId);
      const emailData = emailResult.data as GetReceivingEmailResponseSuccess | null;

      AppLogger.info({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.InboundEmailReceived,
        message: "Resend receiving.get result",
        metadata: {
          emailId,
          userId,
          hasError: !!emailResult.error,
          errorDetail: emailResult.error ?? null,
          hasHtml: !!emailData?.html,
          htmlLength: emailData?.html?.length ?? 0,
          subject: emailData?.subject ?? null,
          from: emailData?.from ?? null,
        },
      });

      if (emailResult.error || !emailData?.html) {
        AppLogger.error({
          category: Schemas.LogCategory.Provider,
          action: Schemas.LogAction.InboundEmailFetchFailed,
          message: "Failed to fetch email body from Resend",
          metadata: { emailId, userId, error: emailResult.error },
        });
        message.ack();
        continue;
      }

      const allHrefs: string[] = [];
      const hrefRe2 = /href=["']([^"']+)["']/gi;
      let m: RegExpExecArray | null;
      while ((m = hrefRe2.exec(emailData.html)) !== null) {
        if (m[1]) allHrefs.push(m[1]);
      }

      AppLogger.info({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.InboundUrlExtracted,
        message: "All hrefs found in email HTML (pre-filter)",
        metadata: { emailId, userId, totalHrefs: allHrefs.length, sample: allHrefs.slice(0, 10) },
      });

      const rawUrls = InboundJobAlertHandler.extractHttpsUrls(emailData.html);

      AppLogger.info({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.InboundUrlExtracted,
        message: `Extracted ${rawUrls.length} unique https URL(s) from email after blocklist filter`,
        metadata: { emailId, userId, count: rawUrls.length, urls: rawUrls },
      });

      const dedupedUrls = rawUrls;

      const jobsDAL = new JobsDAL(env);
      const existingUrls = await jobsDAL.getExistingUrls({
        createdBy: userId,
        urls: dedupedUrls,
      });

      AppLogger.info({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.InboundUrlExtracted,
        message: "Dedup check complete",
        metadata: {
          emailId,
          userId,
          dedupedCount: dedupedUrls.length,
          existingCount: existingUrls.size,
          newCount: dedupedUrls.filter((u) => !existingUrls.has(u)).length,
        },
      });

      const newUrls = dedupedUrls.filter((u) => !existingUrls.has(u));

      for (let i = 0; i < newUrls.length; i++) {
        if (i > 0) await new Promise((r) => setTimeout(r, Constants.BROWSER_RUN_DELAY_MS));
        const rawUrl = newUrls[i]!;

        const resolvedUrl = await InboundJobAlertHandler.resolveRedirectUrl(rawUrl);

        AppLogger.info({
          category: Schemas.LogCategory.Provider,
          action: Schemas.LogAction.InboundUrlExtracted,
          message: "Resolved redirect URL",
          metadata: { rawUrl, resolvedUrl, changed: resolvedUrl !== rawUrl },
        });

        if (InboundJobAlertHandler.isBlockedUrl(resolvedUrl)) {
          AppLogger.info({
            category: Schemas.LogCategory.Provider,
            action: Schemas.LogAction.InboundUrlExtracted,
            message: "Resolved URL blocked — skipping",
            metadata: { rawUrl, resolvedUrl },
          });
          continue;
        }

        const budgetDAL = new BrowserRunBudgetDAL(env);
        const isShutdown = await budgetDAL.isShutdown();

        if (isShutdown) {
          AppLogger.warn({
            category: Schemas.LogCategory.Provider,
            action: Schemas.LogAction.BrowserRunBudgetShutdown,
            message: "Browser Run shut down — monthly threshold reached, skipping scrape",
            metadata: {
              resolvedUrl,
              userId,
              shutdownSeconds: Constants.BROWSER_RUN_SHUTDOWN_SECONDS,
            },
          });
          continue;
        }

        const scrapeStart = Date.now();
        const extracted = await InboundJobAlertHandler.scrapeJobUrl(resolvedUrl, env);
        const elapsedSeconds = (Date.now() - scrapeStart) / 1_000;

        await budgetDAL.recordUsage({ elapsedSeconds });

        if (!extracted) continue;

        const companyId = await InboundJobAlertHandler.resolveCompanyId(
          extracted.company,
          userId,
          env,
        );

        const title = extracted.title ?? InboundJobAlertHandler.titleFallback(resolvedUrl);

        const insertResult = await jobsDAL.createJob({
          title,
          url: resolvedUrl,
          companyId,
          salary: extracted.salary,
          description: extracted.description,
          skills: extracted.skills.length > 0 ? extracted.skills : [],
          type: Schemas.JobTypeIntEnum.LLM,
          status: Schemas.JobStatusIntEnum.WaitingForHuman,
          createdBy: userId,
          source: null,
          matchScore: null,
        });

        if (insertResult.isSuccess) {
          AppLogger.info({
            category: Schemas.LogCategory.Provider,
            action: Schemas.LogAction.InboundJobInserted,
            message: "Inserted inbound job",
            metadata: { url: resolvedUrl, userId, title },
          });
        } else if (insertResult.message?.includes("UNIQUE constraint")) {
          AppLogger.info({
            category: Schemas.LogCategory.Provider,
            action: Schemas.LogAction.DuplicateJobBlocked,
            message: "Duplicate job skipped",
            metadata: { url: resolvedUrl, userId },
          });
        }
      }

      message.ack();
    }
  }
}
