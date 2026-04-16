import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Colors, EmbedBuilder, Message } from 'discord.js';
import { database } from '../../database';
import WarnEntity from '../../database/entities/WarnEntity';
import User from '../../database/entities/User';

@ApplyOptions<Command.Options>({
	description: 'Warns a user',
	name: 'warn',
	fullCategory: ['Moderation'],
	aliases: ['warning']
})
export class WarnCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const user = await args.pick('member').catch(() => null);
		if (!user) return message.reply('Invalid usage! Please provide a user to warn.');

		const reason = await args.rest('string').catch(() => '');
		if (!reason) return message.reply('Invalid usage! Please provide a reason for the warning.');

		if (user.roles.highest.position >= message.member!.roles.highest.position)
			return message.reply('You cannot warn this user because they have a higher or equal role than you.');

		let targetUser = await database.manager.findOne(User, { where: { userId: user.id } });
		if (!targetUser) {
			targetUser = new User();
			targetUser.userId = user.id;
			targetUser.username = user.user.tag;
			targetUser.callsign = user.user.tag;
			await database.manager.save(targetUser);
		}

		let moderator = await database.manager.findOne(User, { where: { userId: message.author.id } });
		if (!moderator) {
			moderator = new User();
			moderator.userId = message.author.id;
			moderator.username = message.author.tag;
			moderator.callsign = message.author.tag;
			await database.manager.save(moderator);
		}

		const warn = new WarnEntity();
		warn.reason = reason;
		warn.user = targetUser;
		warn.moderator = moderator;
		await database.manager.save(warn);

		const embed = new EmbedBuilder()
		.setAuthor({ name: 'You have been warned', iconURL: user.user.displayAvatarURL({ forceStatic: true }) || undefined })
			.setDescription(`${user.user.tag}, You have been warned in ${message.guild!.name} for the following reason: ${reason}`)
			.addFields({ name: 'Moderator', value: `${message.author.tag}`, inline: true })
			.setThumbnail(message.guild?.iconURL({ forceStatic: true }) || '')
			.setColor(Colors.Red);
		user.send({ embeds: [embed] }).catch(() => null);

		message.reply(`${user.user.tag} has been warned.`);
	}
}
