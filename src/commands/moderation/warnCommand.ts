import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';
import WarnEntity from '../../database/entities/WarnEntity';

@ApplyOptions<Command.Options>({
	description: 'Warns a user',
	name: 'warn',
	fullCategory: ['Moderation'],
	aliases: ['warning']
})
export class WarnCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const user = await args.pick('member').catch(() => null);
		const reason = await args.rest('string');

		if (!user) return message.reply('Invalid usage! Please provide a user to warn.');
		if (!reason) return message.reply('Invalid usage! Please provide a reason for the warning.');
		if (user.roles.highest.position >= message.member!.roles.highest.position)
			return message.reply('You cannot warn this user because they have a higher or equal role than you.');

		await WarnEntity.create({
			reason,
			user: { userId: user.id, username: user.user.tag, callsign: user.user.tag },
			moderator: { userId: message.author.id, username: message.author.tag, callsign: message.author.tag }
		}).save();

		const embed = new EmbedBuilder()
			.setDescription(`${user.user.tag}, You have been warned in ${message.guild!.name} for the following reason: ${reason}`)
			.addFields({ name: 'Moderator', value: `${message.author.tag}`, inline: true })
			.setColor('Yellow');
		user.send({ embeds: [embed] }).catch(() => null);

		message.reply(`${user.user.tag} has been warned.`);
	}
}
