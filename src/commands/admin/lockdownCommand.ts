import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, Message, PermissionFlagsBits, PermissionOverwriteOptions, Role, TextChannel } from 'discord.js';

// Store active lockdowns to track state
const activeLockdowns = new Map<string, { timeout?: NodeJS.Timeout; originalPerms?: Map<string, boolean | null> }>();

@ApplyOptions<Command.Options>({
	description: 'Lockdown a channel or the whole server',
	name: 'lock-down',
	fullCategory: ['Admin'],
	aliases: ['lockdown', 'unlock'],
	requiredUserPermissions: [PermissionFlagsBits.ManageChannels]
})
export class LockdownCommand extends Command {
	public override async messageRun(message: Message, args: any) {
		const rawArgs: string = await args.rest('string').catch(() => '');
		const parts = rawArgs.split(/\s+/).filter(Boolean);

		// Check if command was invoked as 'unlock'
		const commandName = message.content.trim().split(/\s+/)[0].toLowerCase();
		const isUnlockCommand = commandName.includes('unlock');

		// Handle 'unlock' with no args - unlock current channel
		if (isUnlockCommand && parts.length === 0) {
			const channel = message.channel as TextChannel;
			const lockdownKey = `channel-${channel.id}`;
			if (activeLockdowns.has(lockdownKey)) {
				return this.unlockChannel(message, channel, lockdownKey);
			}
			return message.reply('This channel is not locked down.');
		}

		// Handle 'lockdown off' or 'unlock' for current channel
		if (parts[0]?.toLowerCase() === 'off') {
			const channel = message.channel as TextChannel;
			const lockdownKey = `channel-${channel.id}`;
			if (activeLockdowns.has(lockdownKey)) {
				return this.unlockChannel(message, channel, lockdownKey);
			}
			return message.reply('This channel is not locked down.');
		}

		if (parts.length === 0) {
			return message.reply(
				'**Usage:** `lock-down [channel | server] [duration]`\n' +
					'**Examples:**\n' +
					'• `lockdown #general 20s` - Lock channel for 20 seconds\n' +
					'• `lockdown #general` - Lock channel until unlocked\n' +
					'• `lockdown server` - Lock entire server\n' +
					'• `lockdown off` - Unlock current channel\n' +
					'• `unlock` - Unlock current channel\n' +
					'• `unlock #general` - Unlock specific channel\n' +
					'• `lockdown server off` - Unlock entire server'
			);
		}

		const isServerLockdown = parts[0].toLowerCase() === 'server';
		let targetChannel: TextChannel | null = null;
		let duration: number | null = null;

		if (isServerLockdown) {
			// Check for 'server off' to unlock
			if (parts[1]?.toLowerCase() === 'off' || isUnlockCommand) {
				const lockdownKey = `server-${message.guild?.id}`;
				if (activeLockdowns.has(lockdownKey)) {
					return this.unlockServer(message, lockdownKey);
				}
				return message.reply('The server is not locked down.');
			}

			// Server lockdown
			if (parts[1]) {
				duration = this.parseDuration(parts[1]);
			}
			return this.handleServerLockdown(message, duration);
		} else {
			// Channel lockdown
			const channelMention = parts[0];
			const channelMatch = channelMention.match(/^<#(\d+)>$/);

			if (channelMatch) {
				targetChannel = message.guild?.channels.cache.get(channelMatch[1]) as TextChannel;
			} else {
				// Try to find channel by name
				targetChannel = message.guild?.channels.cache.find(
					(c) => c.name.toLowerCase() === channelMention.toLowerCase() && c.type === ChannelType.GuildText
				) as TextChannel;
			}

			if (!targetChannel) {
				return message.reply('Could not find the specified channel. Please mention a valid text channel.');
			}

			// Check for 'unlock #channel' or '#channel off'
			if (isUnlockCommand || parts[1]?.toLowerCase() === 'off') {
				const lockdownKey = `channel-${targetChannel.id}`;
				if (activeLockdowns.has(lockdownKey)) {
					return this.unlockChannel(message, targetChannel, lockdownKey);
				}
				return message.reply(`**${targetChannel}** is not locked down.`);
			}

			if (parts[1]) {
				duration = this.parseDuration(parts[1]);
			}

			return this.handleChannelLockdown(message, targetChannel, duration);
		}
	}

	private async handleChannelLockdown(message: Message, channel: TextChannel, duration: number | null) {
		const lockdownKey = `channel-${channel.id}`;
		const existingLockdown = activeLockdowns.get(lockdownKey);

		// Toggle lockdown if already active
		if (existingLockdown) {
			return this.unlockChannel(message, channel, lockdownKey);
		}

		// Get the @everyone role
		const everyoneRole = message.guild?.roles.everyone;
		if (!everyoneRole) {
			return message.reply('Could not find the @everyone role.');
		}

		// Store original permissions
		const originalPerms = new Map<string, boolean | null>();
		const existingOverwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);
		originalPerms.set(everyoneRole.id, existingOverwrite?.allow.has(PermissionFlagsBits.SendMessages) ?? null);

		try {
			// Deny SendMessages for @everyone
			await channel.permissionOverwrites.edit(everyoneRole, {
				SendMessages: false
			});

			const lockdownData: { timeout?: NodeJS.Timeout; originalPerms: Map<string, boolean | null> } = { originalPerms };

			// Set timeout if duration provided
			if (duration) {
				lockdownData.timeout = setTimeout(() => {
					this.unlockChannel(message, channel, lockdownKey, true);
				}, duration);
			}

			activeLockdowns.set(lockdownKey, lockdownData);

			const durationText = duration ? ` for **${this.formatDuration(duration)}**` : ' until unlocked';
			await message.reply(`🔒 **${channel}** has been locked down${durationText}. Use the command again to unlock.`);
		} catch (error) {
			console.error('Failed to lockdown channel:', error);
			return message.reply('Failed to lockdown the channel. Make sure I have the required permissions.');
		}
	}

