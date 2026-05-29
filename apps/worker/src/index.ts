import { honoLogger } from "@logtape/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { configureLogger, disposeLogger, withRequestContext } from "@/providers/logger";
import * as Schemas from "@app/schemas";
import Constants from "@/config/Constants";
import UsersRoutes from "@/routes/UserRoutes";
import NotesRoutes from "@/routes/NotesRoutes";
import CompaniesRoutes from "@/routes/CompaniesRoutes";
import ContactsRoutes from "@/routes/ContactsRoutes";
import FrameworksRoutes from "@/routes/FrameworksRoutes";
import JobsRoutes from "@/routes/JobsRoutes";
import AuthRoutes from "@/routes/AuthRoutes";

// DEV_NOTE: Configure logger at the top level to ensure it's ready before handling any requests
await configureLogger();

const app = new Hono<{ Bindings: Env }>();

app.use((c, next) =>
  cors({
    origin: (origin) => {
      const allowed = c.env.ALLOWED_CORS_ORIGIN.split(",");
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-request-id"],
    exposeHeaders: ["x-request-id"],
    maxAge: 7200,
    credentials: true,
  })(c, next),
);
app.use(requestId({ headerName: "x-request-id" }));

app.use(async (c, next) => {
  await withRequestContext(c.get("requestId"), next);
});

app.use(
  honoLogger({
    category: [Constants.APP_NAME, Schemas.LogCategory.Middleware],
    level: "info",
  }),
);

app.route("/auth", AuthRoutes);
app.route("/users", UsersRoutes);
app.route("/notes", NotesRoutes);
app.route("/companies", CompaniesRoutes);
app.route("/contacts", ContactsRoutes);
app.route("/frameworks", FrameworksRoutes);
app.route("/jobs", JobsRoutes);

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(disposeLogger());
    return app.fetch(req, env, ctx);
  },
};
