import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Kicks a user from the voice channel',
	name: 'voicekick',
	fullCategory: ['Moderation'],
	aliases: ['vckick', 'vkick'],
	requiredUserPermissions: [PermissionFlagsBits.MoveMembers]
})
export class VoiceKickCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const reason = await args.rest('string').catch(() => 'No reason provided');
		const user = await args.pick('member').catch(() => null);
		if (!user) return message.reply('Invalid usage! Please provide a user to voice kick.');
		if (user.roles.highest.position >= message.member!.roles.highest.position)
			return message.reply('You cannot voice kick this user because they have a higher or equal role than you.');
		if (!user.voice.channel) return message.reply('This user is not in a voice channel.');

		await user.voice
			.disconnect()
			.then(() => {
				message.reply(`${user.user.tag} has been kicked from the voice channel. Reason: ${reason}`);
			})
			.catch(() => {
				message.reply('Failed to kick the user from the voice channel. Please check my permissions and try again.');
			});
	}
}
