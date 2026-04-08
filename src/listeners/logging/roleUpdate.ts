import { Listener } from '@sapphire/framework';
import { Role } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class RoleUpdateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'roleUpdate'
		});
	}

	public async run(oldRole: Role, newRole: Role): Promise<void> {
		if (!newRole.guild) return;

		const changes: Array<{ name: string; value: string; inline?: boolean }> = [];

		if (oldRole.name !== newRole.name) {
			changes.push({ name: 'Name', value: `${oldRole.name} → ${newRole.name}`, inline: true });
		}

		if (oldRole.hexColor !== newRole.hexColor) {
			changes.push({ name: 'Color', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: true });
		}

		if (oldRole.hoist !== newRole.hoist) {
			changes.push({ name: 'Hoisted', value: `${oldRole.hoist ? 'Yes' : 'No'} → ${newRole.hoist ? 'Yes' : 'No'}`, inline: true });
		}

		if (oldRole.mentionable !== newRole.mentionable) {
			changes.push({
				name: 'Mentionable',
				value: `${oldRole.mentionable ? 'Yes' : 'No'} → ${newRole.mentionable ? 'Yes' : 'No'}`,
				inline: true
			});
		}

		if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
			changes.push({ name: 'Permissions', value: 'Modified', inline: true });
		}

		if (oldRole.position !== newRole.position) {
			changes.push({ name: 'Position', value: `${oldRole.position} → ${newRole.position}`, inline: true });
		}

		if (changes.length === 0) return;

		await sendAuditLog({
			guild: newRole.guild,
			eventType: 'ROLE_UPDATE',
			title: 'Role Updated',
			fields: [
				{ name: 'Role', value: `${newRole} (${newRole.name})`, inline: true },
				{ name: '\u200b', value: '\u200b', inline: true },
				...changes
			],
			footer: `Role ID: ${newRole.id}`
		});
	}
}
