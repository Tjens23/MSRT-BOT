import { Listener } from '@sapphire/framework';
import { Sticker } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class StickerUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'stickerUpdate'
		});
	}

	public async run(oldSticker: Sticker, newSticker: Sticker): Promise<void> {
		if (!newSticker.guild) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		if (oldSticker.name !== newSticker.name) {
			changes.push({ name: 'Name', value: `${oldSticker.name} → ${newSticker.name}`, inline: true });
		}

		if (oldSticker.description !== newSticker.description) {
			changes.push({
				name: 'Description',
				value: `${oldSticker.description || 'None'} → ${newSticker.description || 'None'}`,
				inline: false
			});
		}

		if (oldSticker.tags !== newSticker.tags) {
			changes.push({
				name: 'Tags',
				value: `${oldSticker.tags || 'None'} → ${newSticker.tags || 'None'}`,
				inline: true
			});
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild: newSticker.guild,
			eventType: 'STICKER_UPDATE',
			title: 'Sticker Updated',
			fields: [{ name: 'Sticker', value: newSticker.name, inline: true }, ...changes],
			thumbnail: newSticker.url,
			footer: `Sticker ID: ${newSticker.id}`
		});
	}
}
