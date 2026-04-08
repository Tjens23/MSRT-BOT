import { Listener } from '@sapphire/framework';
import { ThreadChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class ThreadDeleteListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'threadDelete'
		});
	}

	public async run(thread: ThreadChannel): Promise<void> {
		if (!thread.guild) return;

		await sendAuditLog({
			guild: thread.guild,
			eventType: 'THREAD_DELETE',
			title: 'Thread Deleted',
			fields: [
				{ name: 'Thread Name', value: thread.name, inline: true },
				{ name: 'Parent Channel', value: thread.parent?.name || 'Unknown', inline: true },
				{ name: 'Owner', value: thread.ownerId ? `<@${thread.ownerId}>` : 'Unknown', inline: true }
			],
			footer: `Thread ID: ${thread.id}`
		});
	}
}
