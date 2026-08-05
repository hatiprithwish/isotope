import { Hono } from "hono";
import SavedFiltersRepo from "@/repositories/SavedFiltersRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

const SavedFiltersRoutes = new Hono<AppContext>();

SavedFiltersRoutes.get(
  "/",
  checkAuth,
  zValidator("query", Schemas.ZGetSavedFiltersApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { entityType } = c.req.valid("query");

    const repo = new SavedFiltersRepo(c.env);
    const response = await repo.getSavedFilters({ userId, entityType });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

SavedFiltersRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZCreateSavedFilterApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new SavedFiltersRepo(c.env);
    const response = await repo.createSavedFilter({ savedFilter: body.savedFilter, userId });

    const status = response.isSuccess ? 201 : response.isDuplicateName ? 409 : 500;
    return c.json(response, status);
  },
);

SavedFiltersRoutes.patch(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string().regex(/^\d+$/) })),
  zValidator("json", Schemas.ZUpdateSavedFilterApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const repo = new SavedFiltersRepo(c.env);
    const response = await repo.updateSavedFilter({
      id: Number(id),
      userId,
      savedFilter: body.savedFilter,
    });

    const status = response.isSuccess ? 200 : response.isDuplicateName ? 409 : 404;
    return c.json(response, status);
  },
);

SavedFiltersRoutes.delete(
  "/:id",
  checkAuth,
  zValidator("param", z.object({ id: z.string().regex(/^\d+$/) })),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { id } = c.req.valid("param");

    const repo = new SavedFiltersRepo(c.env);
    const response = await repo.deleteSavedFilter({ id: Number(id), userId });

    return c.json(response, response.isSuccess ? 200 : 404);
  },
);

export default SavedFiltersRoutes;
