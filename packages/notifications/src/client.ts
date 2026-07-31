import { createClient, createNotify } from "@betternotify/core";

import { createMainCatalog } from "./catalog.ts";
import { createChannels } from "./channel.ts";
import { createTransports } from "./transport.ts";

export function createNotificationClient() {
  const channels = createChannels();

  const rpc = createNotify({ channels });

  const catalog = createMainCatalog(rpc);

  const transportsByChannel = createTransports();

  return createClient({
    catalog,
    transportsByChannel,
  });
}
