import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import type { SlashCommand } from "./index.js";

export const linksCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("links")
    .setDescription("MIDL developer resources and documentation links"),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle("MIDL Developer Resources")
      .setColor(0x5865f2)
      .addFields(
        {
          name: "Documentation",
          value: "[MIDL JS Docs](https://js.midl.xyz/docs)",
        },
        {
          name: "GitHub",
          value: "[midl-xyz/midl-js](https://github.com/midl-xyz/midl-js)",
        },
        {
          name: "NPM Packages",
          value: [
            "[@midl/core](https://www.npmjs.com/package/@midl-xyz/midl-js-core)",
            "[@midl/react](https://www.npmjs.com/package/@midl-xyz/midl-js-react)",
            "[@midl/contracts](https://www.npmjs.com/package/@midl-xyz/midl-js-contracts)",
            "[@midl/executor-react](https://www.npmjs.com/package/@midl-xyz/midl-js-executor-react)",
          ].join("\n"),
        },
        {
          name: "Website",
          value: "[midl.xyz](https://midl.xyz)",
        }
      )
      .setFooter({ text: "MIDL Agent v1.0" });

    await interaction.reply({ ephemeral: true, embeds: [embed] });
  },
};
