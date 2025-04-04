import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, Message, TextChannel } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Create a poll with options and real-time results',
	aliases: ['poll'],
	name: 'poll'
})
export class PollCommand extends Command {
	override async messageRun(message: Message, args: Args) {
		const title = await args.pickResult('string');
		const description = await args.pickResult('string');
		const optionsString = await args.restResult('string');
		
		if (!title.isOk() || !description.isOk() || !optionsString.isOk()) {
			return message.reply(
				'Usage: ?poll <title> <description> <options>\nExample: ?poll Favorite Color What is your favorite color? Red,Blue,Green'
			);
		}

		const options = optionsString
			.unwrap()
			.split(',')
			.map((opt) => opt.trim());
		if (options.length < 2) {
			return message.reply('You must provide at least two options separated by commas.');
		}

		const votes = new Map<string, number>();
		const hasVoted = new Map<string, boolean>();
		options.forEach((option) => votes.set(option, 0));

		const buttons = options.map((option, index) =>
			new ButtonBuilder().setCustomId(`option_${index}`).setLabel(option).setStyle(ButtonStyle.Primary)
		);

		const rows: ActionRowBuilder<ButtonBuilder>[] = [];
		for (let i = 0; i < buttons.length; i += 5) {
			rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
		}

		const generateResults = () => {
			let totalVotes = Array.from(votes.values()).reduce((sum, count) => sum + count, 0);
			totalVotes = totalVotes || 1;

			return options
				.map((option) => {
					const count = votes.get(option) || 0;
					const percentage = ((count / totalVotes) * 100).toFixed(2);
					const bar = '█'.repeat(Math.floor(Number(percentage) / 10 || 1)) + ' '.repeat(10 - Math.floor(Number(percentage) / 10 || 1));

					return `**${option}**\n[${bar}] ${percentage}% (${count})`;
				})
				.join('\n\n');
		};

		const embed = new EmbedBuilder()
			.setTitle(title.unwrap())
			.setDescription(description.unwrap())
			.setThumbnail(message.guild!.members.me?.displayAvatarURL().toString() || '')
			.addFields({ name: 'Results', value: generateResults() })
			.setFooter({ text: 'Vote by clicking the buttons below!' });

		const channel: TextChannel = message.channel as TextChannel;
		const pollMessage = await channel.send({ embeds: [embed], components: rows });

		const collector = pollMessage.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000
		});

		collector.on('collect', async (interaction: ButtonInteraction) => {
			if (!interaction.isButton()) return;
	
			if (hasVoted.get(interaction.user.id)) return interaction.reply({ content: 'You have already voted!', ephemeral: true });
			
			const selectedOption = interaction.customId.split('_')[1];
			const option = options[parseInt(selectedOption)];

			votes.set(option, (votes.get(option) || 0) + 1);
			embed.spliceFields(0, 1, { name: 'Results', value: generateResults() });
			await pollMessage.edit({ embeds: [embed] });

		
			hasVoted.set(interaction.user.id, true);
			return await interaction.reply({ content: `Your vote for **${option}** has been recorded!`, ephemeral: true });
		});

		return collector.on('end', () => {
			embed.setFooter({ text: 'Poll ended!' });
			pollMessage.edit({ embeds: [embed], components: [] });
		});
	}
}
