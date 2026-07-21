import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import FollowUpSettingsRepo from "@/repositories/FollowUpSettingsRepo";

const FollowUpSettingsRoutes = new Hono<AppContext>();

FollowUpSettingsRoutes.get("/", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new FollowUpSettingsRepo(c.env);
  const response = await repo.getSettingsDetails({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

FollowUpSettingsRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZSaveFollowUpSettingsApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new FollowUpSettingsRepo(c.env);
    const response = await repo.saveSettings({ userId, input: body });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

export default FollowUpSettingsRoutes;
