import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Clears x amount of messages in the current channel',
	name: 'clear',
	fullCategory: ['Admin'],
	requiredUserPermissions: [PermissionFlagsBits.ManageMessages]
})
export class ClearCommand extends Command {
	public override async messageRun(message: any, args: any) {
		const amount = await args.pick('number').catch(() => null);
		if (!amount || amount < 1 || amount > 100) {
			return message.reply('Please provide a number between 1 and 100 for the number of messages to delete.');
		}
		await message.channel.bulkDelete(amount, true).catch((err: Error) => {
			console.error(err);
			message.reply('There was an error trying to clear messages in this channel!');
		});
	}
}
