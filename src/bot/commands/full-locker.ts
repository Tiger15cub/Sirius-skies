import BaseCommand from "../baseCommand";
import {
  ApplicationCommandOptionType,
  CacheType,
  ColorResolvable,
  EmbedBuilder,
  PermissionFlagsBits,
  User,
} from "discord.js";
import Users from "../../models/Users";
import Accounts from "../../models/Accounts";
import AccountRefresh from "../../utils/AccountRefresh";

interface FullLockerOptions {
  user: User;
  ephemeral?: boolean;
}

async function createEmbed(
  title: string,
  description: string,
  color: ColorResolvable | null
) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({
      text: "Sirius",
      iconURL:
        "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
    })
    .setTimestamp();
}

export default class FullLockerCommand extends BaseCommand {
  data = {
    name: "fulllocker",
    description: "Add a full locker to a user",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        description: "The user you want to give full locker to.",
        required: true,
      },
    ],
    defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
    dmPermission: false,
  };

  async execute(interaction: any): Promise<any> {
    await interaction.deferReply({
      ephemeral: true,
    });

    const user = await Users.findOne({
      discordId: interaction.user.id,
    });
    const account = await Accounts.findOne({
      discordId: interaction.user.id,
    });

    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return await interaction.editReply({
        content: "You do not have permission to use this command.",
      });
    }

    if (!user || !account) {
      const embed = await createEmbed(
        "Account Not Found",
        "Unable to find the account. Please try again.",
        "#FF0000"
      );
      return await interaction.editReply({ embeds: [embed] });
    }

    if (user.banned) {
      const embed = await createEmbed(
        "Banned",
        "This user is banned.",
        "#FF0000"
      );
      return await interaction.editReply({ embeds: [embed] });
    }

    if (user.hasFL) {
      const embed = await createEmbed(
        "Already has Full Locker",
        "This user already has a full locker.",
        "#FF0000"
      );
      return await interaction.editReply({ embeds: [embed] });
    }

    await Users.updateOne({ discordId: interaction.user.id }, { hasFL: true });
    await AccountRefresh(user.accountId, user.username);

    const successMessage = `Successfully added a full locker to ${interaction.user.username}'s account.`;
    const successEmbed = await createEmbed(
      "Success",
      successMessage,
      "#00FF00"
    );
    return await interaction.editReply({
      embeds: [successEmbed],
    });
  }
}
