import { Resend } from "resend";
import type { GetReceivingEmailResponseSuccess } from "resend";
import JobsDAL from "@/data-access-layer/JobsDAL";
import CompaniesDAL from "@/data-access-layer/CompaniesDAL";
import AppLogger from "@/providers/AppLogger";
import Constants from "@/config/Constants";
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
  location: string | null;
  salary: string | null;
  description: string | null;
  skills: string[];
}

export default class InboundJobAlertHandler {
  static extractHttpsUrls(html: string): string[] {
    const seen = new Set<string>();
    const urls: string[] = [];
    const hrefRe = /href=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = hrefRe.exec(html)) !== null) {
      const href = match[1] ?? "";
      if (href.startsWith("https://") && !seen.has(href)) {
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

  static async scrapeJobUrl(url: string, env: Env): Promise<BrowserRunExtracted | null> {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const token = env.CLOUDFLARE_API_TOKEN;
    const apiUrl = Constants.BROWSER_RUN_URL.replace("{accountId}", accountId);

    AppLogger.info({
      category: Schemas.LogCategory.Provider,
      action: Schemas.LogAction.InboundScrapeStarted,
      message: "Calling Browser Run /json",
      metadata: { url },
    });

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
        location: extracted?.location ?? null,
        salary: extracted?.salary ?? null,
        description: extracted?.description ?? null,
        skills: Array.isArray(extracted?.skills) ? extracted.skills : [],
      };
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
    const resend = new Resend(env.RESEND_API_KEY);

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
        message: `Extracted ${rawUrls.length} unique https URL(s) from email`,
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

      for (const url of newUrls) {
        const extracted = await InboundJobAlertHandler.scrapeJobUrl(url, env);
        if (!extracted) continue;

        const companyId = await InboundJobAlertHandler.resolveCompanyId(
          extracted.company,
          userId,
          env,
        );

        const title = extracted.title ?? InboundJobAlertHandler.titleFallback(url);

        const insertResult = await jobsDAL.createJob({
          title,
          url,
          companyId,
          location: extracted.location,
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
            metadata: { url, userId, title },
          });
        } else if (insertResult.message?.includes("UNIQUE constraint")) {
          AppLogger.info({
            category: Schemas.LogCategory.Provider,
            action: Schemas.LogAction.DuplicateJobBlocked,
            message: "Duplicate job skipped",
            metadata: { url, userId },
          });
        }
      }

      message.ack();
    }
  }
}
