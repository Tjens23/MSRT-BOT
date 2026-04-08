import { Listener } from '@sapphire/framework';
import { GuildEmoji } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class EmojiCreateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'emojiCreate'
		});
	}

	public async run(emoji: GuildEmoji): Promise<void> {
		if (!emoji.guild) return;

		await sendAuditLog({
			guild: emoji.guild,
			eventType: 'EMOJI_CREATE',
			title: 'Emoji Created',
			fields: [
				{ name: 'Emoji', value: `${emoji} \`:${emoji.name}:\``, inline: true },
				{ name: 'Animated', value: emoji.animated ? 'Yes' : 'No', inline: true },
				{ name: 'Created By', value: emoji.author?.tag || 'Unknown', inline: true }
			],
			thumbnail: emoji.url,
			footer: `Emoji ID: ${emoji.id}`
		});
	}
}
