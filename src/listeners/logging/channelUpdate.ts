import { Listener } from '@sapphire/framework';
import { ChannelType, DMChannel, GuildChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class ChannelUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'channelUpdate'
		});
	}

	public async run(oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel): Promise<void> {
		if (oldChannel.type === ChannelType.DM || newChannel.type === ChannelType.DM) return;

		const oldGuildChannel = oldChannel as GuildChannel;
		const newGuildChannel = newChannel as GuildChannel;
		if (!newGuildChannel.guild) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		if (oldGuildChannel.name !== newGuildChannel.name) {
			changes.push({ name: 'Name', value: `${oldGuildChannel.name} → ${newGuildChannel.name}`, inline: true });
		}

		if (oldGuildChannel.parentId !== newGuildChannel.parentId) {
			changes.push({
				name: 'Category',
				value: `${oldGuildChannel.parent?.name || 'None'} → ${newGuildChannel.parent?.name || 'None'}`,
				inline: true
			});
		}

		if (oldGuildChannel.position !== newGuildChannel.position) {
			changes.push({
				name: 'Position',
				value: `${oldGuildChannel.position} → ${newGuildChannel.position}`,
				inline: true
			});
		}

		// Check for text channel specific changes
		if (oldGuildChannel.type === ChannelType.GuildText && newGuildChannel.type === ChannelType.GuildText) {
			const oldText = oldGuildChannel as any;
			const newText = newGuildChannel as any;

			if (oldText.topic !== newText.topic) {
				changes.push({
					name: 'Topic',
					value: `${oldText.topic || 'None'} → ${newText.topic || 'None'}`,
					inline: false
				});
			}

			if (oldText.nsfw !== newText.nsfw) {
				changes.push({ name: 'NSFW', value: `${oldText.nsfw} → ${newText.nsfw}`, inline: true });
			}

			if (oldText.rateLimitPerUser !== newText.rateLimitPerUser) {
				changes.push({
					name: 'Slowmode',
					value: `${oldText.rateLimitPerUser}s → ${newText.rateLimitPerUser}s`,
					inline: true
				});
			}
		}

		if (changes.length === 0) return;

		changes.unshift({ name: 'Channel', value: `${newGuildChannel} (${newGuildChannel.name})`, inline: true });

		await sendAuditLog({
			guild: newGuildChannel.guild,
			eventType: 'CHANNEL_UPDATE',
			title: 'Channel Updated',
			fields: changes,
			footer: `Channel ID: ${newGuildChannel.id}`
		});
	}
}
