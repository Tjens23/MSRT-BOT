import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, TextChannel } from 'discord.js';
ApplyOptions<CommandOptions>({
	description: "Post the ticket creation panel",
	name: 'ticket-panel',
	preconditions: ['OwnerOnly']
});

export class EnlistmentCommand extends Command {
	public override async messageRun(message: Message) {
		const channel = message.channel as TextChannel;
	
		const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
			  .setCustomId("ticket_enlistment")
			  .setLabel("🪖 Enlistment")
			  .setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
			  .setCustomId("ticket_staff")
			  .setLabel("🛠 Staff Support")
			  .setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
			  .setCustomId("ticket_loa")
			  .setLabel("📆 LOA")
			  .setStyle(ButtonStyle.Secondary)
		  );
		const embed = new EmbedBuilder()
			.setAuthor({
				name: 'Marine Special Reactions Enlistment'
			})
			.setDescription(
				'Submit an Enlistment Ticket today! \nDo understand our staff are on a wide range of time zones from EU to NA; we aim to process your ticket as soon as possible.'
			)
			.setFooter({ iconURL: message.guild!.members.me?.displayAvatarURL().toString(), text: message.guild!.name });
		await message.delete()
		await channel.send({ embeds: [embed], components: [buttons] });
	}
}
