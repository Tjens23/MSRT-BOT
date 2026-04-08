import { Listener } from '@sapphire/framework';
import { Sticker } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class StickerDeleteListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'stickerDelete'
		});
	}

	public async run(sticker: Sticker): Promise<void> {
		if (!sticker.guild) return;

		await sendAuditLog({
			guild: sticker.guild,
			eventType: 'STICKER_DELETE',
			title: 'Sticker Deleted',
			fields: [
				{ name: 'Name', value: sticker.name, inline: true },
				{ name: 'Description', value: sticker.description || 'None', inline: true }
			],
			thumbnail: sticker.url,
			footer: `Sticker ID: ${sticker.id}`
		});
	}
}
