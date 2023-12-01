import { Client, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import log from "../utils/log";
import registerCommand from "./commands/register";
import changePasswordCommand from "./commands/change-password";
import changeUsernameCommand from "./commands/change-username";
import fullLockerCommand from "./commands/full-locker";
import { getEnv } from "../utils";
import { registerData, changePassword, fullLocker } from "./data";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", (bot) => {
  log.log(`${bot.user.displayName} is online.`, "Bot", "greenBright");
  bot.application.commands.create(registerData.data as any);
  bot.application.commands.create(changePassword.data as any);
  bot.application.commands.create(fullLocker.data as any);
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  switch (commandName) {
    case "register":
      registerCommand(interaction);
      break;

    case "change-password":
      changePasswordCommand(interaction);
      break;

    case "change-username":
      changeUsernameCommand(interaction);
      break;

    case "full-locker":
      fullLockerCommand(interaction);
      break;

    default:
      interaction.reply({ content: `Command ${commandName} does not exist!` });
  }
});

client.login(getEnv("TOKEN"));
