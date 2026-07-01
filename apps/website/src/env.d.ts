/// <reference types="astro/client" />

import type { PostHog } from "@posthog/types";
import type { RequestLogger } from "evlog";

declare global {
  interface Window {
    posthog?: PostHog;
  }

  namespace App {
    interface Locals {
      log: RequestLogger;
    }
  }
}
