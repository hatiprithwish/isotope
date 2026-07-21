import { Hono } from "hono";
import SearchRepo from "@/repositories/SearchRepo";
import checkAuth from "@/middlewares/AuthMiddleware";
import type AppContext from "@/config/AppContext";
import * as Schemas from "@app/schemas";
import { zValidator } from "@hono/zod-validator";

const SearchRoutes = new Hono<AppContext>();

SearchRoutes.get("/", checkAuth, zValidator("query", Schemas.ZSearchApiRequest), async (c) => {
  const userId = c.get("clerkUserId");
  const { q, limit } = c.req.valid("query");

  const repo = new SearchRepo(c.env);
  const response = await repo.search({ q, limit, userId });

  return c.json(response, response.isSuccess ? 200 : 500);
});

export default SearchRoutes;
