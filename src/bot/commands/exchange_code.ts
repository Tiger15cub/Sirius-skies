import BaseCommand from "../baseCommand";
import {
  EmbedBuilder,
  CommandInteraction,
  CommandInteractionOptionResolver,
  CacheType,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} from "discord.js";
import Users from "../../models/Users";
import { getEnv } from "../../utils";
import Accounts from "../../models/Accounts";
import { DateTime } from "luxon";
import { getCommonCore } from "../../common/mcp/utils/getProfile";
import AccountRefresh from "../../utils/AccountRefresh";
import { Globals } from "../../xmpp/types/XmppTypes";
import { v4 as uuid } from "uuid";
import ExchangeCodes from "../../models/ExchangeCodes";

export default class MatchmakingBan extends BaseCommand {
  data = {
    name: "exchange_code",
    description: "Generates a ExchangeCode for you.",
    dmPermission: false,
  };

  async execute(interaction: any): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const user = await Users.findOne({ discordId: userId });
    const channelId = getEnv("CHANNEL_ID");

    const account = await Accounts.findOne({ discordId: userId });

    if (!user || !account) {
      const embed = new EmbedBuilder()
        .setTitle("Account Not Found")
        .setDescription("Unable to find the account. Please try again.")
        .setColor("#FF0000")
        .setFooter({
          text: "Sirius",
          iconURL:
            "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
        })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    if (interaction.channelId !== channelId) {
      const embed = new EmbedBuilder()
        .setTitle("Command Not Allowed")
        .setDescription(`You can only use this command in <#${channelId}>`)
        .setColor("#F01414")
        .setFooter({
          text: "Sirius",
          iconURL:
            "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
        })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    const existingExchangeCode = Globals.exchangeCodes.find(
      (item) => item.accountId === user.accountId
    );

    if (existingExchangeCode) {
      return await interaction.editReply({
        content: `You already have an exchangeCode, Here it is ||${existingExchangeCode.exchange_code}||`,
      });
    }

    const randomExchangeCode = uuid().replace(/-/g, "");
    const expiresAt = DateTime.local().plus({ minutes: 5 });

    Globals.exchangeCodes.push({
      accountId: user.accountId,
      exchange_code: randomExchangeCode,
      creatingClientId: getEnv("CLIENT_SECRET"),
      expiresAt: expiresAt,
    });

    await ExchangeCodes.create({
      accountId: user.accountId,
      exchange_code: randomExchangeCode,
      creatingClientId: getEnv("CLIENT_SECRET"),
      expiresAt: expiresAt,
    });

    setTimeout(() => {
      const index = Globals.exchangeCodes.findIndex(
        (item) => item.exchange_code === randomExchangeCode
      );

      if (index !== -1) {
        Globals.exchangeCodes.splice(index, 1);
      }
    }, 300000);

    return await interaction.editReply({
      content: `Here is your exchangeCode ||${randomExchangeCode}||`,
    });
  }
}
