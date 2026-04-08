import { Listener } from '@sapphire/framework';
import { GuildEmoji } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class EmojiUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'emojiUpdate'
		});
	}

	public async run(oldEmoji: GuildEmoji, newEmoji: GuildEmoji): Promise<void> {
		if (!newEmoji.guild) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		if (oldEmoji.name !== newEmoji.name) {
			changes.push({ name: 'Name', value: `:${oldEmoji.name}: → :${newEmoji.name}:`, inline: true });
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild: newEmoji.guild,
			eventType: 'EMOJI_UPDATE',
			title: 'Emoji Updated',
			fields: [{ name: 'Emoji', value: `${newEmoji}`, inline: true }, ...changes],
			thumbnail: newEmoji.url,
			footer: `Emoji ID: ${newEmoji.id}`
		});
	}
}
