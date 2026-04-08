import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Unbans a user',
	name: 'unban',
	fullCategory: ['Moderation'],
	aliases: ['pardon']
})
export class UnbanCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		if (!message.guild) return message.reply('This command can only be used in a server.');

		const guild = message.guild;
		const user = await args.pick('user').catch(() => null);
		if (!user) return message.reply('Invalid usage! Please provide a user to unban.');

		const ban = await guild.bans.fetch(user.id).catch(() => null);
		if (!ban) return message.reply('This user is not banned.');

		await guild.bans
			.remove(user.id)
			.then(() => {
				message.reply(`${user.tag} has been unbanned from the server.`);
			})
			.catch(() => {
				message.reply('Failed to unban the user. Please check my permissions and try again.');
			});
	}
}
