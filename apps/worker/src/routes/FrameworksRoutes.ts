import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import FrameworksRepo from "@/repositories/FrameworksRepo";

const FrameworksRoutes = new Hono<AppContext>();

FrameworksRoutes.post(
  "/generate",
  checkAuth,
  zValidator("json", Schemas.ZGenerateFrameworkApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new FrameworksRepo(c.env);
    const response = await repo.generateCompanyFramework({
      userId,
      formInputs: body.formInputs,
    });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

FrameworksRoutes.put(
  "/company",
  checkAuth,
  zValidator("json", Schemas.ZSaveFrameworkApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new FrameworksRepo(c.env);
    const response = await repo.saveCompanyFramework({
      userId,
      content: body.content,
      formInputs: body.formInputs,
      isCustomized: body.isCustomized,
    });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

FrameworksRoutes.get("/company", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new FrameworksRepo(c.env);
  const response = await repo.getLatestCompanyFramework({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

FrameworksRoutes.get("/company/versions", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new FrameworksRepo(c.env);
  const response = await repo.getCompanyFrameworkVersions({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

export default FrameworksRoutes;
