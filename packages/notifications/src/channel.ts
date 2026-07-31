import { emailChannel } from "@betternotify/email";
import { ENV } from "varlock/env";

export type Channels = ReturnType<typeof createChannels>;

export function createChannels() {
  const email = emailChannel({
    defaults: {
      from: {
        email: ENV.NOTIFICATION_FROM_EMAIL,
        name: ENV.NOTIFICATION_FROM_NAME,
      },
    },
  });

  return {
    email,
  };
}
