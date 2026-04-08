import { Listener } from '@sapphire/framework';
import { ChannelType, DMChannel, GuildChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class ChannelDeleteListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'channelDelete'
		});
	}

	public async run(channel: DMChannel | GuildChannel): Promise<void> {
		if (channel.type === ChannelType.DM) return;

		const guildChannel = channel as GuildChannel;
		if (!guildChannel.guild) return;

		const channelTypes: Record<number, string> = {
			[ChannelType.GuildText]: 'Text',
			[ChannelType.GuildVoice]: 'Voice',
			[ChannelType.GuildCategory]: 'Category',
			[ChannelType.GuildAnnouncement]: 'Announcement',
			[ChannelType.GuildStageVoice]: 'Stage',
			[ChannelType.GuildForum]: 'Forum'
		};

		await sendAuditLog({
			guild: guildChannel.guild,
			eventType: 'CHANNEL_DELETE',
			title: 'Channel Deleted',
			fields: [
				{ name: 'Channel Name', value: guildChannel.name, inline: true },
				{ name: 'Type', value: channelTypes[guildChannel.type] || 'Unknown', inline: true },
				{ name: 'ID', value: guildChannel.id, inline: true },
				{ name: 'Category', value: guildChannel.parent?.name || 'None', inline: true }
			],
			footer: `Channel ID: ${guildChannel.id}`
		});
	}
}
