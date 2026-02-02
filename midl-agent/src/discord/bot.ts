import { DiscordClient } from "./discord-client.js";
import { ForumPoster } from "./forum-poster.js";
import { CommandHandler } from "./command-handler.js";
import { createReportBugCommand } from "./commands/index.js";
import { WorkflowOrchestrator } from "../search/workflow-orchestrator.js";
import { loadDiscordConfig } from "./types.js";

export async function startBot(): Promise<() => Promise<void>> {
  const config = loadDiscordConfig();

  const client = new DiscordClient({ config });
  const orchestrator = new WorkflowOrchestrator();
  const forumPoster = new ForumPoster(client);

  const commandHandler = new CommandHandler(client);
  const reportBugCommand = createReportBugCommand(orchestrator, forumPoster);
  commandHandler.addCommand(reportBugCommand);

  await client.connect();
  await commandHandler.registerCommands();

  // Listen for slash command interactions
  client.on("interactionCreate", (interaction) => {
    commandHandler.handleInteraction(interaction as any).catch((err) => {
      console.error("Error handling interaction:", err);
    });
  });

  console.log("MIDL Discord bot is running!");

  const cleanup = async () => {
    await stopBot(client);
  };

  // Graceful shutdown
  const onShutdown = async () => {
    console.log("Shutting down MIDL Discord bot...");
    await cleanup();
    process.exit(0);
  };

  process.on("SIGINT", onShutdown);
  process.on("SIGTERM", onShutdown);

  return cleanup;
}

export async function stopBot(client: DiscordClient): Promise<void> {
  await client.disconnect();
  console.log("MIDL Discord bot stopped.");
}

// Run directly
const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("bot.ts") || process.argv[1].endsWith("bot.js"));

if (isDirectRun) {
  startBot().catch((err) => {
    console.error("Failed to start bot:", err);
    process.exit(1);
  });
}
