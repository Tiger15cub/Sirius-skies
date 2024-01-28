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
    name: "matchmaking_ban",
    description: "Ban a user from matchmaking.",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        description: "The user you want to ban.",
        required: true,
      },
      {
        name: "ban_duration",
        type: ApplicationCommandOptionType.Number,
        description:
          "The amount of time you want to ban the user (1 = 1 day, 30 = 30 days)",
        required: true,
      },
    ],
    defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
    dmPermission: false,
  };

  async execute(interaction: any): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user");
    const targetUserId: string | undefined = targetUser?.id;
    const user = await Users.findOne({ discordId: targetUserId });
    const channelId = getEnv("CHANNEL_ID");
    const banDuration = interaction.options.getNumber("ban_duration");

    const account = await Accounts.findOne({ discordId: targetUserId });

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

      console.log("??");

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

    if (
      account.common_core.stats.attributes.ban_status.bRequiresUserAck &&
      account.common_core.stats.attributes.ban_status.bBanHasStarted
    ) {
      const embed = new EmbedBuilder()
        .setTitle("User Already Banned")
        .setDescription("This user is already banned.")
        .setColor("#FF0000")
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    await Accounts.updateOne(
      { accountId: user.accountId },
      {
        $push: {
          "common_core.stats.attributes.ban_status.banReasons": "Exploiting",
        },
        $set: {
          "common_core.stats.attributes.ban_status.bRequiresUserAck": true,
          "common_core.stats.attributes.ban_status.bBanHasStarted": true,
          "common_core.stats.attributes.ban_status.banStartTimeUtc":
            DateTime.now().toISO(),
          "common_core.stats.attributes.ban_status.banDurationDays":
            banDuration,
          "common_core.stats.attributes.ban_status.additionalInfo": "",
          "common_core.stats.attributes.ban_status.exploitProgramName": "",
          "common_core.stats.attributes.ban_status.competitiveBanReason":
            "None",
        },
      }
    );

    await AccountRefresh(user.accountId, user.username);

    const embed = new EmbedBuilder()
      .setTitle("User Successfully Banned")
      .setDescription(
        `Successfully banned user with the displayName ${user.username}.`
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
