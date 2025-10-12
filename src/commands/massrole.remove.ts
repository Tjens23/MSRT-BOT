import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'removes a role from all members with a specific role',
	requiredClientPermissions: ['ManageRoles'],
	name: 'massrole-remove',
	aliases: ['massroleremove', 'mrr']
})
export class MassRoleRemove extends Command {
	public override async messageRun(message: Message, args: Args) {
		if (args.finished) {
			return message.reply('❌ **Usage:** `massrole-remove <role-to-have> <role-to-remove>`\n\nExample: `massrole-remove @Member @Premium`');
		}

		const members = await message.guild!.members.fetch().catch((err: Error) => console.error(err.message, err.stack));

		const roleToHaveResult = await args.pickResult('role');
		if (roleToHaveResult.isErr()) {
			return message.reply(
				'❌ **Invalid first role.** Please provide a valid role that members should have.\n\n**Usage:** `massrole-remove <role-to-have> <role-to-remove>`'
			);
		}
		const roleToHave = roleToHaveResult.unwrap();

		const roleToRemoveResult = await args.pickResult('role');
		if (roleToRemoveResult.isErr()) {
			return message.reply(
				'❌ **Invalid second role.** Please provide a valid role to remove from members.\n\n**Usage:** `massrole-remove <role-to-have> <role-to-remove>`'
			);
		}
		const roleToRemove = roleToRemoveResult.unwrap();

		if (!members) {
			return message.reply('❌ **Error:** Could not fetch guild members.');
		}

		if (roleToHave.id === roleToRemove.id) {
			return message.reply('❌ **Error:** The role to have and the role to remove cannot be the same.');
		}

		if (roleToRemove.position >= message.guild!.members.me!.roles.highest.position) {
			return message.reply(
				`❌ **Error:** I cannot manage the role **${roleToRemove.name}** because it's higher than or equal to my highest role.`
			);
		}

		const membersWithRole = members.filter((member) => member.roles.cache.has(roleToHave.id));

		if (membersWithRole.size === 0) {
			return message.reply(`❌ **No members found** with the role **${roleToHave.name}**.`);
		}

		const promises = membersWithRole.map((member) =>
			member.roles.remove(roleToRemove).catch((err) => {
				console.error(`Failed to remove role ${roleToRemove.name} from ${member.user.tag}:`, err);
				return null;
			})
		);
		await Promise.allSettled(promises);
		return message.reply(
			`✅ **Success!** Removed the role **${roleToRemove.name}** from **${membersWithRole.size}** members who have the **${roleToHave.name}** role.`
		);
	}
}
