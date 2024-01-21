import BaseCommand from "../baseCommand";
import {
  ApplicationCommandOptionType,
  CacheType,
  ColorResolvable,
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  PermissionFlagsBits,
  User,
} from "discord.js";
import Users from "../../models/Users";
import Accounts from "../../models/Accounts";

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
        description: "The user to whom you want to add a full locker",
        required: true,
      },
    ],
    defaultMemberPermissions: PermissionFlagsBits.BanMembers.toString(),
    dmPermission: false,
  };

  async execute(interaction: CommandInteraction): Promise<any> {
    const options =
      interaction.options as CommandInteractionOptionResolver<CacheType> &
        FullLockerOptions;
    await interaction.deferReply({ ephemeral: options.ephemeral ?? true });

    const user = await Users.findOne({ discordId: options.user.id });
    const account = await Accounts.findOne({ discordId: options.user.id });

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

    await Users.updateOne({ discordId: options.user.id }, { hasFL: true });

    const successMessage = `Successfully added a full locker to ${options.user.username}'s account.`;
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
