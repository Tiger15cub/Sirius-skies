import { REST, Routes, APIUser } from "discord.js";
import { getEnv } from "../utils";
import fs from "node:fs";
import { join } from "node:path";
import { Command } from "../interface";
import log from "../utils/log";

const commands = fs
  .readdirSync(join(__dirname, "commands"))
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

const commandData = commands.map((command) => {
  const CommandClass = require(join(__dirname, "commands", command)).default;
  const commandInstance = new CommandClass() as Command;
  return commandInstance.data;
});

const rest = new REST({ version: "10" }).setToken(getEnv("TOKEN"));

(async () => {
  try {
    log.log(
      "Started refreshing application (/) commands.",
      "Deploy",
      "greenBright"
    );

    const currentUser = (await rest.get(Routes.user())) as APIUser;

    const endpoint =
      process.env.NODE_ENV === "production"
        ? Routes.applicationCommands(currentUser.id)
        : Routes.applicationGuildCommands(currentUser.id, getEnv("GUILD_ID"));

    await rest.put(endpoint, { body: commandData });

    log.log(
      "Successfully reloaded application (/) commands.",
      "Deploy",
      "greenBright"
    );
  } catch (error) {
    log.error(`Failed to deploy commands: ${error}`, "Deploy");
  }
})();
