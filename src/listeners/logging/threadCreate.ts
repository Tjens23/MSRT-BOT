import { Listener } from '@sapphire/framework';
import { ThreadChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class ThreadCreateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'threadCreate'
		});
	}

	public async run(thread: ThreadChannel, newlyCreated: boolean): Promise<void> {
		if (!thread.guild || !newlyCreated) return;

		await sendAuditLog({
			guild: thread.guild,
			eventType: 'THREAD_CREATE',
			title: 'Thread Created',
			fields: [
				{ name: 'Thread', value: `${thread} (${thread.name})`, inline: true },
				{ name: 'Parent Channel', value: thread.parent?.name || 'Unknown', inline: true },
				{ name: 'Owner', value: thread.ownerId ? `<@${thread.ownerId}>` : 'Unknown', inline: true },
				{ name: 'Auto Archive', value: `${(thread.autoArchiveDuration || 0) / 60} hours`, inline: true }
			],
			footer: `Thread ID: ${thread.id}`
		});
	}
}
