import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, TextChannel } from 'discord.js';
ApplyOptions<CommandOptions>({
	description: 'Enlist in the server',
	name: 'enlistment'
});

export class EnlistmentCommand extends Command {
	public override async messageRun(message: Message) {
		const channel = message.channel as TextChannel;
		const button = new ButtonBuilder().setCustomId('enlist').setLabel('Enlist').setStyle(ButtonStyle.Primary);
		const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
		const embed = new EmbedBuilder()
			.setAuthor({
				name: 'Marine Special Reactions Enlistment'
			})
			.setDescription(
				'Submit an Enlistment Ticket today! \nDo understand our staff are on a wide range of time zones from EU to NA; we aim to process your ticket as soon as possible.'
			)
			.setFooter({ iconURL: message.guild!.members.me?.displayAvatarURL().toString(), text: message.guild!.name });
		await channel.send({ embeds: [embed], components: [actionRow] });
	}
}
