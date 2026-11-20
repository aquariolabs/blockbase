import { copycat } from "@snaplet/copycat";

import type { AnonymizeConfig } from "./src/anonymize/types.ts";
import { textSeed } from "./src/anonymize/values.ts";

export function fakeEmail(value: unknown): string {
  const email = copycat.email(textSeed(value), { domain: "preview.invalid" });
  if (!email.endsWith(".invalid")) throw new Error("Fake email must use the .invalid domain.");
  return email;
}

export function anonymizeConfig(previewPasswordHash: string): AnonymizeConfig {
  if (previewPasswordHash.length === 0) throw new Error("Preview password hash is required.");
  return {
    users: {
      op: "columns",
      columns: {
        id: { op: "keep" },
        name: { op: "fake", fake: (value) => copycat.fullName(textSeed(value)) },
        email: { op: "fake", fake: (value) => fakeEmail(value) },
        email_verified: { op: "keep" },
        image: { op: "null" },
        created_at: { op: "keep" },
        updated_at: { op: "keep" },
      },
    },
    sessions: { op: "truncate" },
    verifications: { op: "truncate" },
    accounts: {
      op: "columns",
      columns: {
        id: { op: "keep" },
        account_id: { op: "fake", fake: (value) => copycat.uuid(textSeed(value)) },
        provider_id: { op: "keep" },
        user_id: { op: "keep" },
        access_token: { op: "truncate" },
        refresh_token: { op: "truncate" },
        id_token: { op: "truncate" },
        access_token_expires_at: { op: "null" },
        refresh_token_expires_at: { op: "null" },
        scope: { op: "null" },
        password: { op: "fake", fake: () => previewPasswordHash },
        created_at: { op: "keep" },
        updated_at: { op: "keep" },
      },
    },
  };
}
