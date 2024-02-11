import { ActivityType, Client } from "discord.js";
import log from "../../utils/log";
import { Saves } from "../../xmpp/types/Saves";

export default class ReadyEvent {
  name = "ready";
  once = false;

  execute(client: Client) {
    log.log(
      `Logged in as ${client.user?.username}`,
      "ReadyEvent",
      "greenBright"
    );
    client.user?.setActivity({
      name: `${(global as any).Clients.length} players.`,
      type: ActivityType.Playing,
    });
  }
}
