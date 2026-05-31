# Spec 002 — Discover Jobs Workflow

**Feature:** End-to-end job discovery — trigger, search, filter, dedup, insert  
**Depends on:** Spec 03F (job_search_frameworks table and GET endpoint must exist)

---

## 1. Outcome

When this spec is fully implemented:

- Clicking "Find new jobs" on the Jobs page calls `POST /jobs/discover` and immediately returns 202. The user sees a toast: "Searching for jobs — new listings will appear shortly."
- A Cloudflare Workflow runs in the background: fetches the user's framework, searches the web for matching jobs via Tavily, passes results to a Workers AI model to extract and structure job data, filters against hard-gate criteria, dedups against the existing `jobs` table, and inserts new jobs with `status = 'waiting_for_human'`.
- New jobs appear in the Jobs table under "Needs review" on the next page load.
- If the workflow fails at any step, it exits cleanly. No UI error. User can retry by clicking the button again.

---

## 2. Scope boundaries

### In scope

- Search provider abstraction layer — `providers/WebSearch.ts`
- Tavily implementation of the search provider
- `POST /jobs/discover` — auth, framework check, workflow trigger, 202 response
- Cloudflare Workflow: `job-discovery` — all steps in §5
- Workers AI call to structure raw search results into job listings
- Hard-gate filter in code
- Dedup against `jobs` table by `(user_id, source_url)`
- Insert into `jobs` table
- "Find new jobs" button wired to the endpoint
- Trigger toast on button click

Note: Make sure to add correct logs while building the feature.

### Out of scope — do not build

- Real HTML scrapers for any job portal
- Scheduled/cron trigger — manual only
- Polling or push notification when workflow completes
- Morning digest integration
- Any changes to job_search_frameworks table or its endpoints
- Any UI beyond button behaviour and trigger toast
- Version restore UI

---

## 3. Search provider abstraction

Create a provider file at a path consistent with how the codebase organises shared utilities. This is the only file that knows about Tavily. Everything else calls the interface.

### Interface

```ts
export interface SearchResult {
  title: string;
  url: string;
  content: string; // page content / snippet returned by the provider
}

export interface WebSearchProvider {
  search(
    query: string,
    options?: { maxResults?: number; days?: number },
  ): Promise<WebSearchResult[]>;
}
```

### Tavily implementation

- Implement `TavilySearchProvider` that satisfies `WebSearchProvider`
- API key comes from `env.TAVILY_API_KEY` — never hardcoded
- Endpoint: `https://api.tavily.com/search`
- Map Tavily's response fields to `WebSearchResult` — do not leak Tavily types outside this file
- `options.days` maps to Tavily's `days` parameter (recency filter)
- `options.maxResults` maps to Tavily's `max_results` parameter
- On non-200 response: throw an error with the status code and response body

### Tavily Docs links:

- [Introduction](https://docs.tavily.com/documentation/api-reference/introduction)
- [Search](https://docs.tavily.com/documentation/api-reference/endpoint/search)
- [Search Best Practices](https://docs.tavily.com/documentation/best-practices/best-practices-search)
- [Extract](https://docs.tavily.com/documentation/api-reference/endpoint/extract)
- [Extract Best Practices](https://docs.tavily.com/documentation/best-practices/best-practices-extract)
- [Crawl](https://docs.tavily.com/documentation/api-reference/endpoint/crawl)
- [Crawl Best Practices](https://docs.tavily.com/documentation/best-practices/best-practices-crawl)
- [Map](https://docs.tavily.com/documentation/api-reference/endpoint/map)

---

## 9. Verification checklist

### API endpoint

- [ ] Returns 202 immediately — does not await workflow completion
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 with correct message when no framework exists
- [ ] Workflow is triggered with correct `createdBy`

### Workflow

- [ ] Exits cleanly when no framework found (no crash)
- [ ] Exits cleanly when Tavily returns empty or throws (no crash)
- [ ] Exits cleanly when Workers AI response is not valid JSON (no crash)
- [ ] Multiple search queries are merged and URL-deduplicated before Step 3
- [ ] Step 4 drops a job where none of the required skills appear in `jd_text`
- [ ] Step 4 passes through a job where salary is not disclosed
- [ ] Step 4 passes through a job where experience is not stated
- [ ] Step 5 skips a job whose `source_url` already exists for this user
- [ ] Step 6 inserts with `source = 2` and `status = 2`
- [ ] Step 6 continues if one insert fails
- [ ] Running the workflow twice with identical Tavily results inserts zero new rows on the second run

### Button

- [ ] Disabled and loading while POST is in flight
- [ ] Success toast appears on 202
- [ ] Error toast appears on non-202 non-400 response
- [ ] Redirects to `/onboarding/job-search-framework` on 400

### End to end

- [ ] Clicking "Find new jobs" with a saved framework results in new rows in the jobs table
- [ ] Inserted jobs appear in the Jobs page with "Needs review" status
- [ ] No duplicate rows after two consecutive runs
