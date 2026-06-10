import { Hono } from "hono";
import { Resend } from "resend";
import type { EmailReceivedEvent } from "resend";
import type AppContext from "@/config/AppContext";
import EnvConfig from "@/config/EnvConfig";
import AppLogger from "@/providers/AppLogger";
import * as Schemas from "@app/schemas";

const EmailInboundRoutes = new Hono<AppContext>();

EmailInboundRoutes.post("/", async (c) => {
  const rawBody = await c.req.text();
  const resend = new Resend(EnvConfig.resendApiKey(c.env));

  let event: ReturnType<typeof resend.webhooks.verify>;
  try {
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: c.req.header("svix-id") ?? "",
        timestamp: c.req.header("svix-timestamp") ?? "",
        signature: c.req.header("svix-signature") ?? "",
      },
      webhookSecret: EnvConfig.resendWebhookSecret(c.env),
    });
  } catch (error) {
    AppLogger.error({
      category: Schemas.LogCategory.Route,
      action: Schemas.LogAction.InboundEmailReceived,
      message: "Webhook signature verification failed",
      error,
    });
    return c.json({ isSuccess: false, message: "Invalid signature" }, 400);
  }

  if (event.type !== "email.received") {
    return c.json({ isSuccess: true, message: "Ignored" }, 200);
  }

  const receivedEvent = event as EmailReceivedEvent;
  const toAddress = receivedEvent.data.to[0] ?? "";
  const atIndex = toAddress.indexOf("@");
  const userId = atIndex > 0 ? toAddress.slice(0, atIndex) : "";

  if (!userId) {
    AppLogger.error({
      category: Schemas.LogCategory.Route,
      action: Schemas.LogAction.InboundEmailReceived,
      message: "Could not extract userId from to address",
      metadata: { toAddress },
    });
    return c.json({ isSuccess: false, message: "Invalid recipient" }, 400);
  }

  const emailId = receivedEvent.data.email_id;

  AppLogger.info({
    category: Schemas.LogCategory.Route,
    action: Schemas.LogAction.InboundEmailReceived,
    message: "Inbound email received — enqueueing",
    metadata: { emailId, userId },
  });

  await c.env.ISOTOPE_QUEUE.send({
    type: "InboundJobAlert" as const,
    action: "Process" as const,
    emailId,
    userId,
  });

  return c.json({ isSuccess: true, message: "Queued" }, 200);
});

export default EmailInboundRoutes;
