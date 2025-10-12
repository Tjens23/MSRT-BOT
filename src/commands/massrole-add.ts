import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Add a role to all members with a specific role',
	name: 'massrole-add',
	requiredClientPermissions: ['ManageRoles'],
	aliases: ['massroleadd', 'mra']
})
export class MassRoleAdd extends Command {
	public override async messageRun(message: Message, args: Args) {
		if (args.finished) {
			return message.reply('❌ **Usage:** `massrole-add <role-to-have> <role-to-add>`\n\nExample: `massrole-add @Member @Premium`');
		}

		const members = await message.guild!.members.fetch().catch((err: Error) => console.error(err.message, err.stack));

		const roleToHaveResult = await args.pickResult('role');
		if (roleToHaveResult.isErr()) {
			return message.reply(
				'❌ **Invalid first role.** Please provide a valid role that members should have.\n\n**Usage:** `massrole-add <role-to-have> <role-to-add>`'
			);
		}
		const roleToHave = roleToHaveResult.unwrap();

		const roleToAddResult = await args.pickResult('role');
		if (roleToAddResult.isErr()) {
			return message.reply(
				'❌ **Invalid second role.** Please provide a valid role to add to members.\n\n**Usage:** `massrole-add <role-to-have> <role-to-add>`'
			);
		}
		const roleToAdd = roleToAddResult.unwrap();

		if (!members) {
			return message.reply('❌ **Error:** Could not fetch guild members.');
		}

		if (roleToHave.id === roleToAdd.id) {
			return message.reply('❌ **Error:** The role to have and the role to add cannot be the same.');
		}

		if (roleToAdd.position >= message.guild!.members.me!.roles.highest.position) {
			return message.reply(
				`❌ **Error:** I cannot manage the role **${roleToAdd.name}** because it's higher than or equal to my highest role.`
			);
		}

		const membersWithRole = members.filter((member) => member.roles.cache.has(roleToHave.id));

		if (membersWithRole.size === 0) {
			return message.reply(`❌ **No members found** with the role **${roleToHave.name}**.`);
		}

		const promises = membersWithRole.map((member) =>
			member.roles.add(roleToAdd).catch((err) => {
				console.error(`Failed to add role ${roleToAdd.name} to ${member.user.tag}:`, err);
				return null;
			})
		);

		await Promise.allSettled(promises);

		return message.reply(
			`✅ **Success!** Added the role **${roleToAdd.name}** to **${membersWithRole.size}** members who have the **${roleToHave.name}** role.`
		);
	}
}
