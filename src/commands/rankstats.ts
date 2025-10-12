import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, Message } from 'discord.js';
import { getRankStatistics } from '../utils/Utils';

@ApplyOptions<Command.Options>({
	description: 'Get detailed statistics about a specific rank',
	name: 'rankstats',
	aliases: ['rankstat', 'rs']
})
export class RankStatsCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		registry.registerChatInputCommand((builder) =>
			builder
				.setName('rankstats')
				.setDescription('Get detailed statistics about a specific rank')
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addRoleOption((option) => option.setName('rank').setDescription('The rank to get statistics for').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const targetRole = interaction.options.getRole('rank', true);

		await interaction.deferReply();

		try {
			// Add timeout protection
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Operation timed out')), 13000); // 13 seconds to be safe
			});

			const statsPromise = getRankStatistics(targetRole.id);
			const stats = (await Promise.race([statsPromise, timeoutPromise])) as any;

			if (!stats || stats.totalEverHeld === 0) {
				return interaction.editReply({
					content: `❌ No tracking data found for the **${targetRole.name}** rank.`
				});
			}

			const embed = new EmbedBuilder()
				.setTitle(`📊 Rank Statistics - ${targetRole.name}`)
				.setColor(targetRole.color || '#FFD700')
				.addFields(
					{
						name: '👥 Currently Holding',
						value: stats.currentlyHolding.toString(),
						inline: true
					},
					{
						name: '📈 Total Ever Held',
						value: stats.totalEverHeld.toString(),
						inline: true
					},
					{
						name: '📉 Total Who Left',
						value: stats.totalWhoLeft.toString(),
						inline: true
					}
				);

			if (stats.averageTimeInRank > 0) {
				embed.addFields({
					name: '⏱️ Average Time in Rank',
					value: `${stats.averageTimeInRank} days`,
					inline: true
				});
			}

			if (stats.longestServing) {
				embed.addFields({
					name: '🏆 Longest Serving (Current)',
					value: `**${stats.longestServing.user.username}**\n${stats.longestServing.timeInRank}\nSince: <t:${Math.floor(stats.longestServing.since.getTime() / 1000)}:F>`,
					inline: false
				});
			}

			embed.setTimestamp().setFooter({ text: 'Rank Statistics' });

			return interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error('Error getting rank statistics:', error);

			// Check if interaction is still valid
			if (!interaction.deferred && !interaction.replied) {
				return interaction.reply({
					content: '❌ An error occurred while getting rank statistics. Please try again.',
					ephemeral: true
				});
			} else {
				return interaction.editReply({
					content:
						'❌ An error occurred while getting rank statistics. This might be due to database connectivity issues or the operation taking too long.'
				});
			}
		}
	}

	public override async messageRun(message: Message, args: Args) {
		const roleResult = await args.pickResult('role');
		if (roleResult.isErr()) {
			return message.reply('❌ **Usage:** `rankstats <role>`\n\nExample: `rankstats @Private | E-1`');
		}

		const targetRole = roleResult.unwrap();
		const initialMessage = await message.reply('🔄 **Getting rank statistics...**');

		try {
			// Add timeout protection
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Operation timed out')), 13000);
			});

			const statsPromise = getRankStatistics(targetRole.id);
			const stats = (await Promise.race([statsPromise, timeoutPromise])) as any;

			if (!stats || stats.totalEverHeld === 0) {
				return initialMessage.edit({
					content: `❌ No tracking data found for the **${targetRole.name}** rank.`
				});
			}

			const embed = new EmbedBuilder()
				.setTitle(`📊 Rank Statistics - ${targetRole.name}`)
				.setColor(targetRole.color || '#FFD700')
				.addFields(
					{
						name: '👥 Currently Holding',
						value: stats.currentlyHolding.toString(),
						inline: true
					},
					{
						name: '📈 Total Ever Held',
						value: stats.totalEverHeld.toString(),
						inline: true
					},
					{
						name: '📉 Total Who Left',
						value: stats.totalWhoLeft.toString(),
						inline: true
					}
				);

			if (stats.averageTimeInRank > 0) {
				embed.addFields({
					name: '⏱️ Average Time in Rank',
					value: `${stats.averageTimeInRank} days`,
					inline: true
				});
			}

			if (stats.longestServing) {
				embed.addFields({
					name: '🏆 Longest Serving (Current)',
					value: `**${stats.longestServing.user.username}**\n${stats.longestServing.timeInRank}\nSince: <t:${Math.floor(stats.longestServing.since.getTime() / 1000)}:F>`,
					inline: false
				});
			}

			embed.setTimestamp().setFooter({ text: 'Rank Statistics' });

			return initialMessage.edit({ content: '', embeds: [embed] });
		} catch (error) {
			console.error('Error getting rank statistics:', error);
			return initialMessage.edit({
				content:
					'❌ An error occurred while getting rank statistics. This might be due to database connectivity issues or the operation taking too long.'
			});
		}
	}
}
