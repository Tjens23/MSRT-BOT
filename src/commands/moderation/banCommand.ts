import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Bans a user from the server',
	name: 'ban',
	fullCategory: ['Moderation'],
	aliases: ['banish'],
	requiredUserPermissions: [PermissionFlagsBits.BanMembers]
})
export class BanCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const user = await args.pick('member').catch(() => null);
		const reason = await args.rest('string').catch(() => 'No reason provided');
		if (!user) return message.reply('Invalid usage! Please provide a user to ban.');
		if (user.roles.highest.position >= message.member!.roles.highest.position)
			return message.reply('You cannot ban this user because they have a higher or equal role than you.');

		await user.ban({ reason }).then((usr) => {
			const embed = new EmbedBuilder()
				.setDescription(`${usr.user.tag}, You have been banned from ${message.guild!.name} for the following reason: ${reason}`)
				.addFields({ name: 'Moderator', value: `${message.author.tag}`, inline: true })
				.setColor('Red');
			usr.send({ embeds: [embed] }).catch(() => null);
		});

		message.reply(`${user.user.tag} has been banned from the server.`);
	}
}
