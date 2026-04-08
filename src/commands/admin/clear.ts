import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Collection, Message, PermissionFlagsBits, TextChannel, User } from 'discord.js';

interface PurgeFilters {
	user?: User;
	bots: boolean;
	users: boolean;
	links: boolean;
	invites: boolean;
	embeds: boolean;
	images: boolean;
	files: boolean;
	mentions: boolean;
	pins: boolean;
	silent: boolean;
}

@ApplyOptions<Command.Options>({
	description: 'Delete messages quickly with optional filters',
	name: 'clear',
	fullCategory: ['Admin'],
	aliases: ['purge'],
	requiredUserPermissions: [PermissionFlagsBits.ManageMessages]
})
export class ClearCommand extends Command {
	private readonly linkRegex = /https?:\/\/[^\s]+/i;
	private readonly inviteRegex = /discord(?:\.gg|app\.com\/invite|\.com\/invite)\/[\w-]+/i;

	public override async messageRun(message: Message, args: any) {
		const rawArgs: string = await args.rest('string').catch(() => '');
		const parsed = this.parseArguments(rawArgs, message);

		if (!parsed.limit || parsed.limit < 1 || parsed.limit > 1000) {
			return message.reply('Please provide a number between 1 and 1000 for the number of messages to delete.');
		}

		const channel = message.channel as TextChannel;
		const filters = parsed.filters;

		// Delete the command message if silent mode
		if (filters.silent) {
			await message.delete().catch(() => null);
		}

		let deletedCount = 0;
		let remaining = parsed.limit;

		// Discord only allows fetching 100 messages at a time and bulk delete only works on messages < 14 days old
		while (remaining > 0) {
			const fetchLimit = Math.min(remaining + 10, 100); // Fetch a few extra to account for filtering
			const messages = await channel.messages.fetch({ limit: fetchLimit, before: message.id });

			if (messages.size === 0) break;

			let filtered = this.filterMessages(messages, filters);

			// Limit to remaining count
			if (filtered.size > remaining) {
				const filteredArray = [...filtered.values()].slice(0, remaining);
				filtered = new Collection(filteredArray.map((m) => [m.id, m]));
			}

			if (filtered.size === 0) break;

			try {
				const deleted = await channel.bulkDelete(filtered, true);
				deletedCount += deleted.size;
				remaining -= deleted.size;

				// If we deleted fewer than expected, we've likely hit the 14-day limit
				if (deleted.size < filtered.size) break;
			} catch (err) {
				console.error(err);
				if (!filters.silent) {
					return message.reply('There was an error trying to clear messages in this channel!');
				}
				break;
			}

			// Small delay to avoid rate limits
			if (remaining > 0) {
				await this.delay(1000);
			}
		}

		if (!filters.silent) {
			const reply = await channel.send(`Successfully deleted **${deletedCount}** message${deletedCount !== 1 ? 's' : ''}.`);
			setTimeout(() => reply.delete().catch(() => null), 5000);
		}
	}

	private parseArguments(rawArgs: string, message: Message): { limit: number | null; filters: PurgeFilters } {
		const parts = rawArgs.split(/\s+/).filter(Boolean);
		const filters: PurgeFilters = {
			bots: false,
			users: false,
			links: false,
			invites: false,
			embeds: false,
			images: false,
			files: false,
			mentions: false,
			pins: false,
			silent: false
		};

		let limit: number | null = null;

		for (const part of parts) {
			// Check if it's a number (limit)
			if (/^\d+$/.test(part)) {
				limit = parseInt(part, 10);
				continue;
			}

			// Check if it's a user mention
			const userMatch = part.match(/^<@!?(\d+)>$/);
			if (userMatch) {
				const user = message.mentions.users.get(userMatch[1]);
				if (user) filters.user = user;
				continue;
			}

			// Check for flags
			const flag = part.toLowerCase();
			switch (flag) {
				case '-bots':
					filters.bots = true;
					break;
				case '-users':
					filters.users = true;
					break;
				case '-links':
					filters.links = true;
					break;
				case '-invites':
					filters.invites = true;
					break;
				case '-embeds':
					filters.embeds = true;
					break;
				case '-images':
					filters.images = true;
					break;
				case '-files':
					filters.files = true;
					break;
				case '-mentions':
					filters.mentions = true;
					break;
				case '-pins':
					filters.pins = true;
					break;
				case '-silent':
					filters.silent = true;
					break;
			}
		}

		return { limit, filters };
	}

	private filterMessages(messages: Collection<string, Message>, filters: PurgeFilters): Collection<string, Message> {
		return messages.filter((msg) => {
			// By default, exclude pinned messages unless -pins flag is used
			if (msg.pinned && !filters.pins) return false;

			// If specific user filter
			if (filters.user && msg.author.id !== filters.user.id) return false;

			// If -bots flag, only include bot messages
			if (filters.bots && !msg.author.bot) return false;

			// If -users flag, only include non-bot messages
			if (filters.users && msg.author.bot) return false;

			// If -links flag, only include messages with links
			if (filters.links && !this.linkRegex.test(msg.content)) return false;

			// If -invites flag, only include messages with Discord invites
			if (filters.invites && !this.inviteRegex.test(msg.content)) return false;

			// If -embeds flag, only include messages with embeds
			if (filters.embeds && msg.embeds.length === 0) return false;

			// If -images flag, only include messages with image attachments
			if (filters.images) {
				const hasImage = msg.attachments.some(
					(att) => att.contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.name || '')
				);
				if (!hasImage) return false;
			}

			// If -files flag, only include messages with attachments
			if (filters.files && msg.attachments.size === 0) return false;

			// If -mentions flag, only include messages with mentions
			if (filters.mentions && msg.mentions.users.size === 0 && msg.mentions.roles.size === 0 && !msg.mentions.everyone) return false;

			return true;
		});
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
