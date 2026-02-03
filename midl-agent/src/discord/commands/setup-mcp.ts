/**
 * /setup-mcp Discord Command
 *
 * Generates an API key for the MIDL MCP server, enabling Claude Code
 * integration for posting diagnostic reports to Discord.
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import type { SlashCommand } from "./index.js";
import { apiKeyStore } from "../../mcp-server/api-key-store.js";

export const setupMcpCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-mcp")
    .setDescription(
      "Generate an API key for the MIDL MCP server (for Claude Code integration)"
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.user;

    // Check if user already has a key
    const existingKey = apiKeyStore.getKeyForUser(user.id);
    const isRegeneration = existingKey !== null;

    // Generate new key (this revokes the old one if it exists)
    const apiKey = apiKeyStore.createKey(user.id);

    // Build success embed
    const embed = new EmbedBuilder()
      .setTitle("MCP API Key Generated")
      .setDescription(
        isRegeneration
          ? "Your previous API key has been revoked. Here's your new key for the MIDL MCP server."
          : "Here's your API key for the MIDL MCP server. This allows Claude Code to post diagnostic reports to Discord on your behalf."
      )
      .setColor(0x57f287) // Green
      .addFields(
        {
          name: "Your API Key",
          value: `\`\`\`\n${apiKey}\n\`\`\``,
          inline: false,
        },
        {
          name: "Setup Instructions",
          value:
            "1. Add to your `.env` file:\n```\nMCP_API_KEY=" +
            apiKey +
            "\n```\n2. The MIDL agent will use this key to post reports",
          inline: false,
        },
        {
          name: "Rate Limit",
          value: "5 posts per hour",
          inline: true,
        }
      )
      .setFooter({
        text: "Keep this key secret. If compromised, run /setup-mcp again to regenerate.",
      });

    // Reply with ephemeral message (only the user can see it)
    await interaction.reply({ ephemeral: true, embeds: [embed] });

    // Also send via DM as backup
    try {
      await user.send({ embeds: [embed] });
    } catch {
      // If DM fails (user has DMs disabled), that's okay - they have the ephemeral message
      // No need to log or notify
    }
  },
};
