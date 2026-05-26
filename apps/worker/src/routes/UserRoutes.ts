import { Hono } from "hono";
import UsersRepo from "@/repositories/UsersRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";

const UsersRoutes = new Hono<AppContext>();

UsersRoutes.post("/clerk-sync", checkAuth, async (c) => {
  const clerkId = c.get("clerkUserId");
  const email = c.get("clerkEmail");

  const repo = new UsersRepo(c.env);
  const response = await repo.syncClerkUser({
    clerkId,
    email,
    role: Schemas.UserRoleEnum.User,
  });

  return c.json(response, response.isSuccess ? 200 : 500);
});

UsersRoutes.get("/me", checkAuth, async (c) => {
  const clerkId = c.get("clerkUserId");

  const repo = new UsersRepo(c.env);
  const response = await repo.getUserDetails({ clerkId });

  return c.json(response, response.isSuccess ? 200 : 404);
});

export default UsersRoutes;