	private async unlockChannel(message: Message, channel: TextChannel, lockdownKey: string, auto = false) {
		const lockdownData = activeLockdowns.get(lockdownKey);

		if (lockdownData?.timeout) {
			clearTimeout(lockdownData.timeout);
		}

		const everyoneRole = message.guild?.roles.everyone;
		if (!everyoneRole) return;

		try {
			// Restore original permissions (remove the deny)
			const originalPerm = lockdownData?.originalPerms?.get(everyoneRole.id);

			if (originalPerm === null || originalPerm === undefined) {
				// Remove the override entirely if there wasn't one before
				await channel.permissionOverwrites.edit(everyoneRole, {
					SendMessages: null
				} as PermissionOverwriteOptions);
			} else {
				await channel.permissionOverwrites.edit(everyoneRole, {
					SendMessages: originalPerm
				});
			}

			activeLockdowns.delete(lockdownKey);

			const unlockMessage = auto ? `🔓 **${channel}** lockdown has expired and is now unlocked.` : `🔓 **${channel}** has been unlocked.`;

			await channel.send(unlockMessage);
		} catch (error) {
			console.error('Failed to unlock channel:', error);
		}
	}

	private async handleServerLockdown(message: Message, duration: number | null) {
		const lockdownKey = `server-${message.guild?.id}`;
		const existingLockdown = activeLockdowns.get(lockdownKey);

		// Toggle lockdown if already active
		if (existingLockdown) {
			return this.unlockServer(message, lockdownKey);
		}

		const guild = message.guild;
		if (!guild) return;

		// Find the first role that allows SendMessages (usually @everyone or a member role)
		const targetRole = this.findFirstSendMessagesRole(guild.roles.cache);

		if (!targetRole) {
			return message.reply('Could not find a role with SendMessages permission to lock down.');
		}

		// Store original permissions for all text channels
		const originalPerms = new Map<string, boolean | null>();

		try {
			// Lock down all text channels
			const textChannels = guild.channels.cache.filter((c): c is TextChannel => c.type === ChannelType.GuildText);

			for (const [, channel] of textChannels) {
				// Skip channels where the role already doesn't have SendMessages explicitly set
				const existingOverwrite = channel.permissionOverwrites.cache.get(targetRole.id);
				const hasExplicitAllow = existingOverwrite?.allow.has(PermissionFlagsBits.SendMessages);

				// Only modify channels where the override doesn't explicitly deny
				if (existingOverwrite?.deny.has(PermissionFlagsBits.SendMessages)) {
					continue; // Already denied, skip
				}

				originalPerms.set(channel.id, hasExplicitAllow ?? null);

				await channel.permissionOverwrites.edit(targetRole, {
					SendMessages: false
				});
			}

			const lockdownData: { timeout?: NodeJS.Timeout; originalPerms: Map<string, boolean | null>; roleId: string } = {
				originalPerms,
				roleId: targetRole.id
			};

			// Set timeout if duration provided
			if (duration) {
				lockdownData.timeout = setTimeout(() => {
					this.unlockServer(message, lockdownKey, true);
				}, duration) as NodeJS.Timeout;
			}

			activeLockdowns.set(lockdownKey, lockdownData);

			const durationText = duration ? ` for **${this.formatDuration(duration)}**` : ' until unlocked';
			await message.reply(
				`🔒 **Server lockdown activated**${durationText}.\n` +
					`Locked ${originalPerms.size} channels by denying SendMessages for **${targetRole.name}**.`
			);
		} catch (error) {
			console.error('Failed to lockdown server:', error);
			return message.reply('Failed to lockdown the server. Make sure I have the required permissions.');
		}
	}

