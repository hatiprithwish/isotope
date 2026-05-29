import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import JobsRepo from "@/repositories/JobsRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";

const JobsQueryRoutes = new Hono<AppContext>();

JobsQueryRoutes.post("/", checkAuth, zValidator("json", Schemas.ZGetJobsApiRequest), async (c) => {
  const clerkUserId = c.get("clerkUserId");
  const body = c.req.valid("json");

  const repo = new JobsRepo(c.env);
  const response = await repo.getJobs({ ...body, userId: clerkUserId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

JobsQueryRoutes.post(
  "/count",
  checkAuth,
  zValidator("json", Schemas.ZGetJobsApiRequest),
  async (c) => {
    const clerkUserId = c.get("clerkUserId");
    const { searchText } = c.req.valid("json");

    const repo = new JobsRepo(c.env);
    const response = await repo.countJobs({ userId: clerkUserId, searchText });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

export default JobsQueryRoutes;
