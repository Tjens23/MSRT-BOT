import { ApplyOptions } from '@sapphire/decorators';
import { Command, Args, CommandOptions } from '@sapphire/framework';
import { Message, EmbedBuilder, TextChannel, Colors } from 'discord.js';

@ApplyOptions<CommandOptions>({
	name: 'faq-mods',
	description: 'Shows the FAQ menu',
	fullCategory: ['Admin'],
	requiredUserPermissions: ['Administrator']
})
export default class faqCommand extends Command {
	public override async messageRun(message: Message, _args: Args) {
		const channel = message.channel as TextChannel;
		const userToPingId = '534788596276658180';

		const embed = new EmbedBuilder()
			.setTitle('Frequently Asked Questions (FAQ)')
			.setDescription(
				`Make sure you read the FAQ before creating a ticket. \nEnsure you've read through <#1064713901696102460>, in order to ensure you haven't skipped any steps when downloading mods for RoN.`
			)
			.setThumbnail(message.guild?.iconURL({ forceStatic: true }) as string)
			.setFooter({
				text: `For any other queries, please create a mod support ticket.`,
				iconURL: message.guild?.iconURL({ forceStatic: true }) as string
			})
			.setColor(Colors.Blue)
			.addFields(
				{
					name: 'My game keeps crashing when I try to boot it up, after installing the mandatory mods.',
					value: 'i. Ensure you\'ve selected ALL mods from "MANDATORY MODS". The Google Drive download is likely to split into two due to the size of mods.\nii. Double check to ensure you aren\'t using any mods that are not in the modpack.\niii. Should the issue persist, please create a mod support ticket, and S-2 personnel will be with you ASAP.'
				},
				{
					name: 'My file explorer keeps freezing when I try to update/download a mod.',
					value: 'i. Refrain from dragging files, as that might result in your file explorer freezing. Use copy and paste instead.'
				}
			);
		return await channel.send({ embeds: [embed], allowedMentions: { users: [userToPingId] } });
	}
}
