// DEV_NOTE: Tanstack Start Server entry point

import * as Sentry from "@sentry/tanstackstart-react";
import { wrapFetchWithSentry } from "@sentry/tanstackstart-react";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const handler = createStartHandler(defaultStreamHandler);

export default createServerEntry(
  wrapFetchWithSentry({
    fetch: (request: Request) => handler(request),
  }),
);
