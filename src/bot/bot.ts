import { Client, Collection, GatewayIntentBits } from "discord.js";
import log from "../utils/log";
import { getEnv } from "../utils";
import { ExtendedClient } from "../interface";
import CommandHandler from "./handlers/Commands";
import EventHandler from "./handlers/Events";
import BaseCommand from "./baseCommand";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
}) as ExtendedClient;

client.commands = new Collection<string, BaseCommand>();

CommandHandler(client);
EventHandler(client);

client.login(getEnv("TOKEN"));
