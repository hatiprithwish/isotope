import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import RoleTypesRepo from "@/repositories/RoleTypesRepo";

const RoleTypesRoutes = new Hono<AppContext>();

RoleTypesRoutes.get("/", checkAuth, async (c) => {
  const userId = c.get("clerkUserId");

  const repo = new RoleTypesRepo(c.env);
  const response = await repo.getRoleTypesDetails({ userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

RoleTypesRoutes.post(
  "/",
  checkAuth,
  zValidator("json", Schemas.ZSaveRoleTypesApiRequest),
  async (c) => {
    const userId = c.get("clerkUserId");
    const body = c.req.valid("json");

    const repo = new RoleTypesRepo(c.env);
    const response = await repo.saveRoleTypes({ userId, input: body });

    return c.json(response, response.isSuccess ? 201 : 500);
  },
);

export default RoleTypesRoutes;
