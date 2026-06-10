import { Hono } from "hono";
import checkAuth from "@/middlewares/AuthMiddleware";
import EnvConfig from "@/config/EnvConfig";
import type AppContext from "@/config/AppContext";

const SettingsRoutes = new Hono<AppContext>();

SettingsRoutes.get("/inbound-address", checkAuth, (c) => {
  const clerkUserId = c.get("clerkUserId");
  const address = `${clerkUserId}@${EnvConfig.resendInboundDomain(c.env)}`;
  return c.json({ isSuccess: true, address }, 200);
});

export default SettingsRoutes;
