import { Listener } from '@sapphire/framework';
import { Collection, Message, PartialMessage, Snowflake, TextChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class MessageDeleteBulkListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'messageDeleteBulk'
		});
	}

	public async run(messages: Collection<Snowflake, Message | PartialMessage>, channel: TextChannel): Promise<void> {
		if (!channel.guild) return;

		const authors = [...new Set(messages.map((m) => m.author?.tag || 'Unknown'))];
		const authorsStr = authors.slice(0, 10).join(', ') + (authors.length > 10 ? ` and ${authors.length - 10} more` : '');

		await sendAuditLog({
			guild: channel.guild,
			eventType: 'MESSAGE_BULK_DELETE',
			title: 'Bulk Message Delete',
			description: `${messages.size} messages were deleted in ${channel}.`,
			fields: [
				{ name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
				{ name: 'Message Count', value: messages.size.toString(), inline: true },
				{ name: 'Authors', value: authorsStr || 'Unknown', inline: false }
			],
			footer: `Channel ID: ${channel.id}`
		});
	}
}
