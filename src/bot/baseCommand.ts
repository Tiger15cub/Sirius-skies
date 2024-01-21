import { CommandInteraction } from "discord.js";
import { Command } from "../interface";

export default class BaseCommand implements Command {
  data: {
    name: string;
    description: string;
  };

  constructor(data: { name: string; description: string }) {
    this.data = data;
  }

  async execute(interaction: CommandInteraction): Promise<void> {}
}
