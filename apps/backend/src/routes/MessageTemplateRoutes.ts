import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import MessageTemplateRepo from "@/repositories/MessageTemplateRepo";

const MessageTemplateRoutes = new Hono<AppContext>();

MessageTemplateRoutes.get("/", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new MessageTemplateRepo(c.env);
  const response = await repo.getTemplates({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

MessageTemplateRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZSaveMessageTemplateApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new MessageTemplateRepo(c.env);
    const response = await repo.saveTemplate({ userId, input: body });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

export default MessageTemplateRoutes;
