import { ApplyOptions } from '@sapphire/decorators';
import { Command, Args, CommandOptions } from '@sapphire/framework';
import { Message, EmbedBuilder, TextChannel, Colors } from 'discord.js';

@ApplyOptions<CommandOptions>({
	name: 'faq-ticket',
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
			.setDescription(`Make sure you read the FAQ before creating a ticket.`)
			.setThumbnail(message.guild?.iconURL({ forceStatic: true }) as string)
			.setFooter({
				text: `For any other queries, please refer to your enlistment ticket, or create a support ticket, should you not be able to create an enlistment ticket. You may also DM the S-1 CO Delran should you need any assistance.`,
				iconURL: message.guild?.iconURL({ forceStatic: true }) as string
			})
			.setColor(Colors.Blue)
			.addFields(
				{
					name: "I'm not able to create an enlistment ticket / the bot says I don't have permission.",
					value: 'i. MSRT is a PC only unit, and we do not support console applicants at this time.\nii. If you are on PC, but still unable to create an enlistment ticket, please create a support ticket.'
				},
				{
					name: "I created a ticket but no one's gotten back to me.",
					value: 'i. S-1 staff personnel will respond to your ticket as soon as possible. Please understand, while we try to keep the wait time to a minimum, our staff personnel have responsibilities outside of the server. Thank you for your patience.'
				},
				{
					name: 'I have a question regarding your rules/SOP/documents etc.',
					value: 'i. You may relay any and all questions, regardless of nature, to your enlistment ticket. Our S-1 personnel will help you with any and all questions to the best of their ability.'
				},
				{
					name: "I don't have a copy of RoN, GB and/or TacVR. Can I still enlist in the unit?",
					value: 'i. Unfortunately, a legal copy of RoN, GB and/or TacVR is required to participate in MSRT.'
				},
				{
					name: "I'm under 18, can I still join?",
					value: 'i. No, MSRT is strictly for users aged 18 and above.'
				}
			);
		return await channel.send({ embeds: [embed], allowedMentions: { users: [userToPingId] } });
	}
}
