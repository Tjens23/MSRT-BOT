import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction } from 'discord.js';
import { getRankStatistics } from '../utils/Utils';

@ApplyOptions<Command.Options>({
	description: 'Get detailed statistics about a specific rank'
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
			const stats = await getRankStatistics(targetRole.id);

			if (stats.totalEverHeld === 0) {
				return interaction.editReply({
					content: `❌ No tracking data found for the ${targetRole.name} rank.`
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
			return interaction.editReply({
				content: '❌ An error occurred while getting rank statistics.'
			});
		}
	}
}
