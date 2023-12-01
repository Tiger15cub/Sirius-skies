import { REST, Routes, APIUser } from "discord.js";
import {
  changePassword,
  changeUsername,
  fullLocker,
  registerData,
} from "./data";
import { getEnv } from "../utils";
import log from "../utils/log";

const commands = [
  registerData.data,
  changePassword.data,
  changeUsername.data,
  fullLocker.data,
];

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

    await rest.put(endpoint, { body: commands });

    log.log(
      "Successfully reloaded application (/) commands.",
      "Deploy",
      "greenBright"
    );
  } catch (error) {
    log.error(`Failed to deploy commands: ${error}`, "Deploy");
  }
})();
