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

export default class MatchmakingBan extends BaseCommand {
  data = {
    name: "claim_mfa",
    description: "Enable's MFA on your Account (Used for gifting)",
    defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
    dmPermission: false,
  };

  async execute(interaction: any): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;
    const user = await Users.findOne({ discordId: userId });
    const account = await Accounts.findOne({ discordId: userId });
    const channelId = getEnv("CHANNEL_ID");

    if (!user || !account) {
      const embed = new EmbedBuilder()
        .setTitle("Account Not Found")
        .setDescription("Unable to find your account, Please try again.")
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

    if (account.common_core.stats.attributes.mfa_enabled) {
      const embed = new EmbedBuilder()
        .setTitle("MFA Already Enabled")
        .setDescription("MFA is Already enabled on your Account.")
        .setColor("#FF0000")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    await Accounts.updateOne(
      { accountId: user.accountId },
      {
        $set: {
          "common_core.stats.attributes.mfa_enabled": true,
        },
      }
    );

    const embed = new EmbedBuilder()
      .setTitle("Successfully Claimed MFA")
      .setDescription(`Successfully Claimed MFA for the user ${user.username}.`)
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
