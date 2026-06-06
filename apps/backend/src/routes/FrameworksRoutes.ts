import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import FrameworksRepo from "@/repositories/FrameworksRepo";

const FrameworksRoutes = new Hono<AppContext>();

FrameworksRoutes.get("/job-search", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new FrameworksRepo(c.env);
  const response = await repo.getFrameworkDetails({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

FrameworksRoutes.post(
  "/job-search",
  checkAuth,
  zValidator("json", Schemas.ZSaveFrameworkApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new FrameworksRepo(c.env);
    const response = await repo.saveFramework({ userId, input: body });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

export default FrameworksRoutes;
