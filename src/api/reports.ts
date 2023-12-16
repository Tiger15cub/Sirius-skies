import { Router } from "express";
import Users from "../models/Users";
import { WebhookClient, EmbedBuilder } from "discord.js";
import { getEnv } from "../utils";

export default function initRoute(router: Router) {
  router.post(
    "/fortnite/api/game/v2/toxicity/account/:reporterId/report/:offenderId",
    async (req, res) => {
      const { reporterId, offenderId } = req.params;

      const reporter = await Users.findOne({ accountId: reporterId }).lean();
      const offender = await Users.findOne({ accountId: offenderId }).lean();

      const { reason, playlistName, details, gameSessionId } = req.body;

      if (!reporter || !offender)
        return res
          .status(404)
          .json({ error: "Reporter or Offender not found." });

      const webhook = new WebhookClient({
        id: getEnv("reportingWebhookId"),
        token: getEnv("reportingWebhookToken"),
      });

      const embed = new EmbedBuilder()
        .setTitle("A new User has been Reported!")
        .setColor("Aqua")
        .addFields(
          {
            name: "Reason",
            value: reason,
          },
          {
            name: "Details",
            value: details,
          },
          {
            name: "Playlist",
            value: playlistName,
          },
          {
            name: "Session",
            value: gameSessionId,
          },
          {
            name: "Offender",
            value: offender.username,
          }
        )
        .setFooter({
          text: `Report sent by ${reporter.username}`,
        });

      webhook.send({
        username: "Reporter",
        embeds: [embed],
        avatarURL: "",
        content: "",
      });

      return res.status(204).send({});
    }
  );
}
