import { AttachmentBuilder } from "discord.js";
import type { DiscordClient } from "./discord-client.js";
import type { ForumPostOptions } from "./types.js";

export interface ForumPostResult {
  threadId: string;
  threadUrl: string;
}

export class ForumPoster {
  private discordClient: DiscordClient;

  constructor(discordClient: DiscordClient) {
    this.discordClient = discordClient;
  }

  async postReport(options: ForumPostOptions): Promise<ForumPostResult> {
    const forumChannel = await this.discordClient.getForumChannel();

    const summaryMessage = this.formatSummaryMessage(options);
    const truncatedTitle =
      options.title.length > 100 ? options.title.slice(0, 100) : options.title;

    const fileAttachment = new AttachmentBuilder(Buffer.from(options.reportMarkdown, "utf-8"), {
      name: options.reportFilename,
    });

    let thread;
    try {
      thread = await forumChannel.threads.create({
        name: truncatedTitle,
        message: {
          content: summaryMessage,
          files: [fileAttachment],
        },
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create forum thread: ${reason}`);
    }

    const config = this.discordClient.getConfig();
    const threadUrl = `https://discord.com/channels/${config.guildId}/${thread.id}`;

    return {
      threadId: thread.id,
      threadUrl,
    };
  }

  formatSummaryMessage(options: ForumPostOptions): string {
    const parts: string[] = [];

    if (options.authorName) {
      parts.push(`Hey team! Got a new bug report coming in from **${options.authorName}**.`);
    } else {
      parts.push("Hey team! Got a new bug report coming in.");
    }

    parts.push("");
    parts.push(`**What's going on:** ${options.title}`);
    parts.push("");
    parts.push("Full diagnostic details in the attached file.");

    return parts.join("\n");
  }
}
