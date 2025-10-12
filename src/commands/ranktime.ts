import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, Message } from 'discord.js';
import { getUserCurrentRanks, getUserRankHistory, getRankLeaderboard } from '../utils/rankTracking';
import { database } from '../database';
import User from '../database/entities/User';

@ApplyOptions<Command.Options>({
	description: 'Check rank history and time in rank for users',
	name: 'ranktime',
	aliases: ['rt', 'rankhistory']
})
export class RankTimeCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		registry.registerChatInputCommand((builder) =>
			builder
				.setName('ranktime')
				.setDescription('Check rank history and time in rank')
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('current')
						.setDescription('Check current ranks and time in each rank')
						.addUserOption((option) => option.setName('target').setDescription('The user to check').setRequired(false))
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('history')
						.setDescription('Check full rank history for a user')
						.addUserOption((option) => option.setName('target').setDescription('The user to check').setRequired(false))
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('leaderboard')
						.setDescription('Show who has held a rank the longest')
						.addRoleOption((option) => option.setName('rank').setDescription('The rank to check leaderboard for').setRequired(true))
				)
		);
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'current') {
			const targetDiscordUser = interaction.options.getUser('target') || interaction.user;

			// Get user from database
			const dbUser = await this.getUserFromDatabase(targetDiscordUser.id);
			if (!dbUser) {
				return interaction.reply({
					content: `❌ User **${targetDiscordUser.username}** not found in database. They may need to join the server first.`,
					ephemeral: true
				});
			}

			const currentRanks = await getUserCurrentRanks(dbUser.userId);

			if (currentRanks.length === 0) {
				return interaction.reply({
					content: `❌ No tracked ranks found for **${dbUser.username}**.`,
					ephemeral: true
				});
			}

			const ranksText = currentRanks
				.map(
					(rank) => `**${rank.roleName}** - ${rank.getFormattedDuration()}\n🕐 Since: <t:${Math.floor(rank.receivedAt.getTime() / 1000)}:F>`
				)
				.join('\n\n');

			const embed = new EmbedBuilder()
				.setTitle(`🎖️ Current Ranks - ${dbUser.username}`)
				.setDescription(ranksText)
				.setThumbnail(targetDiscordUser.displayAvatarURL())
				.setColor('#FFD700')
				.setTimestamp()
				.setFooter({ text: `Callsign: ${dbUser.callsign} | Total tracked ranks: ${currentRanks.length}` });

			return interaction.reply({ embeds: [embed] });
		}

		if (subcommand === 'history') {
			const targetDiscordUser = interaction.options.getUser('target') || interaction.user;

			// Get user from database
			const dbUser = await this.getUserFromDatabase(targetDiscordUser.id);
			if (!dbUser) {
				return interaction.reply({
					content: `❌ User **${targetDiscordUser.username}** not found in database. They may need to join the server first.`,
					ephemeral: true
				});
			}

			const rankHistory = await getUserRankHistory(dbUser.userId);

			if (rankHistory.length === 0) {
				return interaction.reply({
					content: `❌ No rank history found for **${dbUser.username}**.`,
					ephemeral: true
				});
			}

			const historyText = rankHistory
				.map((rank) => {
					const status = rank.isActive ? '🟢 **Active**' : '🔴 **Removed**';
					const duration = rank.getFormattedDuration();
					const received = `<t:${Math.floor(rank.receivedAt.getTime() / 1000)}:F>`;
					const removed = rank.removedAt ? `<t:${Math.floor(rank.removedAt.getTime() / 1000)}:F>` : 'Still active';

					return `${status} **${rank.roleName}**\n⏱️ Duration: ${duration}\n📅 Received: ${received}\n${rank.removedAt ? `❌ Removed: ${removed}` : ''}`;
				})
				.join('\n\n');

			// Split into multiple embeds if too long
			const chunks = this.chunkString(historyText, 4000);
			const embeds = chunks.map((chunk, index) =>
				new EmbedBuilder()
					.setTitle(index === 0 ? `📋 Rank History - ${dbUser.username}` : `📋 Rank History (continued)`)
					.setDescription(chunk)
					.setThumbnail(index === 0 ? targetDiscordUser.displayAvatarURL() : null)
					.setColor('#4169E1')
					.setTimestamp(index === 0 ? new Date() : undefined)
					.setFooter(index === 0 ? { text: `Callsign: ${dbUser.callsign} | Total rank changes: ${rankHistory.length}` } : null)
			);

			return interaction.reply({ embeds: embeds.slice(0, 3) }); // Discord limit of 3 embeds
		}

		if (subcommand === 'leaderboard') {
			const targetRole = interaction.options.getRole('rank', true);
			const leaderboard = await getRankLeaderboard(targetRole.id);

			if (leaderboard.length === 0) {
				return interaction.reply({
					content: `❌ No one currently holds the **${targetRole.name}** rank.`,
					ephemeral: true
				});
			}

			const leaderboardText = leaderboard
				.map((entry, index) => {
					const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
					return `${medal} **${entry.user.username}** (${entry.user.callsign}) - ${entry.timeInRank}\n🕐 Since: <t:${Math.floor(entry.receivedAt.getTime() / 1000)}:F>`;
				})
				.join('\n\n');

			const embed = new EmbedBuilder()
				.setTitle(`🏆 ${targetRole.name} Leaderboard`)
				.setDescription(leaderboardText)
				.setColor(targetRole.color || '#FFD700')
				.setTimestamp()
				.setFooter({ text: `Top ${leaderboard.length} longest serving members` });

			return interaction.reply({ embeds: [embed] });
		}

		return interaction.reply({
			content: '❌ Unknown subcommand.',
			ephemeral: true
		});
	}

	public override async messageRun(message: Message, args: Args) {
		// Parse subcommand
		const subcommandResult = await args.pickResult('string');
		if (subcommandResult.isErr()) {
			return message.reply(
				'❌ **Usage:**\n' +
					'`?ranktime current [user]` - Check current ranks\n' +
					'`?ranktime history [user]` - Check rank history\n' +
					'`?ranktime leaderboard <role>` - Show rank leaderboard'
			);
		}

		const subcommand = subcommandResult.unwrap().toLowerCase();

		if (subcommand === 'current') {
			const userResult = await args.pickResult('user');
			const targetDiscordUser = userResult.isOk() ? userResult.unwrap() : message.author;

			const initialMessage = await message.reply('🔄 **Getting current ranks...**');

			try {
				// Get user from database
				const dbUser = await this.getUserFromDatabase(targetDiscordUser.id);
				if (!dbUser) {
					return initialMessage.edit({
						content: `❌ User **${targetDiscordUser.username}** not found in database. They may need to join the server first.`
					});
				}

				const currentRanks = await getUserCurrentRanks(dbUser.userId);

				if (currentRanks.length === 0) {
					return initialMessage.edit({
						content: `❌ No tracked ranks found for **${dbUser.username}**.`
					});
				}

				const ranksText = currentRanks
					.map(
						(rank) =>
							`**${rank.roleName}** - ${rank.getFormattedDuration()}\n🕐 Since: <t:${Math.floor(rank.receivedAt.getTime() / 1000)}:F>`
					)
					.join('\n\n');

				const embed = new EmbedBuilder()
					.setTitle(`🎖️ Current Ranks - ${dbUser.username}`)
					.setDescription(ranksText)
					.setThumbnail(targetDiscordUser.displayAvatarURL())
					.setColor('#FFD700')
					.setTimestamp()
					.setFooter({ text: `Callsign: ${dbUser.callsign} | Total tracked ranks: ${currentRanks.length}` });

				return initialMessage.edit({ content: '', embeds: [embed] });
			} catch (error) {
				console.error('Error getting current ranks:', error);
				return initialMessage.edit({
					content: '❌ An error occurred while getting current ranks.'
				});
			}
		}

		if (subcommand === 'history') {
			const userResult = await args.pickResult('user');
			const targetDiscordUser = userResult.isOk() ? userResult.unwrap() : message.author;

			const initialMessage = await message.reply('🔄 **Getting rank history...**');

			try {
				// Get user from database
				const dbUser = await this.getUserFromDatabase(targetDiscordUser.id);
				if (!dbUser) {
					return initialMessage.edit({
						content: `❌ User **${targetDiscordUser.username}** not found in database. They may need to join the server first.`
					});
				}

				const rankHistory = await getUserRankHistory(dbUser.userId);

				if (rankHistory.length === 0) {
					return initialMessage.edit({
						content: `❌ No rank history found for **${dbUser.username}**.`
					});
				}

				const historyText = rankHistory
					.map((rank) => {
						const status = rank.isActive ? '🟢 **Active**' : '🔴 **Removed**';
						const duration = rank.getFormattedDuration();
						const received = `<t:${Math.floor(rank.receivedAt.getTime() / 1000)}:F>`;
						const removed = rank.removedAt ? `<t:${Math.floor(rank.removedAt.getTime() / 1000)}:F>` : 'Still active';

						return `${status} **${rank.roleName}**\n⏱️ Duration: ${duration}\n📅 Received: ${received}\n${rank.removedAt ? `❌ Removed: ${removed}` : ''}`;
					})
					.join('\n\n');

				// Split into multiple embeds if too long
				const chunks = this.chunkString(historyText, 4000);
				const embeds = chunks.map((chunk, index) =>
					new EmbedBuilder()
						.setTitle(index === 0 ? `📋 Rank History - ${dbUser.username}` : `📋 Rank History (continued)`)
						.setDescription(chunk)
						.setThumbnail(index === 0 ? targetDiscordUser.displayAvatarURL() : null)
						.setColor('#4169E1')
						.setTimestamp(index === 0 ? new Date() : undefined)
						.setFooter(index === 0 ? { text: `Callsign: ${dbUser.callsign} | Total rank changes: ${rankHistory.length}` } : null)
				);

				return initialMessage.edit({ content: '', embeds: embeds.slice(0, 3) }); // Discord limit of 3 embeds
			} catch (error) {
				console.error('Error getting rank history:', error);
				return initialMessage.edit({
					content: '❌ An error occurred while getting rank history.'
				});
			}
		}

		if (subcommand === 'leaderboard') {
			const roleResult = await args.pickResult('role');
			if (roleResult.isErr()) {
				return message.reply('❌ **Usage:** `?ranktime leaderboard <role>`\n\nExample: `?ranktime leaderboard @Private | E-1`');
			}

			const targetRole = roleResult.unwrap();
			const initialMessage = await message.reply('🔄 **Getting rank leaderboard...**');

			try {
				const leaderboard = await getRankLeaderboard(targetRole.id);

				if (leaderboard.length === 0) {
					return initialMessage.edit({
						content: `❌ No one currently holds the **${targetRole.name}** rank.`
					});
				}

				const leaderboardText = leaderboard
					.map((entry, index) => {
						const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
						return `${medal} **${entry.user.username}** (${entry.user.callsign}) - ${entry.timeInRank}\n🕐 Since: <t:${Math.floor(entry.receivedAt.getTime() / 1000)}:F>`;
					})
					.join('\n\n');

				const embed = new EmbedBuilder()
					.setTitle(`🏆 ${targetRole.name} Leaderboard`)
					.setDescription(leaderboardText)
					.setColor(targetRole.color || '#FFD700')
					.setTimestamp()
					.setFooter({ text: `Top ${leaderboard.length} longest serving members` });

				return initialMessage.edit({ content: '', embeds: [embed] });
			} catch (error) {
				console.error('Error getting rank leaderboard:', error);
				return initialMessage.edit({
					content: '❌ An error occurred while getting rank leaderboard.'
				});
			}
		}

		return message.reply(
			'❌ **Invalid subcommand.** Valid options: `current`, `history`, `leaderboard`\n\n' +
				'**Usage:**\n' +
				'`?ranktime current [user]` - Check current ranks\n' +
				'`?ranktime history [user]` - Check rank history\n' +
				'`?ranktime leaderboard <role>` - Show rank leaderboard'
		);
	}

	private async getUserFromDatabase(discordUserId: string): Promise<User | null> {
		if (!database.isInitialized) {
			await database.initialize();
		}

		return await User.findOne({
			where: { userId: discordUserId }
		});
	}

	private chunkString(str: string, size: number): string[] {
		const chunks: string[] = [];
		let index = 0;
		while (index < str.length) {
			chunks.push(str.slice(index, index + size));
			index += size;
		}
		return chunks;
	}
}
