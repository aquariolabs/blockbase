import { cloudflareEmailTransport } from "@betternotify/cloudflare-email";
import { ENV } from "varlock/env";

export function createTransports() {
  return {
    email: cloudflareEmailTransport({
      accountId: ENV.CLOUDFLARE_ACCOUNT_ID!,
      apiToken: ENV.CLOUDFLARE_EMAIL_API_TOKEN!,
    }),
  };
}
