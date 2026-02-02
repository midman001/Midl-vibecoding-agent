import { Client, GatewayIntentBits, ForumChannel, ChannelType, Guild } from "discord.js";
import { DiscordConfig, RateLimitConfig, DEFAULT_RATE_LIMIT, loadDiscordConfig } from "./types.js";

export interface DiscordClientDeps {
  config?: DiscordConfig;
  rateLimitConfig?: RateLimitConfig;
}

export class DiscordClient {
  private client: Client;
  private config: DiscordConfig;
  private rateLimitConfig: RateLimitConfig;
  private requestTimestamps: number[] = [];

  constructor(deps?: DiscordClientDeps) {
    this.config = deps?.config ?? loadDiscordConfig();
    this.rateLimitConfig = deps?.rateLimitConfig ?? DEFAULT_RATE_LIMIT;
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });
  }

  async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.once("ready", () => {
        console.log(`Discord bot connected as ${this.client.user?.tag}`);
        resolve();
      });
      this.client.once("error", reject);
      this.client.login(this.config.botToken).catch(reject);
    });
  }

  async disconnect(): Promise<void> {
    this.client.destroy();
  }

  get isConnected(): boolean {
    return this.client.isReady();
  }

  async getGuild(): Promise<Guild> {
    this.checkRateLimit();
    const guild = this.client.guilds.cache.get(this.config.guildId);
    if (!guild) {
      throw new Error(`Guild ${this.config.guildId} not found. Is the bot added to this server?`);
    }
    return guild;
  }

  async getForumChannel(): Promise<ForumChannel> {
    this.checkRateLimit();
    const guild = await this.getGuild();
    const channel = guild.channels.cache.get(this.config.forumChannelId);
    if (!channel) {
      throw new Error(
        `Channel ${this.config.forumChannelId} not found in guild ${this.config.guildId}.`
      );
    }
    if (channel.type !== ChannelType.GuildForum) {
      throw new Error(
        `Channel ${this.config.forumChannelId} is not a Forum channel (type: ${channel.type}).`
      );
    }
    return channel as ForumChannel;
  }

  getConfig(): DiscordConfig {
    return this.config;
  }

  /** Expose underlying Client event listener for bot event handling */
  on(event: string, listener: (...args: unknown[]) => void): void {
    this.client.on(event, listener);
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const windowStart = now - this.rateLimitConfig.cooldownMs;
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > windowStart);
    if (this.requestTimestamps.length >= this.rateLimitConfig.maxRequestsPerMinute) {
      throw new Error(
        `Rate limit exceeded: ${this.rateLimitConfig.maxRequestsPerMinute} requests per ${this.rateLimitConfig.cooldownMs}ms. Try again later.`
      );
    }
    this.requestTimestamps.push(now);
  }
}

export function createDiscordClient(deps?: DiscordClientDeps): DiscordClient {
  return new DiscordClient(deps);
}
