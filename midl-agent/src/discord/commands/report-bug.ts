import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommandBuilder as SlashCommandBuilderClass, EmbedBuilder } from "discord.js";
import type { WorkflowOrchestrator } from "../../search/workflow-orchestrator.js";
import type { DiagnosticContext } from "../../search/diagnostic-report-generator.js";
import type { ForumPoster } from "../forum-poster.js";

export interface SlashCommand {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export function createReportBugCommand(
  orchestrator: WorkflowOrchestrator,
  forumPoster: ForumPoster
): SlashCommand {
  const data = new SlashCommandBuilderClass()
    .setName("report-bug")
    .setDescription("Generate a diagnostic report and post it to the forum")
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Brief description of the problem")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("error-message")
        .setDescription("The error message encountered")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("sdk-package")
        .setDescription("Which MIDL SDK package")
        .setRequired(false)
        .addChoices(
          { name: "@midl/core", value: "@midl/core" },
          { name: "@midl/react", value: "@midl/react" },
          { name: "@midl/contracts", value: "@midl/contracts" },
          { name: "@midl/executor-react", value: "@midl/executor-react" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("network")
        .setDescription("Which network")
        .setRequired(false)
        .addChoices(
          { name: "mainnet", value: "mainnet" },
          { name: "testnet", value: "testnet" },
          { name: "devnet", value: "devnet" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("your-name")
        .setDescription("Your name for attribution in the forum post")
        .setRequired(false)
    ) as unknown as SlashCommandBuilder;

  async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const description = interaction.options.getString("description", true);
    const errorMessage = interaction.options.getString("error-message");
    const sdkPackage = interaction.options.getString("sdk-package");
    const network = interaction.options.getString("network");
    const authorName = interaction.options.getString("your-name");

    // Build diagnostic context from command options
    const diagnosticContext: Partial<DiagnosticContext> = {
      userDescription: description,
    };

    if (errorMessage) {
      diagnosticContext.errorMessages = [errorMessage];
    }

    const environment: DiagnosticContext["environment"] = {};
    if (network) {
      environment.network = network;
    }
    if (sdkPackage) {
      environment.sdkPackages = { [sdkPackage]: "unknown" };
    }
    if (Object.keys(environment).length > 0) {
      diagnosticContext.environment = environment;
    }

    try {
      const result = await orchestrator.handleProblemReport(description, diagnosticContext);

      if (result.diagnosticReport) {
        const reportFilename = `diagnostic-report-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.md`;

        const postResult = await forumPoster.postReport({
          title: description.length > 100 ? description.slice(0, 100) : description,
          summary: result.formattedResponse,
          reportMarkdown: result.diagnosticReport.markdown,
          reportFilename,
          authorName: authorName ?? undefined,
        });

        const embed = new EmbedBuilder()
          .setTitle("Report posted!")
          .setDescription(`Your diagnostic report has been posted to the forum.\n\n[View thread](${postResult.threadUrl})`)
          .setColor(0x00ff00);

        await interaction.editReply({ embeds: [embed] });
      } else {
        // Defensive: no diagnostic report generated
        await interaction.editReply({
          content: result.formattedResponse.slice(0, 2000),
        });
      }
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      await interaction.editReply({
        content: `Failed to generate or post report: ${reason}`,
      });
    }
  }

  return { data, execute };
}
