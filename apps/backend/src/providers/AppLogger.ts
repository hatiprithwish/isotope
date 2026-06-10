import Constants from "@/config/Constants";
import {
  type LogRecord,
  type Sink,
  configure,
  dispose,
  getConsoleSink,
  getLogger,
  withContext,
} from "@logtape/logtape";

import type * as Schemas from "@app/schemas";
import { AsyncLocalStorage } from "node:async_hooks";

// Cloudflare Workers observability parses a plain object passed to console.log as structured fields.
// The standard getConsoleSink formats everything into one styled string, which CF captures as a blob.
function cfStructuredSink(): Sink {
  return (record: LogRecord) => {
    const { action, metadata, error, category } = record.properties;
    console.log({
      level: record.level,
      message: String(record.message),
      category,
      action,
      ...(metadata !== undefined ? { metadata } : {}),
      ...(error !== undefined ? { error: String(error) } : {}),
    });
  };
}

export async function configureLogger(): Promise<void> {
  const metaConsoleSink = getConsoleSink();

  await configure({
    sinks: { console: metaConsoleSink, cf: cfStructuredSink() },
    contextLocalStorage: new AsyncLocalStorage<Record<string, unknown>>(),
    loggers: [
      {
        // DEV_NOTE: category for internal logtape/library metadata logs.
        category: ["logtape", "meta"],
        sinks: ["console"],
        lowestLevel: "warning",
      },
      // DEV_NOTE: category for application logs — cf sink only emits structured JSON, no styled string noise.
      {
        category: [Constants.APP_NAME],
        sinks: ["cf"],
        lowestLevel: "info",
      },
    ],
  });
}

// DEV_NOTE: Expose dispose function to flush logs before worker termination.
export { dispose as disposeLogger };

// DEV_NOTE: Helper function to run a block of code within a request context (e.g. for correlating logs with a request ID).
export function withRequestContext<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  return withContext({ requestId }, fn);
}

export default class AppLogger {
  private static get(category: Schemas.LogCategory) {
    return getLogger([Constants.APP_NAME, category]);
  }

  static info(params: {
    category: Schemas.LogCategory;
    action: Schemas.LogAction;
    message: string;
    metadata?: any;
  }): void {
    AppLogger.get(params.category).info(params.message, {
      category: params.category,
      action: params.action,
      metadata: params.metadata,
    });
  }

  static warn(params: {
    category: Schemas.LogCategory;
    action: Schemas.LogAction;
    message: string;
    metadata?: any;
  }): void {
    AppLogger.get(params.category).warn(params.message, {
      category: params.category,
      action: params.action,
      metadata: params.metadata,
    });
  }

  static error(params: {
    category: Schemas.LogCategory;
    action: Schemas.LogAction;
    message: string;
    error?: unknown;
    metadata?: any;
  }): void {
    AppLogger.get(params.category).error(params.message, {
      category: params.category,
      action: params.action,
      metadata: params.metadata,
      error: params.error,
    });
  }
}
