# Spec 05 — Email Job Ingestion

**Feature:** User forwards a job alert email → system extracts job URLs → scrapes each page → inserts structured jobs into the `jobs` table for review.  
**Depends on:** Spec 003A–003C (jobs table + DAL + Repo must exist)

---

## 1. Outcome

When this spec is fully implemented:

- Every user has a unique inbound email address displayed in Settings → Account tab (e.g. `{userId}@<resend-app-domain>`).
- The user forwards any job alert email to that address. Resend receives it and POSTs a webhook to the worker.
- The worker enqueues each extracted job URL (skipping duplicates already in the DB).
- A Cloudflare Queue consumer fetches the full email body from Resend, calls Browser Run `/json` per job URL to scrape and extract structured fields in one call, and inserts the result into the `jobs` table as `type = LLM`, `status = WaitingForHuman`.
- New jobs appear in the Jobs page under "Needs review" on the next page load — no UI action required beyond forwarding the email.

---

## 2. Scope boundaries

### In scope

- Resend inbound webhook endpoint: `POST /api/email-inbound` (public, no `checkAuth`)
- Webhook signature verification using Resend's svix-based `resend.webhooks.verify()`
- Resend API call to retrieve full email body (`GET /emails/{email_id}` via Resend SDK)
- URL extraction from HTML email body — filter by known ATS domains and job-path patterns
- Tracking redirect resolution (HTTP HEAD → follow → canonical URL)
- Cloudflare Queue: enqueue `{emailId, userId, url}` per extracted URL
- Queue consumer: fetch email content → call Browser Run `/json` (scrape + extract in one call) → insert via JobsDAL
- Deduplication: skip URLs already present in `jobs` for this user (unique index `(url, created_by)` already enforced by DB)
- Settings → Account tab: read-only "Your job alerts address" field with copy button
- `LogAction` entries for every new operation
- `RESEND_WEBHOOK_SECRET` and `RESEND_API_KEY` env vars (already in stack for digest sending)

### Out of scope — do not build

- Custom domain for inbound (use the free `.resend.app` domain — no MX record setup)
- Any UI for managing or reviewing ingested emails
- Attachment parsing
- Parsing email body as plain text fallback — HTML only in V1
- Browser Run Playwright/Puppeteer sessions — use Quick Actions `/json` endpoint only
- Polling or push notification when ingestion completes
- Re-scraping or retry UI
- Any changes to the jobs table schema
- Any changes to the morning digest

---

## 3. Inbound email address per user

The user's inbound address is deterministic:

```
{clerkUserId}@<RESEND_INBOUND_DOMAIN>
```

`RESEND_INBOUND_DOMAIN` is a new env var (e.g. `cool-hedgehog.resend.app`). It is read from `env` in the worker and returned to the frontend via a new endpoint.

**New endpoint:** `GET /settings/inbound-address`  
Auth: `checkAuth` required.  
Response: `{ address: string }` — constructs the address from `clerkUserId + "@" + env.RESEND_INBOUND_DOMAIN`.  
No DB read needed — the address is derived, not stored.

The Resend inbound webhook delivers all emails to one webhook URL regardless of the `to` address. The worker extracts the userId from the `to` field local part and uses it to scope all inserted jobs.

---

## 4. Webhook endpoint

**Route:** `POST /api/email-inbound`  
**Auth:** None — this is a public webhook. Verify the Resend signature instead (see below).  
**Mount in `index.ts`** outside the auth middleware group.

### Signature verification

Use `resend.webhooks.verify()` from the `resend` SDK (already in `package.json`):

```ts
resend.webhooks.verify({
  payload: rawBody, // raw string body, not parsed JSON
  headers: {
    id: req.headers["svix-id"],
    timestamp: req.headers["svix-timestamp"],
    signature: req.headers["svix-signature"],
  },
  webhookSecret: env.RESEND_WEBHOOK_SECRET,
});
```

Return `400` immediately if verification fails. Never process an unverified payload.

