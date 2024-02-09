import {
  ApplicationCommandOptionType,
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
} from "discord.js";
import { Command } from "../../interface";
import Users from "../../models/Users";
import bcrypt from "bcrypt";
import { EmbedBuilder } from "discord.js";
import log from "../../utils/log";
import { getEnv } from "../../utils";

interface ChangePasswordOptions
  extends CommandInteractionOptionResolver<CacheType> {
  getUser(name: "user"): any;
  getString(name: "password"): string;
}

export default class ChangePasswordCommand implements Command {
  data = {
    name: "changepassword",
    description: "Change the password of your account",
    options: [
      {
        name: "password",
        type: ApplicationCommandOptionType.String,
        description: "New password for your account",
        required: true,
      },
    ],
  };

  async execute(interaction: CommandInteraction): Promise<any> {
    await interaction.deferReply({ ephemeral: true });

    const options = interaction.options as ChangePasswordOptions &
      Record<string, unknown>;

    const password = options.getString("password");
    const userId = interaction.user.id;
    const channelId = getEnv("CHANNEL_ID");

    const user = await Users.findOne({ discordId: userId });

    if (!user) {
      const embed = new EmbedBuilder()
        .setTitle("Account Not Found")
        .setDescription("Unable to find your account. Please try again.")
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

    if (password.length > 8) {
      const embed = new EmbedBuilder()
        .setTitle("Failed to Change Password")
        .setDescription(
          "Your account password must be at least 8 characters long."
        )
        .setColor("#FF0000")
        .setFooter({
          text: "Sirius",
          iconURL:
            "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
        })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);

      await user.updateOne({ $set: { password: hashedPassword } }).cacheQuery();

      const embed = new EmbedBuilder()
        .setTitle("Password Changed")
        .setDescription("Successfully changed your account's password.")
        .setColor("#2B2D31")
        .setFooter({
          text: "Sirius",
          iconURL:
            "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
        })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      let err: Error = error as Error;
      log.error(`Failed to change password: ${err.message}`, "Bot");
    }
  }
}
