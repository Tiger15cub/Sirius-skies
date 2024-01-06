import Users from "../../models/Users";
import Accounts from "../../models/Accounts";
import { EmbedBuilder } from "discord.js";
import { getEnv } from "../../utils";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import log from "../../utils/log";
import { DateTime } from "luxon";
import fs from "node:fs";
import path from "node:path";
import Friends from "../../models/Friends";
import {
  CreateAthenaProfileItem,
  CreateCommonCoreProfileItem,
} from "../../common/mcp/utils/profile";

export default async function execute(interaction: any) {
  await interaction.deferReply({ ephemeral: true });

  const email = interaction.options.getString("email");
  const username = interaction.options.getString("username");
  const password = interaction.options.getString("password");

  const userId = interaction.user.id;
  const channelId = getEnv("CHANNEL_ID");

  const user = await Users.findOne({ discordId: userId });

  if (user) {
    const embed = new EmbedBuilder()
      .setTitle("Already Registered")
      .setDescription("You have already registered an account.")
      .setColor("#F01414")
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

  const existingUser = await Users.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    const embed = new EmbedBuilder()
      .setTitle("Registration Failed")
      .setDescription("The provided email or username is already in use.")
      .setColor("#F01414")
      .setFooter({
        text: "Sirius",
        iconURL:
          "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
      })
      .setTimestamp();

    return await interaction.editReply({ embeds: [embed] });
  }

  const saltRounds: number = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  const accountId = uuid();

  try {
    const newUser = new Users({
      email,
      username,
      password: hashedPassword,
      accountId,
      discordId: userId,
      banned: false,
      timesinceLastUpdate: Date.now(),
      hasFL: false,
    });

    await newUser.save().then(async (acc) => {
      log.log(
        `Created user with the username ${username}`,
        "Bot",
        "magentaBright"
      );

      const account = new Accounts({
        accountId: acc.accountId,
        discordId: acc.discordId,
        banned: acc.banned,
        athena: await CreateAthenaProfileItem(acc),
        common_core: await CreateCommonCoreProfileItem(acc),
      });

      account.save();
      log.log(
        `Created account with the username ${username}`,
        "Bot",
        "magentaBright"
      );

      const friends = new Friends({
        accountId: acc.accountId,
      });

      friends.save();

      log.log(
        `Created friends model for user with the username ${username}`,
        "Bot",
        "magentaBright"
      );
    });

    const embed = new EmbedBuilder()
      .setTitle("Account Created")
      .setDescription("Your account has been successfully created")
      .setColor("#F01414")
      .addFields(
        {
          name: "Username",
          value: username,
          inline: false,
        },
        {
          name: "Email",
          value: email,
          inline: false,
        }
      )
      .setFooter({
        text: "Sirius",
        iconURL:
          "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    const publicEmbed = new EmbedBuilder()
      .setTitle("New Account Created")
      .setDescription(`${interaction.user.username} has created an account.`)
      .setColor("#F01414")
      .addFields({
        name: "Username",
        value: username,
        inline: false,
      })
      .setFooter({
        text: "Sirius",
        iconURL:
          "https://media.discordapp.net/attachments/1168987546643083266/1179414939060940861/fe0a0428f7b2db2154cf9ced998e9617.png",
      })
      .setTimestamp();

    await interaction.channel.send({ embeds: [publicEmbed] });
  } catch (error) {
    let err: Error = error as Error;
    log.error(`Failed to register user: ${err.message}`, "Bot");

    const embed = new EmbedBuilder()
      .setTitle("Account Registration Failed")
      .setDescription("Failed to register account, please try again.")
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
