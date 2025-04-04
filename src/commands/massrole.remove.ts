import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'removes a role from all members with a specific role',
	requiredClientPermissions: ['ManageRoles'],
	name: 'massrole-remove',
	aliases: ['massroleremove', 'mrr']
})
export class MassRoleAdd extends Command {
	public override async messageRun(message: Message, args: Args) {
		const members = await message.guild!.members.fetch().catch((err: Error) => console.error(err.message, err.stack));
		const roleToHave = await args.pick('role');
		const roleToAdd = await args.pick('role');
		if (!members || !roleToHave || !roleToAdd) return message.reply(`usage is \INvalkid\``);
		const membersWithRole = members.filter((member) => member.roles.cache.has(roleToHave.id));
		membersWithRole.forEach((member) => member.roles.remove(roleToAdd));
		return message.reply(`Removed ${roleToAdd.name} from ${membersWithRole.size} members`);
	}
}
