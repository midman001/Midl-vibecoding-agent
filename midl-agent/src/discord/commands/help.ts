import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import type { SlashCommand } from "./index.js";

export const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show usage guide and available commands"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("MIDL Agent Bot")
      .setDescription(
        "A specialized assistant for vibecoders building Web3 applications on Bitcoin with the MIDL SDK."
      )
      .setColor(0x5865f2)
      .addFields(
        {
          name: "/help",
          value: "Show this usage guide",
          inline: true,
        },
        {
          name: "/status",
          value: "Bot health and connection info",
          inline: true,
        },
        {
          name: "/links",
          value: "MIDL developer resources and documentation",
          inline: true,
        },
        {
          name: "/networks",
          value: "Chain info and RPC endpoints",
          inline: true,
        }
      )
      .setFooter({ text: "MIDL Agent v1.0" });

    await interaction.reply({ ephemeral: true, embeds: [embed] });
  },
};
