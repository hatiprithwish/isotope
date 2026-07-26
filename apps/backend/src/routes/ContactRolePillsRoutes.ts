import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import ContactRolePillsRepo from "@/repositories/ContactRolePillsRepo";

const ContactRolePillsRoutes = new Hono<AppContext>();

ContactRolePillsRoutes.get("/", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new ContactRolePillsRepo(c.env);
  const response = await repo.getPillsDetails({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

ContactRolePillsRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZSaveContactRolePillsApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new ContactRolePillsRepo(c.env);
    const response = await repo.savePills({ userId, input: body });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

export default ContactRolePillsRoutes;
