import { Listener } from '@sapphire/framework';
import { Role } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class RoleCreateListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'roleCreate'
		});
	}

	public async run(role: Role): Promise<void> {
		if (!role.guild) return;

		await sendAuditLog({
			guild: role.guild,
			eventType: 'ROLE_CREATE',
			title: 'Role Created',
			fields: [
				{ name: 'Role', value: `${role} (${role.name})`, inline: true },
				{ name: 'Color', value: role.hexColor, inline: true },
				{ name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
				{ name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
				{ name: 'Position', value: role.position.toString(), inline: true }
			],
			footer: `Role ID: ${role.id}`
		});
	}
}
