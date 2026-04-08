import { Listener } from '@sapphire/framework';
import { ForumChannel, NewsChannel, TextChannel, VoiceChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class WebhookUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'webhookUpdate'
		});
	}

	public async run(channel: TextChannel | NewsChannel | VoiceChannel | ForumChannel): Promise<void> {
		if (!channel.guild) return;

		await sendAuditLog({
			guild: channel.guild,
			eventType: 'WEBHOOK_UPDATE',
			title: 'Webhook Updated',
			description: `Webhooks in ${channel} were modified.`,
			fields: [
				{ name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
				{ name: 'Channel ID', value: channel.id, inline: true }
			],
			footer: `Channel ID: ${channel.id}`
		});
	}
}
