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

ContactsRoutes.get("/", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new ContactsRepo(c.env);
  const response = await repo.getContacts({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

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
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", Schemas.ZCreateContactHistoryApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const repo = new ContactsRepo(c.env);
    const response = await repo.createContactHistory({
      contactId: Number(id),
      userId,
      history: body.history,
    });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

export default ContactsRoutes;
