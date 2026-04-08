import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Kicks a user from the server',
	name: 'kick',
	fullCategory: ['Moderation'],
	aliases: ['boot'],
	requiredUserPermissions: [PermissionFlagsBits.KickMembers]
})
export class KickCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const user = await args.pick('member').catch(() => null);
		const reason = await args.rest('string').catch(() => 'No reason provided');
		if (!user) return message.reply('Invalid usage! Please provide a user to kick.');
		if (user.roles.highest.position >= message.member!.roles.highest.position)
			return message.reply('You cannot kick this user because they have a higher or equal role than you.');

		await user.kick(reason).then((usr) => {
			const embed = new EmbedBuilder()
				.setDescription(`${usr.user.tag}, You have been kicked from ${message.guild!.name} for the following reason: ${reason}`)
				.addFields({ name: 'Moderator', value: `${message.author.tag}`, inline: true })
				.setColor('Red');
			usr.send({ embeds: [embed] }).catch(() => null);
		});

		message.reply(`${user.user.tag} has been kicked from the server.`);
	}
}
