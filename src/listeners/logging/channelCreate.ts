import { Listener } from '@sapphire/framework';
import { ChannelType, GuildChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class ChannelCreateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'channelCreate'
		});
	}

	public async run(channel: GuildChannel): Promise<void> {
		if (!channel.guild) return;

		const channelTypes: Record<number, string> = {
			[ChannelType.GuildText]: 'Text',
			[ChannelType.GuildVoice]: 'Voice',
			[ChannelType.GuildCategory]: 'Category',
			[ChannelType.GuildAnnouncement]: 'Announcement',
			[ChannelType.GuildStageVoice]: 'Stage',
			[ChannelType.GuildForum]: 'Forum'
		};

		await sendAuditLog({
			guild: channel.guild,
			eventType: 'CHANNEL_CREATE',
			title: 'Channel Created',
			fields: [
				{ name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
				{ name: 'Type', value: channelTypes[channel.type] || 'Unknown', inline: true },
				{ name: 'ID', value: channel.id, inline: true },
				{ name: 'Category', value: channel.parent?.name || 'None', inline: true }
			],
			footer: `Channel ID: ${channel.id}`
		});
	}
}
