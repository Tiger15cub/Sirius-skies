import { Client } from "discord.js";
import fs from "node:fs";
import { join } from "node:path";

import { Event } from "../../interface";

export default function EventHandler(client: Client) {
  const events = fs
    .readdirSync(join(__dirname, "..", "events"))
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of events) {
    const EventClass = require(join(__dirname, "..", "events", file)).default;
    const eventInstance = new EventClass() as Event;

    if (eventInstance.once) {
      client.once(eventInstance.name, (...args) =>
        eventInstance.execute(...args, client)
      );
    } else {
      client.on(eventInstance.name, (...args) =>
        eventInstance.execute(...args, client)
      );
    }
  }
}
