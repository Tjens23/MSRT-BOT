import { Listener } from '@sapphire/framework';
import { ThreadChannel } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class ThreadUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'threadUpdate'
		});
	}

	public async run(oldThread: ThreadChannel, newThread: ThreadChannel): Promise<void> {
		if (!newThread.guild) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		if (oldThread.name !== newThread.name) {
			changes.push({ name: 'Name', value: `${oldThread.name} → ${newThread.name}`, inline: true });
		}

		if (oldThread.archived !== newThread.archived) {
			changes.push({ name: 'Archived', value: newThread.archived ? 'Yes' : 'No', inline: true });
		}

		if (oldThread.locked !== newThread.locked) {
			changes.push({ name: 'Locked', value: newThread.locked ? 'Yes' : 'No', inline: true });
		}

		if (oldThread.rateLimitPerUser !== newThread.rateLimitPerUser) {
			changes.push({
				name: 'Slowmode',
				value: `${oldThread.rateLimitPerUser || 0}s → ${newThread.rateLimitPerUser || 0}s`,
				inline: true
			});
		}

		if (oldThread.autoArchiveDuration !== newThread.autoArchiveDuration) {
			changes.push({
				name: 'Auto Archive',
				value: `${(oldThread.autoArchiveDuration || 0) / 60}h → ${(newThread.autoArchiveDuration || 0) / 60}h`,
				inline: true
			});
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild: newThread.guild,
			eventType: 'THREAD_UPDATE',
			title: 'Thread Updated',
			fields: [
				{ name: 'Thread', value: `${newThread} (${newThread.name})`, inline: true },
				{ name: 'Parent Channel', value: newThread.parent?.name || 'Unknown', inline: true },
				...changes
			],
			footer: `Thread ID: ${newThread.id}`
		});
	}
}
