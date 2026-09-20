import { Hono } from "hono";
import ContactsRepo from "@/repositories/ContactsRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

const ContactsRoutes = new Hono<AppContext>();

ContactsRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZCreateContactApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.createContact({ contact: body.contact, userId });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

ContactsRoutes.post(
  "/parse-profile",
  checkAuth,
  zValidator("json", Schemas.ZParseProfileApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    // Burst guard, not a quota: the panel parses on a page the user opened by hand, so a rapid
    // series of calls means a client-side loop, not a real workload. Keyed per user so one
    // runaway extension can't spend another user's allowance.
    const { success } = await c.env.PROFILE_PARSE_LIMITER.limit({ key: userId });
    if (!success) {
      return c.json(
        {
          isSuccess: false,
          isRateLimited: true,
          message: "Too many parses in a row. Wait a moment and try again.",
        } satisfies Schemas.ParseProfileApiResponse,
        429,
      );
    }

    const repo = new ContactsRepo(c.env);
    const response = await repo.parseProfile({ ...body, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

ContactsRoutes.post(
  "/capture",
  checkAuth,
  zValidator("json", Schemas.ZCaptureContactApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.captureContact({ ...body, userId });

    if (!response.isSuccess) return c.json(response, 500);
    // A duplicate is a successful no-op, not a creation — 200 so the caller can tell them apart.
    return c.json(response, response.isDuplicate ? 200 : 201);
  },
);

ContactsRoutes.delete(
  "/bulk",
  checkAuth,
  zValidator("json", Schemas.ZBulkDeleteContactsApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.bulkDeleteContacts({ ...body, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

ContactsRoutes.get(
  "/",
  checkAuth,
  zValidator("query", Schemas.ZGetContactsApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { search, statuses, pageNo, pageSize } = c.req.valid("query");

    const repo = new ContactsRepo(c.env);
    const response = await repo.getContacts({ userId, search, statuses, pageNo, pageSize });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

ContactsRoutes.get(
  "/duplicate-check",
  checkAuth,
  zValidator("query", Schemas.ZCheckDuplicateContactApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { email, linkedinUrl, excludeId } = c.req.valid("query");

    const repo = new ContactsRepo(c.env);
    const response = await repo.checkDuplicateContact({ userId, email, linkedinUrl, excludeId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

ContactsRoutes.patch(
  "/bulk",
  checkAuth,
  zValidator("json", Schemas.ZBulkUpdateContactsApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.bulkUpdateContacts({ ...body, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

ContactsRoutes.post(
  "/bulk",
  checkAuth,
  zValidator("json", Schemas.ZBulkCreateContactsApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.bulkCreateContacts({ ...body, userId });

    // The request itself was always processed — per-entry success/failure lives in `results`,
    // not the HTTP status. A batch where every entry failed is a legitimate outcome the caller
    // must branch on, not a server fault, so this always returns 201 (never 500).
    return c.json(response, 201);
  },
);

ContactsRoutes.post(
  "/history/bulk",
  checkAuth,
  zValidator("json", Schemas.ZBulkLogContactHistoryApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.bulkLogContactHistory({ ...body, userId });

    // Same reasoning as POST /bulk above — per-entry outcome lives in `results`, not the status.
    return c.json(response, 201);
  },
);

ContactsRoutes.post(
  "/message-templates/bulk",
  checkAuth,
  zValidator("json", Schemas.ZResolveMessageTemplatesBulkApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.resolveMessageTemplatesBulk({ ...body, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

ContactsRoutes.get(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new ContactsRepo(c.env);
    const response = await repo.getContactDetails({ id: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

ContactsRoutes.patch(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", Schemas.ZUpdateContactApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.updateContact({ id: Number(id), userId, ...body });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

ContactsRoutes.delete(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new ContactsRepo(c.env);
    const response = await repo.deleteContact({ id: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

ContactsRoutes.get(
  "/:id/history",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new ContactsRepo(c.env);
    const response = await repo.getContactHistory({ contactId: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

ContactsRoutes.post(
  "/:id/history",
  checkAuth,
  zValidator("param", z.object({ id: z.string().regex(/^\d+$/) })),
  zValidator("json", Schemas.ZLogContactHistoryApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.logContactHistory({
      contactId: Number(id),
      userId,
      ...body,
    });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

ContactsRoutes.get(
  "/:id/message-template",
  checkAuth,
  zValidator("param", z.object({ id: z.string().regex(/^\d+$/) })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new ContactsRepo(c.env);
    const response = await repo.resolveMessageTemplate({ contactId: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

ContactsRoutes.patch(
  "/:id/history/:historyId",
  checkAuth,
  zValidator(
    "param",
    z.object({ id: z.string().regex(/^\d+$/), historyId: z.string().regex(/^\d+$/) }),
  ),
  zValidator("json", Schemas.ZUpdateContactHistoryApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id, historyId } = c.req.valid("param");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.updateContactHistory({
      historyId: Number(historyId),
      contactId: Number(id),
      userId,
      ...body,
    });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

ContactsRoutes.delete(
  "/:id/history/:historyId",
  checkAuth,
  zValidator(
    "param",
    z.object({ id: z.string().regex(/^\d+$/), historyId: z.string().regex(/^\d+$/) }),
  ),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id, historyId } = c.req.valid("param");

    const repo = new ContactsRepo(c.env);
    const response = await repo.deleteContactHistory({
      historyId: Number(historyId),
      contactId: Number(id),
      userId,
    });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

ContactsRoutes.post(
  "/:id/history/:historyId/restore",
  checkAuth,
  zValidator(
    "param",
    z.object({ id: z.string().regex(/^\d+$/), historyId: z.string().regex(/^\d+$/) }),
  ),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id, historyId } = c.req.valid("param");

    const repo = new ContactsRepo(c.env);
    const response = await repo.restoreContactHistory({
      historyId: Number(historyId),
      contactId: Number(id),
      userId,
    });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

export default ContactsRoutes;
