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
import AccountRefresh from "../../utils/AccountRefresh";
import sendXmppMessageToClient from "../../utils/sendXmppMessageToClient";
import { DateTime } from "luxon";

interface VbucksOptions extends CommandInteractionOptionResolver<CacheType> {
  getUser(name: "user"): any;
  getString(name: "vbucks"): string;
}

export default class VbucksCommand extends BaseCommand {
  data = {
    name: "vbucks",
    description: "Change V-Bucks balance for a user",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        description: "The user you want to change the V-Bucks balance of",
        required: true,
      },
      {
        name: "vbucks",
        type: ApplicationCommandOptionType.String,
        description: "The amount of V-Bucks to add or subtract",
        required: true,
      },
    ],
    defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
    dmPermission: false,
  };

  async execute(interaction: any): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const options = interaction.options as VbucksOptions &
      Record<string, unknown>;

    const targetUser = interaction.options.getUser("user");
    const vbucksAmount: number = parseInt(options.getString("vbucks"));
    const targetUserId: string | undefined = targetUser?.id;
    const user = await Users.findOne({ discordId: targetUserId });
    const channelId = getEnv("CHANNEL_ID");

    const account = await Accounts.findOne({ discordId: targetUserId });

    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return await interaction.editReply({
        content: "You do not have permission to use this command.",
      });
    }

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

    await account
      .updateOne({
        $inc: {
          "common_core.items.Currency:MtxPurchased.quantity": vbucksAmount,
        },
      })
      .cacheQuery();

    const client = (global as any).Clients.find(
      (client: { accountId: string }) => client.accountId === user.accountId
    );

    if (client) {
      sendXmppMessageToClient(
        {
          payload: {},
          timestamp: DateTime.now().toISO(),
          type: "com.epicgames.gift.received",
        },
        user.accountId
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("Vbucks Changed")
      .setDescription(
        `Successfully updated the V-Bucks balance for user ${targetUser} to ${vbucksAmount}.`
      )
      .setColor("#F01414")
      .setFooter({
        text: "Sirius",
        iconURL:
          "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
      })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }
}
