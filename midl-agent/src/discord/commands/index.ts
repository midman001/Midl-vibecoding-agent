import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { helpCommand } from "./help.js";
import { statusCommand } from "./status.js";
import { linksCommand } from "./links.js";
import { networksCommand } from "./networks.js";

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: SlashCommand[] = [
  helpCommand,
  statusCommand,
  linksCommand,
  networksCommand,
];

export { helpCommand, statusCommand, linksCommand, networksCommand };
export { createReportBugCommand } from "./report-bug.js";
