import { copycat } from "@snaplet/copycat";

import { PREVIEW_PASSWORD_HASH } from "./src/anonymize/preview-password.ts";
import type { AnonymizeConfig } from "./src/anonymize/types.ts";
import { textSeed } from "./src/anonymize/values.ts";

export const anonymizeConfig = {
  users: {
    op: "columns",
    columns: {
      id: { op: "keep" },
      name: { op: "fake", fake: (value) => copycat.fullName(textSeed(value)) },
      email: { op: "fake", fake: (value) => copycat.email(textSeed(value)) },
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
      password: { op: "fake", fake: () => PREVIEW_PASSWORD_HASH },
      created_at: { op: "keep" },
      updated_at: { op: "keep" },
    },
  },
} satisfies AnonymizeConfig;
