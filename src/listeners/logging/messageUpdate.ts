import { Listener } from '@sapphire/framework';
import { Message, PartialMessage, TextChannel } from 'discord.js';
import { sendAuditLog, truncateString } from '../../utils/auditLogger';

export class MessageUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'messageUpdate'
		});
	}

	public async run(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
		// Ignore DMs, bot messages, and embeds loading
		if (!newMessage.guild || newMessage.author?.bot) return;
		if (oldMessage.content === newMessage.content) return;

		const channel = newMessage.channel as TextChannel;

		await sendAuditLog({
			guild: newMessage.guild,
			eventType: 'MESSAGE_UPDATE',
			title: 'Message Edited',
			fields: [
				{ name: 'Author', value: newMessage.author?.tag || 'Unknown', inline: true },
				{ name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
				{ name: 'Jump to Message', value: `[Click Here](${newMessage.url})`, inline: true },
				{ name: 'Before', value: truncateString(oldMessage.content || 'Unknown'), inline: false },
				{ name: 'After', value: truncateString(newMessage.content || 'Unknown'), inline: false }
			],
			thumbnail: newMessage.author?.displayAvatarURL(),
			footer: `Message ID: ${newMessage.id} | Author ID: ${newMessage.author?.id || 'Unknown'}`
		});
	}
}
