import { type NotifyRootBuilder } from "@betternotify/core";
import { reactEmail } from "@betternotify/react-email";
import WelcomeEmail from "@workspace/emails/transactional/welcome";
import { z } from "zod";

import { type Channels } from "./channel.ts";

export function createMainCatalog(rpc: NotifyRootBuilder<Channels, {}>) {
  return rpc.catalog({
    welcome: rpc
      .email()
      .input(
        z.object({
          actionUrl: z.url(),
          name: z.string().min(1),
        }),
      )
      .subject(({ input }) => `Welcome to Dia Zero, ${input.name}`)
      .template(({ input }) => reactEmail(WelcomeEmail, input, { plainText: true })),
  });
}