	private async unlockServer(message: Message, lockdownKey: string, auto = false) {
		const lockdownData = activeLockdowns.get(lockdownKey) as
			| { timeout?: NodeJS.Timeout; originalPerms: Map<string, boolean | null>; roleId: string }
			| undefined;

		if (!lockdownData) return;

		if (lockdownData.timeout) {
			clearTimeout(lockdownData.timeout);
		}

		const guild = message.guild;
		if (!guild) return;

		const targetRole = guild.roles.cache.get(lockdownData.roleId);
		if (!targetRole) return;

		try {
			let unlockedCount = 0;

			for (const [channelId, originalPerm] of lockdownData.originalPerms) {
				const channel = guild.channels.cache.get(channelId) as TextChannel;
				if (!channel) continue;

				if (originalPerm === null || originalPerm === undefined) {
					await channel.permissionOverwrites.edit(targetRole, {
						SendMessages: null
					} as PermissionOverwriteOptions);
				} else {
					await channel.permissionOverwrites.edit(targetRole, {
						SendMessages: originalPerm
					});
				}
				unlockedCount++;
			}

			activeLockdowns.delete(lockdownKey);

			const unlockMessage = auto
				? `🔓 **Server lockdown has expired.** ${unlockedCount} channels unlocked.`
				: `🔓 **Server unlocked.** ${unlockedCount} channels restored.`;

			await message.reply(unlockMessage);
		} catch (error) {
			console.error('Failed to unlock server:', error);
		}
	}

	private findFirstSendMessagesRole(roles: Map<string, Role>): Role | undefined {
		// Sort roles by position (lowest first) and find the first one that allows SendMessages
		const sortedRoles = [...roles.values()].sort((a, b) => a.position - b.position);

		for (const role of sortedRoles) {
			if (role.permissions.has(PermissionFlagsBits.SendMessages)) {
				return role;
			}
		}

		return undefined;
	}

	private parseDuration(input: string): number | null {
		const match = input.match(/^(\d+)(s|m|h|d)?$/i);
		if (!match) return null;

		const value = parseInt(match[1], 10);
		const unit = (match[2] || 's').toLowerCase();

		const multipliers: Record<string, number> = {
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000
		};

		return value * (multipliers[unit] || 1000);
	}

	private formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
		if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
		if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
		return `${seconds} second${seconds !== 1 ? 's' : ''}`;
	}
}
