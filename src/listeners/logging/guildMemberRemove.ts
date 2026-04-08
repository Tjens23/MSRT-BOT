import { Listener } from '@sapphire/framework';
import { GuildMember, PartialGuildMember } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class GuildMemberRemoveListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildMemberRemove'
		});
	}

	public async run(member: GuildMember | PartialGuildMember): Promise<void> {
		if (!member.guild) return;

		const roles = member.roles?.cache
			.filter((r) => r.id !== member.guild.id)
			.map((r) => r.name)
			.join(', ');

		const joinedAt = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown';

		await sendAuditLog({
			guild: member.guild,
			eventType: 'MEMBER_LEAVE',
			title: 'Member Left',
			description: `${member.user?.tag || 'Unknown'} has left the server.`,
			fields: [
				{ name: 'User', value: `${member.user?.tag || 'Unknown'}`, inline: true },
				{ name: 'ID', value: member.id, inline: true },
				{ name: 'Joined', value: joinedAt, inline: true },
				{ name: 'Roles', value: roles || 'None', inline: false }
			],
			thumbnail: member.user?.displayAvatarURL() || undefined,
			footer: `User ID: ${member.id}`
		});
	}
}
