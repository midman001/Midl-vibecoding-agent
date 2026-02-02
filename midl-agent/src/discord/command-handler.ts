import {
  REST,
  Routes,
  EmbedBuilder,
  Interaction,
} from "discord.js";
import type { DiscordClient } from "./discord-client.js";
import { commands } from "./commands/index.js";
import type { SlashCommand } from "./commands/index.js";

export class CommandHandler {
  private client: DiscordClient;
  private commandMap: Map<string, SlashCommand>;

  constructor(client: DiscordClient) {
    this.client = client;
    this.commandMap = new Map();
    for (const cmd of commands) {
      this.commandMap.set(cmd.data.name, cmd);
    }
  }

  addCommand(command: SlashCommand): void {
    this.commandMap.set(command.data.name, command);
  }

  async registerCommands(): Promise<void> {
    const config = this.client.getConfig();
    const rest = new REST({ version: "10" }).setToken(config.botToken);

    const commandData = Array.from(this.commandMap.values()).map((cmd) =>
      cmd.data.toJSON()
    );

    const app = (await rest.get(Routes.currentApplication())) as { id: string };

    await rest.put(
      Routes.applicationGuildCommands(app.id, config.guildId),
      { body: commandData }
    );
  }

  async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commandMap.get(interaction.commandName);
    if (!command) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("Unknown Command")
        .setDescription(
          `Command \`/${interaction.commandName}\` is not recognized.`
        )
        .setColor(0xed4245);

      await interaction.reply({ ephemeral: true, embeds: [errorEmbed] });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("Command Error")
        .setDescription(
          `An error occurred while executing \`/${interaction.commandName}\`. Please try again later.`
        )
        .setColor(0xed4245);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ ephemeral: true, embeds: [errorEmbed] });
      } else {
        await interaction.reply({ ephemeral: true, embeds: [errorEmbed] });
      }
    }
  }
}
