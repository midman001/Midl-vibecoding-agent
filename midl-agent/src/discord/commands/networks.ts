import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import type { SlashCommand } from "./index.js";

const NETWORKS = {
  mainnet: {
    name: "Mainnet",
    chainId: "Bitcoin Mainnet",
    rpc: "https://rpc.midl.xyz/mainnet",
    explorer: "https://mempool.space",
    status: "Live",
  },
  testnet: {
    name: "Testnet",
    chainId: "Bitcoin Testnet",
    rpc: "https://rpc.midl.xyz/testnet",
    explorer: "https://mempool.space/testnet",
    status: "Live",
  },
  devnet: {
    name: "Devnet",
    chainId: "Local Development",
    rpc: "http://localhost:8332",
    explorer: "N/A",
    status: "Local",
  },
} as const;

export const networksCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("networks")
    .setDescription("Chain info and RPC endpoints for MIDL networks"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("MIDL Networks")
      .setColor(0x5865f2);

    for (const [, network] of Object.entries(NETWORKS)) {
      const statusIcon =
        network.status === "Live" ? "\u{1F7E2}" : "\u{1F7E1}";
      embed.addFields({
        name: `${statusIcon} ${network.name}`,
        value: [
          `**Chain:** ${network.chainId}`,
          `**RPC:** \`${network.rpc}\``,
          `**Explorer:** ${network.explorer === "N/A" ? "N/A" : `[Link](${network.explorer})`}`,
        ].join("\n"),
      });
    }

    embed.setFooter({ text: "MIDL Agent v1.0" });

    await interaction.reply({ ephemeral: true, embeds: [embed] });
  },
};
