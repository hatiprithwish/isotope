import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import JobsRepo from "@/repositories/JobsRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";

const JobsRoutes = new Hono<AppContext>();

JobsRoutes.post("/", checkAuth, zValidator("json", Schemas.ZCreateJobApiRequest), async (c) => {
  const clerkUserId = c.get("clerkUserId");
  const body = c.req.valid("json");

  const repo = new JobsRepo(c.env);
  const response = await repo.createJob({ ...body, userId: clerkUserId });

  return c.json(response, response.isSuccess ? 201 : 500);
});

JobsRoutes.post("/count", checkAuth, zValidator("json", Schemas.ZGetJobsApiRequest), async (c) => {
  const clerkUserId = c.get("clerkUserId");
  const { searchText } = c.req.valid("json");

  const repo = new JobsRepo(c.env);
  const response = await repo.countJobs({ userId: clerkUserId, searchText });

  return c.json(response, response.isSuccess ? 200 : 500);
});

JobsRoutes.post("/list", checkAuth, zValidator("json", Schemas.ZGetJobsApiRequest), async (c) => {
  const clerkUserId = c.get("clerkUserId");
  const { searchText } = c.req.valid("json");

  const repo = new JobsRepo(c.env);
  const response = await repo.getJobs({ userId: clerkUserId, searchText });

  return c.json(response, response.isSuccess ? 200 : 500);
});

JobsRoutes.get(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string().regex(/^\d+$/) })),
  async (c) => {
    const clerkUserId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new JobsRepo(c.env);
    const response = await repo.getJobDetails({ id: Number(id), userId: clerkUserId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

export default JobsRoutes;
