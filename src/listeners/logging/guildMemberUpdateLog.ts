import { Listener } from '@sapphire/framework';
import { GuildMember, PartialGuildMember } from 'discord.js';
import { sendAuditLog, truncateString } from '../../utils/auditLogger';

export class GuildMemberUpdateLogListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildMemberUpdate'
		});
	}

	public async run(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
		if (!newMember.guild) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		// Nickname change
		if (oldMember.nickname !== newMember.nickname) {
			changes.push({
				name: 'Nickname',
				value: `${oldMember.nickname || 'None'} → ${newMember.nickname || 'None'}`,
				inline: true
			});
		}

		// Role changes
		const oldRoles = oldMember.roles?.cache || new Map();
		const newRoles = newMember.roles.cache;

		const addedRoles = newRoles.filter((role) => !oldRoles.has(role.id) && role.id !== newMember.guild.id);
		const removedRoles = oldRoles.filter((role) => !newRoles.has(role.id) && role.id !== newMember.guild.id);

		if (addedRoles.size > 0) {
			changes.push({
				name: 'Roles Added',
				value: truncateString(addedRoles.map((r) => r.name).join(', ')),
				inline: true
			});
		}

		if (removedRoles.size > 0) {
			changes.push({
				name: 'Roles Removed',
				value: truncateString(removedRoles.map((r) => r.name).join(', ')),
				inline: true
			});
		}

		// Timeout change
		if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
			if (newMember.communicationDisabledUntil) {
				changes.push({
					name: 'Timed Out Until',
					value: `<t:${Math.floor(newMember.communicationDisabledUntil.getTime() / 1000)}:F>`,
					inline: true
				});
			} else if (oldMember.communicationDisabledUntil) {
				changes.push({
					name: 'Timeout',
					value: 'Removed',
					inline: true
				});
			}
		}

		// Avatar change
		if (oldMember.avatar !== newMember.avatar) {
			changes.push({
				name: 'Server Avatar',
				value: newMember.avatar ? 'Updated' : 'Removed',
				inline: true
			});
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild: newMember.guild,
			eventType: 'MEMBER_UPDATE',
			title: 'Member Updated',
			description: `${newMember.user.tag}'s profile was updated.`,
			fields: [
				{ name: 'User', value: `${newMember} (${newMember.user.tag})`, inline: true },
				{ name: 'ID', value: newMember.id, inline: true },
				...changes
			],
			thumbnail: newMember.displayAvatarURL(),
			footer: `User ID: ${newMember.id}`
		});
	}
}
