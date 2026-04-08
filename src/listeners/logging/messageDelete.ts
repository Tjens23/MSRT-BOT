import { Listener } from '@sapphire/framework';
import { Message, PartialMessage, TextChannel } from 'discord.js';
import { sendAuditLog, truncateString } from '../../utils/auditLogger';

export class MessageDeleteListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'messageDelete'
		});
	}

	public async run(message: Message | PartialMessage): Promise<void> {
		// Ignore DMs and bot messages
		if (!message.guild || message.author?.bot) return;

		const channel = message.channel as TextChannel;
		const content = message.content || 'No content (embed or attachment)';
		const attachments = message.attachments?.size ? message.attachments.map((a) => a.name).join(', ') : 'None';

		await sendAuditLog({
			guild: message.guild,
			eventType: 'MESSAGE_DELETE',
			title: 'Message Deleted',
			fields: [
				{ name: 'Author', value: message.author?.tag || 'Unknown', inline: true },
				{ name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
				{ name: 'Content', value: truncateString(content), inline: false },
				{ name: 'Attachments', value: truncateString(attachments), inline: true }
			],
			thumbnail: message.author?.displayAvatarURL(),
			footer: `Message ID: ${message.id} | Author ID: ${message.author?.id || 'Unknown'}`
		});
	}
}
