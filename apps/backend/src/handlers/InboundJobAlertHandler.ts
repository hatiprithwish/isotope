import { Resend } from "resend";
import JobsDAL from "@/data-access-layer/JobsDAL";
import CompaniesDAL from "@/data-access-layer/CompaniesDAL";
import AppLogger from "@/providers/AppLogger";
import Constants from "@/config/Constants";
import * as Schemas from "@app/schemas";
import Utility from "@/utils";

interface InboundJobAlertMessage {
  type: "InboundJobAlert";
  action: "Process";
  emailId: string;
  userId: string;
}

interface BrowserRunExtracted {
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
  skills: string[];
}

function isJobUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const host = parsed.hostname;
  for (const domain of Constants.INBOUND_ATS_DOMAINS) {
    if (host === domain || host.endsWith(`.${domain}`)) return true;
  }

  const pathname = parsed.pathname;
  for (const segment of Constants.INBOUND_JOB_PATHS) {
    if (pathname.includes(segment)) return true;
  }

  return false;
}

function extractJobUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  // Match href="..." or href='...' — covers the vast majority of email HTML
  const hrefRe = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRe.exec(html)) !== null) {
    const href = match[1] ?? "";
    if (isJobUrl(href) && !seen.has(href)) {
      seen.add(href);
      urls.push(href);
    }
  }
  return urls;
}

async function resolveRedirect(url: string): Promise<string> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.url || url;
  } catch {
    return url;
  }
}

async function scrapeJobUrl(url: string, env: Env): Promise<BrowserRunExtracted | null> {
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

    if (!extracted?.title) {
      AppLogger.error({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.InboundScrapeFailed,
        message: "Browser Run returned no title",
        metadata: { url },
      });
      return null;
    }

    return {
      title: extracted.title,
      company: extracted.company ?? null,
      location: extracted.location ?? null,
      salary: extracted.salary ?? null,
      description: extracted.description ?? null,
      skills: Array.isArray(extracted.skills) ? extracted.skills : [],
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

async function resolveCompanyId(
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

export async function inboundJobAlertHandler(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);

  for (const message of batch.messages) {
    const msg = message.body as InboundJobAlertMessage;

    if (msg?.type !== "InboundJobAlert" || msg?.action !== "Process") {
      message.ack();
      continue;
    }

    const { emailId, userId } = msg;

    const emailResult = await resend.emails.get(emailId);
    if (emailResult.error || !emailResult.data?.html) {
      AppLogger.error({
        category: Schemas.LogCategory.Provider,
        action: Schemas.LogAction.InboundEmailFetchFailed,
        message: "Failed to fetch email body from Resend",
        metadata: { emailId, userId, error: emailResult.error },
      });
      message.ack();
      continue;
    }

    const rawUrls = extractJobUrls(emailResult.data.html);

    AppLogger.info({
      category: Schemas.LogCategory.Provider,
      action: Schemas.LogAction.InboundUrlExtracted,
      message: `Extracted ${rawUrls.length} job URL(s)`,
      metadata: { emailId, userId, count: rawUrls.length },
    });

    const resolvedUrls = await Promise.all(rawUrls.map(resolveRedirect));

    const dedupedUrls = [...new Set(resolvedUrls)];

    const jobsDAL = new JobsDAL(env);
    const existingUrls = await jobsDAL.getExistingUrls({
      createdBy: userId,
      urls: dedupedUrls,
    });

    const newUrls = dedupedUrls.filter((u) => !existingUrls.has(u));

    for (const url of newUrls) {
      const extracted = await scrapeJobUrl(url, env);
      if (!extracted) continue;

      const companyId = await resolveCompanyId(extracted.company, userId, env);

      const insertResult = await jobsDAL.createJob({
        title: extracted.title,
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
          metadata: { url, userId, title: extracted.title },
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
