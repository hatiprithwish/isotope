import { Hono } from "hono";
import StatusChangeNotesRepo from "@/repositories/StatusChangeNotesRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import { zValidator } from "@hono/zod-validator";

const StatusChangeNotesRoutes = new Hono<AppContext>();

StatusChangeNotesRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZCreateStatusChangeNoteApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new StatusChangeNotesRepo(c.env);
    const response = await repo.createStatusChangeNote({
      statusChangeNote: body.statusChangeNote,
      userId,
    });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

StatusChangeNotesRoutes.post(
  "/bulk",
  checkAuth,
  zValidator("json", Schemas.ZBulkCreateStatusChangeNotesApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new StatusChangeNotesRepo(c.env);
    const response = await repo.bulkCreateStatusChangeNotes({ ...body, userId });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

StatusChangeNotesRoutes.get(
  "/",
  checkAuth,
  zValidator("query", Schemas.ZGetStatusChangeNotesApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const { entityType, entityId } = c.req.valid("query");

    const repo = new StatusChangeNotesRepo(c.env);
    const response = await repo.getStatusChangeNotes({ entityType, entityId, userId });

    return c.json(response, response.isSuccess ? 200 : 500);
  },
);

export default StatusChangeNotesRoutes;
