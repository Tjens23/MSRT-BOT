import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction } from 'discord.js';
import { getUserCurrentRanks, getUserRankHistory, getRankLeaderboard } from '../utils/rankTracking';

@ApplyOptions<Command.Options>({
    description: 'Check rank history and time in rank for users'
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
                        .addUserOption((option) =>
                            option
                                .setName('target')
                                .setDescription('The user to check')
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('history')
                        .setDescription('Check full rank history for a user')
                        .addUserOption((option) =>
                            option
                                .setName('target')
                                .setDescription('The user to check')
                                .setRequired(false)
                        )
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('leaderboard')
                        .setDescription('Show who has held a rank the longest')
                        .addRoleOption((option) =>
                            option
                                .setName('rank')
                                .setDescription('The rank to check leaderboard for')
                                .setRequired(true)
                        )
                )
        );
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'current') {
            const targetUser = interaction.options.getUser('target') || interaction.user;
            const currentRanks = await getUserCurrentRanks(targetUser.id);

            if (currentRanks.length === 0) {
                return interaction.reply({
                    content: `❌ No tracked ranks found for ${targetUser.username}.`,
                    ephemeral: true
                });
            }

            const ranksText = currentRanks
                .map(rank => `**${rank.roleName}** - ${rank.getFormattedDuration()}\n🕐 Since: <t:${Math.floor(rank.receivedAt.getTime() / 1000)}:F>`)
                .join('\n\n');

            const embed = new EmbedBuilder()
                .setTitle(`🎖️ Current Ranks - ${targetUser.username}`)
                .setDescription(ranksText)
                .setThumbnail(targetUser.displayAvatarURL())
                .setColor('#FFD700')
                .setTimestamp()
                .setFooter({ text: `Total tracked ranks: ${currentRanks.length}` });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'history') {
            const targetUser = interaction.options.getUser('target') || interaction.user;
            const rankHistory = await getUserRankHistory(targetUser.id);

            if (rankHistory.length === 0) {
                return interaction.reply({
                    content: `❌ No rank history found for ${targetUser.username}.`,
                    ephemeral: true
                });
            }

            const historyText = rankHistory
                .map(rank => {
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
                    .setTitle(index === 0 ? `📋 Rank History - ${targetUser.username}` : `📋 Rank History (continued)`)
                    .setDescription(chunk)
                    .setThumbnail(index === 0 ? targetUser.displayAvatarURL() : null)
                    .setColor('#4169E1')
                    .setTimestamp(index === 0 ? new Date() : undefined)
                    .setFooter(index === 0 ? { text: `Total rank changes: ${rankHistory.length}` } : null)
            );

            return interaction.reply({ embeds: embeds.slice(0, 3) }); // Discord limit of 3 embeds
        }

        if (subcommand === 'leaderboard') {
            const targetRole = interaction.options.getRole('rank', true);
            const leaderboard = await getRankLeaderboard(targetRole.id);

            if (leaderboard.length === 0) {
                return interaction.reply({
                    content: `❌ No one currently holds the ${targetRole.name} rank.`,
                    ephemeral: true
                });
            }

            const leaderboardText = leaderboard
                .map((entry, index) => {
                    const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
                    return `${medal} **${entry.user.username}** - ${entry.timeInRank}\n🕐 Since: <t:${Math.floor(entry.receivedAt.getTime() / 1000)}:F>`;
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
