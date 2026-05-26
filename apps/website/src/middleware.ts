import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { createRequestLogger, initLogger } from "evlog";
import { createPostHogDrain } from "evlog/posthog";

initLogger({
  env: { service: "website" },
  drain: createPostHogDrain({
    apiKey: env.POSTHOG_KEY,
    host: env.POSTHOG_HOST,
  }),
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
