import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandHandler } from "./command-handler.js";
import { commands } from "./commands/index.js";

function createMockInteraction(commandName: string, overrides?: Record<string, unknown>) {
  return {
    commandName,
    isChatInputCommand: vi.fn().mockReturnValue(true),
    reply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    replied: false,
    deferred: false,
    client: {
      uptime: 3661000,
      isReady: () => true,
      ws: { ping: 42 },
    },
    guild: { name: "Test Guild" },
    options: {
      getString: vi.fn(),
    },
    ...overrides,
  } as any;
}

function createMockDiscordClient() {
  return {
    getConfig: vi.fn().mockReturnValue({
      botToken: "test-token",
      guildId: "guild-123",
      forumChannelId: "channel-456",
    }),
    getForumChannel: vi.fn(),
    getGuild: vi.fn(),
  } as any;
}

describe("CommandHandler", () => {
  let handler: CommandHandler;
  let mockClient: ReturnType<typeof createMockDiscordClient>;

  beforeEach(() => {
    mockClient = createMockDiscordClient();
    handler = new CommandHandler(mockClient);
  });

  describe("handleInteraction", () => {
    it("routes /help to help command", async () => {
      const interaction = createMockInteraction("help");
      await handler.handleInteraction(interaction);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const call = interaction.reply.mock.calls[0][0];
      expect(call.ephemeral).toBe(true);
      expect(call.embeds).toHaveLength(1);
    });

    it("routes /networks to networks command", async () => {
      const interaction = createMockInteraction("networks");
      await handler.handleInteraction(interaction);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const call = interaction.reply.mock.calls[0][0];
      expect(call.ephemeral).toBe(true);
    });

    it("all command replies include ephemeral: true", async () => {
      for (const cmd of commands) {
        const interaction = createMockInteraction(cmd.data.name);
        await handler.handleInteraction(interaction);
        const call = interaction.reply.mock.calls[0][0];
        expect(call.ephemeral).toBe(true);
      }
    });

    it("unknown command returns error embed", async () => {
      const interaction = createMockInteraction("nonexistent");
      await handler.handleInteraction(interaction);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const call = interaction.reply.mock.calls[0][0];
      expect(call.ephemeral).toBe(true);
      expect(call.embeds[0].data.title).toBe("Unknown Command");
    });

    it("command execution error caught and replied with error message", async () => {
      // Add a command that throws
      handler.addCommand({
        data: { name: "broken", toJSON: () => ({}) } as any,
        execute: vi.fn().mockRejectedValue(new Error("kaboom")),
      });

      const interaction = createMockInteraction("broken");
      await handler.handleInteraction(interaction);

      expect(interaction.reply).toHaveBeenCalledOnce();
      const call = interaction.reply.mock.calls[0][0];
      expect(call.ephemeral).toBe(true);
      expect(call.embeds[0].data.title).toBe("Command Error");
    });

    it("uses followUp when interaction already replied", async () => {
      handler.addCommand({
        data: { name: "broken2", toJSON: () => ({}) } as any,
        execute: vi.fn().mockRejectedValue(new Error("kaboom")),
      });

      const interaction = createMockInteraction("broken2", { replied: true });
      await handler.handleInteraction(interaction);

      expect(interaction.followUp).toHaveBeenCalledOnce();
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it("ignores non-chat-input interactions", async () => {
      const interaction = {
        isChatInputCommand: vi.fn().mockReturnValue(false),
        reply: vi.fn(),
      } as any;

      await handler.handleInteraction(interaction);
      expect(interaction.reply).not.toHaveBeenCalled();
    });
  });

  describe("help command embed", () => {
    it("contains all command names", async () => {
      const interaction = createMockInteraction("help");
      await handler.handleInteraction(interaction);

      const embed = interaction.reply.mock.calls[0][0].embeds[0];
      const fields = embed.data.fields ?? [];
      const fieldNames = fields.map((f: any) => f.name);

      expect(fieldNames).toContain("/help");
      expect(fieldNames).toContain("/status");
      expect(fieldNames).toContain("/links");
      expect(fieldNames).toContain("/networks");
    });
  });

  describe("links command embed", () => {
    it("contains documentation URL", async () => {
      const interaction = createMockInteraction("links");
      await handler.handleInteraction(interaction);

      const embed = interaction.reply.mock.calls[0][0].embeds[0];
      const fields = embed.data.fields ?? [];
      const allValues = fields.map((f: any) => f.value).join(" ");

      expect(allValues).toContain("https://js.midl.xyz/docs");
    });
  });

  describe("networks command embed", () => {
    it("has fields for each network", async () => {
      const interaction = createMockInteraction("networks");
      await handler.handleInteraction(interaction);

      const embed = interaction.reply.mock.calls[0][0].embeds[0];
      const fields = embed.data.fields ?? [];

      expect(fields.length).toBeGreaterThanOrEqual(3);
      const fieldNames = fields.map((f: any) => f.name).join(" ");
      expect(fieldNames).toContain("Mainnet");
      expect(fieldNames).toContain("Testnet");
      expect(fieldNames).toContain("Devnet");
    });
  });
});
