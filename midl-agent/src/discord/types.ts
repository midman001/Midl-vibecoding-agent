export interface DiscordConfig {
  botToken: string;
  guildId: string;
  forumChannelId: string;
}

export interface ForumPostOptions {
  title: string;
  summary: string;
  reportMarkdown: string;
  reportFilename: string;
  authorName?: string;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  cooldownMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerMinute: 10,
  cooldownMs: 60000,
};

export function loadDiscordConfig(): DiscordConfig {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const forumChannelId = process.env.DISCORD_FORUM_CHANNEL_ID;

  const missing: string[] = [];
  if (!botToken) missing.push("DISCORD_BOT_TOKEN");
  if (!guildId) missing.push("DISCORD_GUILD_ID");
  if (!forumChannelId) missing.push("DISCORD_FORUM_CHANNEL_ID");

  if (missing.length > 0) {
    throw new Error(
      `Missing required Discord environment variables: ${missing.join(", ")}. ` +
        `Set them in your .env file or environment.`
    );
  }

  return { botToken: botToken!, guildId: guildId!, forumChannelId: forumChannelId! };
}
