import { Listener } from '@sapphire/framework';
import { GuildEmoji } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class EmojiDeleteListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'emojiDelete'
		});
	}

	public async run(emoji: GuildEmoji): Promise<void> {
		if (!emoji.guild) return;

		await sendAuditLog({
			guild: emoji.guild,
			eventType: 'EMOJI_DELETE',
			title: 'Emoji Deleted',
			fields: [
				{ name: 'Emoji Name', value: `:${emoji.name}:`, inline: true },
				{ name: 'Animated', value: emoji.animated ? 'Yes' : 'No', inline: true }
			],
			thumbnail: emoji.url,
			footer: `Emoji ID: ${emoji.id}`
		});
	}
}
