import {
  CacheType,
  Client,
  Collection,
  CommandInteraction,
  Interaction,
} from "discord.js";
import fs from "node:fs";
import { join } from "node:path";

import { Command, ExtendedClient } from "../../interface";
import log from "../../utils/log";

interface InteractionOptions {
  ephemeral?: boolean;
}

export default function CommandHandler(client: ExtendedClient) {
  client.commands = new Collection<string, Command>();

  const commands = fs
    .readdirSync(join(__dirname, "..", "commands"))
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const command of commands) {
    const CommandClass = require(join(
      __dirname,
      "..",
      "commands",
      command
    )).default;
    const commandInstance = new CommandClass() as Command;

    if (commandInstance.data && commandInstance.data.name) {
      client.commands.set(commandInstance.data.name, commandInstance);
    } else {
      console.error(`Invalid data or name in command: ${command}`);
    }
  }

  client.on(
    "interactionCreate" as any,
    async (interaction: CommandInteraction) => {
      if (!interaction.isCommand()) return;

      const { commandName } = interaction;
      const command = client.commands.get(commandName);

      if (!command) return;

      try {
        await command.execute(interaction, {});
      } catch (error) {
        console.error(error);
        interaction.reply("There was an error executing that command!");
      }
    }
  );
}
