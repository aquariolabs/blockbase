import { defineMiddleware } from "astro:middleware";
import { createRequestLogger, initLogger } from "evlog";
import { createPostHogDrain } from "evlog/posthog";
import { ENV } from "varlock/env";

const drain = ENV.POSTHOG_KEY
  ? createPostHogDrain({
      apiKey: ENV.POSTHOG_KEY,
      host: ENV.POSTHOG_HOST,
    })
  : undefined;

initLogger({
  env: { service: "website" },
  ...(drain ? { drain } : {}),
});

export const onRequest = defineMiddleware(async ({ request, locals }, next) => {
  const url = new URL(request.url);
  const log = createRequestLogger({
    method: request.method,
    path: url.pathname,
  });

  locals.log = log;

  try {
    const response = await next();
    log.set({ status: response.status });
    log.emit();
    return response;
  } catch (error) {
    log.error(error instanceof Error ? error : new Error(String(error)));
    log.emit();
    throw error;
  }
});
