import {
  ApplicationCommandOptionType,
  CacheType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  MessagePayload,
} from "discord.js";
import { Command } from "../../interface";
import Users from "../../models/Users";
import { Globals } from "../../xmpp/types/XmppTypes";
import { EmbedBuilder } from "discord.js";
import log from "../../utils/log";
import { getEnv } from "../../utils";

interface ChangeUsernameOptions {
  username: string;
  ephemeral?: boolean;
}

export default class ChangeUsernameCommand implements Command {
  data = {
    name: "changeusername",
    description: "Change the user's account username",
    options: [
      {
        name: "username",
        type: ApplicationCommandOptionType.String,
        description: "The new username for the account",
        required: true,
      },
    ],
  };

  async execute(interaction: CommandInteraction): Promise<any> {
    const options =
      interaction.options as CommandInteractionOptionResolver<CacheType> &
        ChangeUsernameOptions;

    await interaction.deferReply({ ephemeral: options.ephemeral ?? true });

    const userId = interaction.user.id;
    const user = await Users.findOne({ discordId: userId });
    const channelId = getEnv("CHANNEL_ID");

    if (!user) {
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

    const AccessToken = Globals.AccessTokens.find(
      (data) => data.accountId === user.accountId
    );

    if (AccessToken) {
      const embed = new EmbedBuilder()
        .setTitle("Failed to change Username")
        .setDescription(
          "Unable to change your username because you are currently logged into Fortnite."
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

    try {
      await user
        .updateOne({ $set: { username: options.username } })
        .cacheQuery();

      const embed = new EmbedBuilder()
        .setTitle("Username Changed")
        .setDescription("Successfully changed your account's username.")
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
      log.error(`Failed to change username: ${err.message}`, "Bot");
    }
  }
}
