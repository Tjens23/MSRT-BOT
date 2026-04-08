import { Listener } from '@sapphire/framework';
import { GuildBan } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class GuildBanRemoveListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildBanRemove'
		});
	}

	public async run(ban: GuildBan): Promise<void> {
		if (!ban.guild) return;

		await sendAuditLog({
			guild: ban.guild,
			eventType: 'MEMBER_UNBAN',
			title: 'Member Unbanned',
			description: `${ban.user.tag} was unbanned from the server.`,
			fields: [
				{ name: 'User', value: `${ban.user.tag}`, inline: true },
				{ name: 'ID', value: ban.user.id, inline: true }
			],
			thumbnail: ban.user.displayAvatarURL(),
			footer: `User ID: ${ban.user.id}`
		});
	}
}