### Handler logic

1. Verify signature — 400 on failure.
2. Parse event JSON. If `event.type !== "email.received"`, return `200` immediately (ignore other event types).
3. Extract `to` address from `event.data.to[0]`. Parse the local part (before `@`) — that is the `userId`.
4. If `userId` is empty or missing, return `400`.
5. Enqueue `{ emailId: event.data.email_id, userId }` to the Cloudflare Queue.
6. Return `200` immediately — do not await queue processing.

The handler must complete in under 3 seconds to avoid Resend retry storms.

---

## 5. Cloudflare Queue

**Queue name:** `email-job-ingestion`  
Add the binding to `wrangler.jsonc`:

```jsonc
"queues": {
  "producers": [{ "queue": "email-job-ingestion", "binding": "EMAIL_JOB_QUEUE" }],
  "consumers": [{ "queue": "email-job-ingestion", "max_batch_size": 5, "max_batch_timeout": 10 }]
}
```

Run `wrangler types` after updating `wrangler.jsonc` so `EMAIL_JOB_QUEUE: Queue` appears in the generated `Env`.

**Message shape:**

```ts
type EmailJobMessage = {
  emailId: string;
  userId: string;
};
```

The queue message contains only the `emailId` and `userId`. URL extraction happens in the consumer after fetching the full email body — this keeps the webhook handler fast and stateless.

---

## 6. Queue consumer

Export a `queue` handler from `apps/worker/src/index.ts` alongside the existing `fetch` handler:

```ts
export default {
  fetch: app.fetch,
  queue: emailJobQueueHandler,
};
```

### `emailJobQueueHandler`

For each message in the batch:

1. **Fetch email body** — call `resend.emails.get(emailId)` via the Resend SDK. This returns the full email object including `html`. If the call fails or `html` is null, log the error and `ack` the message (do not retry indefinitely — Resend stores emails and the user can forward again).

2. **Extract URLs** — parse the HTML body and extract all `href` values from anchor tags. Filter to URLs that match job-like patterns:
   - Known ATS domains: `greenhouse.io`, `lever.co`, `workday.com`, `ashbyhq.com`, `jobs.smartrecruiters.com`, `apply.workable.com`, `boards.eu.greenhouse.io`
   - Or URL path contains `/jobs/`, `/careers/`, `/job/`, `/position/`
   - Exclude mailto:, tracking pixel domains, and non-http(s) schemes

3. **Resolve redirects** — for each extracted URL, perform a `fetch(url, { method: "HEAD", redirect: "follow" })` and use `response.url` as the canonical URL. If HEAD fails, use the original URL.

4. **Dedup in-flight** — deduplicate within the current batch (same URL from two links in one email). Existing DB dedup is enforced by the unique index at insert time.

5. **For each canonical URL:**
   a. Call Browser Run `/json` endpoint (see §7) — scrapes and extracts structured fields in one call.
   b. If the call fails (non-200 or empty response), log and skip — do not fail the whole batch.
   c. If the response contains no `title`, skip — not a valid job page.
   d. Call `JobsDAL.createJob()`. If insert fails due to unique constraint (duplicate), log `LogAction.DuplicateJobBlocked` and continue.

6. `ack` every message — do not let failures block the queue.

---

## 7. Browser Run `/json` endpoint

Browser Run's `/json` Quick Action renders the page and extracts structured data using AI in a single call — no separate LLM step needed.

Add the Browser Rendering binding to `wrangler.jsonc`:

```jsonc
"browser": { "binding": "BROWSER" }
```

Call the REST Quick Actions endpoint from within the worker:

```
POST https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-run/json
Authorization: Bearer <CLOUDFLARE_API_TOKEN>
Body: {
  "url": "<canonical job url>",
  "prompt": "Extract job listing details: title (string, required), company (string or null), location (string or null), salary (string or null, as stated), description (string or null, first 500 chars of job description), skills (array of strings, max 15 technical skills)"
}
```

