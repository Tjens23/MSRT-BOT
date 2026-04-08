import { Listener } from '@sapphire/framework';
import { Role } from 'discord.js';
import { sendAuditLog } from '../../utils/auditLogger';

export class RoleDeleteListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'roleDelete'
		});
	}

	public async run(role: Role): Promise<void> {
		if (!role.guild) return;

		await sendAuditLog({
			guild: role.guild,
			eventType: 'ROLE_DELETE',
			title: 'Role Deleted',
			fields: [
				{ name: 'Role Name', value: role.name, inline: true },
				{ name: 'Color', value: role.hexColor, inline: true },
				{ name: 'Members', value: role.members.size.toString(), inline: true }
			],
			footer: `Role ID: ${role.id}`
		});
	}
}
