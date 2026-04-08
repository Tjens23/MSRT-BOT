import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';
import WarnEntity from '../../database/entities/WarnEntity';

@ApplyOptions<Command.Options>({
	description: 'Displays the warning history of a user',
	name: 'history',
	fullCategory: ['Moderation'],
	aliases: ['warnings', 'infractions', 'warns']
})
export class HistoryCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const user = await args.pick('member').catch(() => null);

		if (!user) return message.reply('Invalid usage! Please provide a user to warn.');
		const warnings = await WarnEntity.find({ where: { user: { userId: user.id } } });

		if (warnings.length === 0) {
			return message.reply(`${user.user.tag} has no warnings.`);
		}

		const embed = new EmbedBuilder()
			.setTitle(`Warning History for ${user.user.tag}`)
			.setColor('Yellow')
			.setThumbnail(user.user.displayAvatarURL({ forceStatic: true }))
			.setDescription(warnings.map((warn, index) => `**${index + 1}.** ${warn.reason} (Moderator: ${warn.moderator.username})`).join('\n'));

		message.reply({ embeds: [embed] });
	}
}
