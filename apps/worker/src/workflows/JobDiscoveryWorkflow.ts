import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import FrameworksDAL from "@/data-access-layer/FrameworksDAL";
import JobsDAL from "@/data-access-layer/JobsDAL";
import { TavilySearchProvider, type WebSearchResult } from "@/providers/WebSearchProvider";
import AppLogger from "@/providers/AppLogger";
import * as Schemas from "@app/schemas";

interface JobDiscoveryParams {
  createdBy: string;
}

interface ExtractedJob {
  title: string;
  url: string;
  companyName: string | null;
  location: string | null;
  salary: string | null;
  description: string;
  skills: string[];
}

export class JobDiscoveryWorkflow extends WorkflowEntrypoint<Env, JobDiscoveryParams> {
  async run(event: WorkflowEvent<JobDiscoveryParams>, step: WorkflowStep) {
    const { createdBy } = event.payload;

    // Step 1 — fetch framework
    const framework = await step.do("fetch-framework", async () => {
      const dal = new FrameworksDAL(this.env);
      const result = await dal.getFrameworkDetails({ createdBy });

      if (!result.isSuccess || !result.framework?.isCustomized) {
        AppLogger.info({
          category: Schemas.LogCategory.Repo,
          action: Schemas.LogAction.DiscoverJobs,
          message: "No customized framework found — aborting workflow",
          metadata: { createdBy },
        });
        return null;
      }

      return result.framework;
    });

    if (!framework) return;

    // Step 2 — build search queries and fetch from Tavily
    const searchResults = await step.do("web-search", async () => {
      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.WebSearch,
        message: "Running Tavily web searches",
        metadata: { createdBy, targetRoles: framework.targetRoles },
      });

      const provider = new TavilySearchProvider(this.env.TAVILY_API_KEY);

      const timeRange =
        framework.recencyWindow <= 7
          ? ("week" as const)
          : framework.recencyWindow <= 30
            ? ("month" as const)
            : ("month" as const);

      const locationHint =
        framework.preferredLocations.length > 0
          ? framework.preferredLocations.join(" OR ")
          : framework.isRemote
            ? "remote"
            : "";

      const queries = framework.targetRoles.map((role) => {
        const parts = [`${role} job opening`];
        if (locationHint) parts.push(locationHint);
        return parts.join(" ");
      });

      const allResults: WebSearchResult[] = [];

      for (const query of queries) {
        try {
          const results = await provider.search(query, {
            maxResults: 10,
            timeRange,
          });
          allResults.push(...results);
        } catch (error) {
          AppLogger.error({
            category: Schemas.LogCategory.Repo,
            action: Schemas.LogAction.WebSearch,
            message: "Tavily search failed for query — skipping",
            error,
            metadata: { createdBy, query },
          });
        }
      }

      // URL-dedup before passing to AI
      const seen = new Set<string>();
      const dedupedResults: WebSearchResult[] = [];
      for (const r of allResults) {
        if (!seen.has(r.url)) {
          seen.add(r.url);
          dedupedResults.push(r);
        }
      }

      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.WebSearch,
        message: "Web search complete",
        metadata: { createdBy, total: allResults.length, deduped: dedupedResults.length },
      });

      return dedupedResults;
    });

    if (!searchResults || searchResults.length === 0) return;

    // Step 3 — extract structured job data via Workers AI (batched to avoid truncation)
    const extractedJobs = await step.do("extract-jobs", async () => {
      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.ExtractJobs,
        message: "Extracting structured job data via Workers AI",
        metadata: { createdBy, resultCount: searchResults.length },
      });

      const BATCH_SIZE = 5;
      const systemPrompt = `You are a job listing extractor. Given a list of web search result snippets, identify which ones are actual job postings and extract structured data from each.

Return ONLY a JSON array. Each element must have exactly these fields:
{"title":"string","url":"string","companyName":"string or null","location":"string or null","salary":"string or null","description":"string","skills":["array","of","strings"]}

Only include genuine job postings. Skip non-job snippets. No explanation, no markdown, no code fences — raw JSON array only.`;

      const allJobs: ExtractedJob[] = [];

      for (let i = 0; i < searchResults.length; i += BATCH_SIZE) {
        const batch = searchResults.slice(i, i + BATCH_SIZE);
        const snippets = batch
          .map((r, idx) => `[${idx + 1}] URL: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`)
          .join("\n\n---\n\n");

        try {
          const aiResult = await this.env.AI.run(
            "@cf/meta/llama-4-scout-17b-16e-instruct" as Parameters<typeof this.env.AI.run>[0],
            {
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: `Extract job listings from these ${batch.length} search results:\n\n${snippets}`,
                },
              ],
              max_tokens: 2048,
            },
          );

          const resultObj = aiResult as Record<string, unknown>;
          const rawResponse = resultObj["response"];

          // CF Workers AI auto-parses valid JSON responses — rawResponse may be an array, string, or object.
          let parsed: unknown[];
          if (Array.isArray(rawResponse)) {
            // Model returned pre-parsed JSON array directly
            parsed = rawResponse;
          } else {
            // Model returned a string — strip fences and parse manually
            const raw = typeof rawResponse === "string" ? rawResponse.trim() : "";
            const cleaned = raw
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/\s*```$/, "")
              .trim();
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
              AppLogger.error({
                category: Schemas.LogCategory.Repo,
                action: Schemas.LogAction.ExtractJobs,
                message: "Batch response had no JSON array — skipping batch",
                metadata: { createdBy, batchStart: i, rawPreview: raw.slice(0, 300) },
              });
              continue;
            }
            try {
              parsed = JSON.parse(jsonMatch[0]) as unknown[];
            } catch (parseErr) {
              AppLogger.error({
                category: Schemas.LogCategory.Repo,
                action: Schemas.LogAction.ExtractJobs,
                message: "JSON.parse failed for batch — skipping",
                error: parseErr,
                metadata: { createdBy, batchStart: i, rawPreview: jsonMatch[0].slice(0, 300) },
              });
              continue;
            }
          }

          const jobs: ExtractedJob[] = parsed.filter(
            (item): item is ExtractedJob =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as Record<string, unknown>).title === "string" &&
              typeof (item as Record<string, unknown>).url === "string",
          );

          allJobs.push(...jobs);
        } catch (error) {
          AppLogger.error({
            category: Schemas.LogCategory.Repo,
            action: Schemas.LogAction.ExtractJobs,
            message: "Workers AI call failed for batch — skipping",
            error,
            metadata: { createdBy, batchStart: i },
          });
        }
      }

      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.ExtractJobs,
        message: "Extraction complete",
        metadata: { createdBy, extracted: allJobs.length },
      });

      return allJobs.length > 0 ? allJobs : null;
    });

    if (!extractedJobs || extractedJobs.length === 0) return;

    // Step 4 — hard-gate filter: required skills must appear in description
    const filteredJobs = await step.do("filter-jobs", async () => {
      const requiredSkills = framework.requiredSkills.map((s) => s.toLowerCase());

      const passed = extractedJobs.filter((job) => {
        if (requiredSkills.length === 0) return true;
        const jdText = `${job.title} ${job.description} ${job.skills.join(" ")}`.toLowerCase();
        return requiredSkills.some((skill) => jdText.includes(skill));
      });

      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.DiscoverJobs,
        message: "Hard-gate filter applied",
        metadata: { createdBy, before: extractedJobs.length, after: passed.length },
      });

      return passed;
    });

    if (!filteredJobs || filteredJobs.length === 0) return;

    // Step 5 — dedup against existing jobs table by source_url
    const newJobs = await step.do("dedup-jobs", async () => {
      const dal = new JobsDAL(this.env);
      const candidateUrls = filteredJobs.map((j) => j.url);
      const existingUrls = await dal.getExistingUrls({ createdBy, urls: candidateUrls });

      const fresh = filteredJobs.filter((j) => !existingUrls.has(j.url));

      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.DuplicateJobBlocked,
        message: "Dedup complete",
        metadata: {
          createdBy,
          candidates: filteredJobs.length,
          duplicates: filteredJobs.length - fresh.length,
          toInsert: fresh.length,
        },
      });

      return fresh;
    });

    if (!newJobs || newJobs.length === 0) return;

    // Step 6 — bulk insert with status=WaitingForHuman, type=LLM
    await step.do("insert-jobs", async () => {
      const dal = new JobsDAL(this.env);

      const dalJobs: Schemas.CreateJobDALRequest[] = newJobs.map((job) => ({
        title: job.title,
        status: Schemas.JobStatusIntEnum.WaitingForHuman,
        type: Schemas.JobTypeIntEnum.LLM,
        companyId: null,
        url: job.url,
        location: job.location,
        salary: job.salary,
        source: "tavily",
        description: job.description,
        skills: job.skills.length > 0 ? job.skills : null,
        matchScore: null,
        createdBy,
        companyName: job.companyName ?? undefined,
        statusLabel: Schemas.jobStatusIntToLabel[Schemas.JobStatusIntEnum.WaitingForHuman],
        typeLabel: Schemas.jobTypeIntToLabel[Schemas.JobTypeIntEnum.LLM],
      }));

      const inserted = await dal.bulkInsertJobs({ createdBy, jobs: dalJobs });

      AppLogger.info({
        category: Schemas.LogCategory.Repo,
        action: Schemas.LogAction.BulkInsertJobs,
        message: "Job discovery workflow complete",
        metadata: { createdBy, inserted },
      });
    });
  }
}
