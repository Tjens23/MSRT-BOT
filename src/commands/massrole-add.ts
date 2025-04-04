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
		const members = await message.guild!.members.fetch().catch((err: Error) => console.error(err.message, err.stack));
		const roleToHave = await args.pick('role');
		const roleToAdd = await args.pick('role');
		if (!members || !roleToHave || !roleToAdd) return message.reply(`usage is \INvalkid\``);
		const membersWithRole = members.filter((member) => member.roles.cache.has(roleToHave.id));
		membersWithRole.forEach((member) => member.roles.add(roleToAdd));
		return message.reply(`Added ${roleToAdd.name} to ${membersWithRole.size} members`);
	}
}
