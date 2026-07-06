import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import TasksRepo from "@/repositories/TasksRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";

const TasksRoutes = new Hono<AppContext>();

// Query routes — POST because the body carries filters, per repo's Query Route Convention

TasksRoutes.post(
  "/calendar",
  checkAuth,
  zValidator("json", Schemas.ZGetTasksCalendarApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new TasksRepo(c.env);
    const response = await repo.getTasksCalendar({ ...body, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

TasksRoutes.post(
  "/day",
  checkAuth,
  zValidator("json", Schemas.ZGetTasksForDateApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new TasksRepo(c.env);
    const response = await repo.getTasksForDate({ ...body, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

TasksRoutes.get("/past", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new TasksRepo(c.env);
  const response = await repo.getPastTasks({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

TasksRoutes.post(
  "/search",
  checkAuth,
  zValidator("json", Schemas.ZSearchTasksApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new TasksRepo(c.env);
    const response = await repo.searchTasks({ ...body, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

TasksRoutes.patch(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string().regex(/^\d+$/) })),
  zValidator("json", Schemas.ZUpdateTaskStatusApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const repo = new TasksRepo(c.env);
    const response = await repo.updateTaskStatus({ ...body, id: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

export default TasksRoutes;
