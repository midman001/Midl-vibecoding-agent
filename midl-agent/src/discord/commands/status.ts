import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import type { SlashCommand } from "./index.js";

export const statusCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Show bot health, uptime, and connection info"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const uptime = interaction.client.uptime ?? 0;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    const seconds = Math.floor((uptime % 60000) / 1000);

    const ping = interaction.client.ws.ping;
    const guildName = interaction.guild?.name ?? "Unknown";

    const embed = new EmbedBuilder()
      .setTitle("Bot Status")
      .setColor(0x57f287)
      .addFields(
        {
          name: "Uptime",
          value: `${hours}h ${minutes}m ${seconds}s`,
          inline: true,
        },
        {
          name: "Latency",
          value: `${ping}ms`,
          inline: true,
        },
        {
          name: "Connection",
          value: interaction.client.isReady() ? "Connected" : "Disconnected",
          inline: true,
        },
        {
          name: "Server",
          value: guildName,
          inline: true,
        },
        {
          name: "Version",
          value: "1.0.0",
          inline: true,
        }
      )
      .setFooter({ text: "MIDL Agent v1.0" });

    await interaction.reply({ ephemeral: true, embeds: [embed] });
  },
};
