import { Listener } from '@sapphire/framework';
import { GuildBan } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class GuildBanAddListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildBanAdd'
		});
	}

	public async run(ban: GuildBan): Promise<void> {
		if (!ban.guild) return;

		await sendAuditLog({
			guild: ban.guild,
			eventType: 'MEMBER_BAN',
			title: 'Member Banned',
			description: `${ban.user.tag} was banned from the server.`,
			fields: [
				{ name: 'User', value: `${ban.user.tag}`, inline: true },
				{ name: 'ID', value: ban.user.id, inline: true },
				{ name: 'Reason', value: ban.reason || 'No reason provided', inline: false }
			],
			thumbnail: ban.user.displayAvatarURL(),
			footer: `User ID: ${ban.user.id}`
		});
	}
}