Add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as env vars.

**Expected response shape:**

```ts
{
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
  skills: string[];
}
```

**Timeout:** 30 seconds per URL — skip and log if exceeded.  
**On success:** use the returned JSON object directly.  
**On failure or missing `title`:** log `AppLogger.error` with the URL; return null — caller skips the URL.

> Before implementing, check `llm-context/` for any existing Cloudflare Browser Rendering docs to confirm the correct request shape for the `/json` endpoint. Follow the docs over this spec if they differ.

---

## 8. DAL insert

Call the existing `JobsDAL.createJob()` with:

```ts
{
  title,
  url: canonicalUrl,
  company,         // string | null → pass through
  location,        // string | null → pass through
  salary,          // string | null → pass through
  description,     // string | null → pass through
  skills,          // string[] → JobsDAL JSON-stringifies on write
  type: JobTypeIntEnum.LLM,          // 2
  status: JobStatusIntEnum.WaitingForHuman,  // 2
  createdBy: userId,
}
```

`company_id` is null — the company lookup/creation step (which triggers company research) happens when the user accepts the job in the review flow, which is already built.

---

## 9. Settings UI

**Location:** Settings → Account tab (`apps/web/src/routes/_authenticated/settings/account.tsx` or equivalent — read the existing file to confirm the path before editing).

Add a new read-only section "Job alerts":

- Label: "Forward job alert emails to"
- Value: the address returned by `GET /settings/inbound-address`
- Copy-to-clipboard icon button — copies the address; shows a brief "Copied" tooltip
- Helper text: "Forward any job alert email here and we'll automatically import the listings for review."

Use the existing `useAuth` + `apiClient` pattern. The query key is `["settings", "inbound-address"]`.

---

## 10. New log actions

Add to `LogAction` enum in `packages/schemas/src/log.ts` before writing any log call:

```
InboundEmailReceived
InboundEmailFetchFailed
InboundUrlExtracted
InboundScrapeStarted
InboundScrapeFailed
InboundJobInserted
```

`DuplicateJobBlocked` already exists — reuse it.

---

## 11. Environment variables

Add to `wrangler.jsonc` (all three envs: base, staging, production):

```
RESEND_WEBHOOK_SECRET   — Resend svix signing secret for inbound webhook
RESEND_INBOUND_DOMAIN   — e.g. cool-hedgehog.resend.app
CLOUDFLARE_ACCOUNT_ID   — needed if using Browser Run REST API
CLOUDFLARE_API_TOKEN    — needed if using Browser Run REST API
```

`RESEND_API_KEY` is already present (used for digest sending).

---

## 12. Verification checklist

### Webhook endpoint

- [ ] Returns `400` when signature verification fails
- [ ] Returns `200` and does nothing when `event.type !== "email.received"`
- [ ] Returns `400` when `to` address has no recognisable local part
- [ ] Enqueues one message per valid email received
- [ ] Returns `200` within 3 seconds — does not await queue processing

### Queue consumer

- [ ] Fetches email body from Resend using `emailId`
- [ ] Extracts only URLs matching ATS domain or job-path patterns
- [ ] Resolves tracking redirects to canonical URLs
- [ ] Skips URLs already in the `jobs` table for this user (no duplicate row inserted)
- [ ] Skips a URL gracefully when Browser Run `/json` returns non-200
- [ ] Skips a URL gracefully when Browser Run `/json` returns no `title`
- [ ] Inserts with `type = 2` (LLM) and `status = 2` (WaitingForHuman)
- [ ] `acks` every message — queue does not stall on partial failures

### Settings UI

- [ ] Inbound address displayed correctly in Account tab
- [ ] Copy button copies the address to clipboard
- [ ] Loading state shown while address is being fetched

### End to end

- [ ] Forwarding a real job alert email results in new rows in the jobs table
- [ ] Inserted jobs appear in the Jobs page with "Needs review" status
- [ ] Forwarding the same email twice does not produce duplicate rows
