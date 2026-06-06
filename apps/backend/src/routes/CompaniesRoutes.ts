import { Hono } from "hono";
import CompaniesRepo from "@/repositories/CompaniesRepo";
import ContactsRepo from "@/repositories/ContactsRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

const CompaniesRoutes = new Hono<AppContext>();

CompaniesRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZCreateCompanyApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new CompaniesRepo(c.env);
    const response = await repo.createCompany({ company: body.company, userId });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

CompaniesRoutes.get("/", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new CompaniesRepo(c.env);
  const response = await repo.getCompanies({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

CompaniesRoutes.get(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new CompaniesRepo(c.env);
    const response = await repo.getCompanyDetails({ id: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

CompaniesRoutes.patch(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  zValidator("json", Schemas.ZUpdateCompanyApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const repo = new CompaniesRepo(c.env);
    const response = await repo.updateCompany({ id: Number(id), userId, ...body });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

CompaniesRoutes.delete(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new CompaniesRepo(c.env);
    const response = await repo.deleteCompany({ id: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

CompaniesRoutes.get(
  "/:id/contacts",
  checkAuth,
  zValidator("param", z.object({ id: z.string() })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new ContactsRepo(c.env);
    const response = await repo.getContactsByCompany({
      userId,
      companyId: Number(id),
    });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

export default CompaniesRoutes;
