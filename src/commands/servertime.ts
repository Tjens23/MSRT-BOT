import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction } from 'discord.js';
import { getUserServerTime, getAllUsersServerTime } from '../utils/Utils';

@ApplyOptions<Command.Options>({
    description: 'Check how long a user has been in the server'
})
export class ServerTimeCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
        super(context, { ...options });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
        const contexts: InteractionContextType[] = [InteractionContextType.Guild];

        registry.registerChatInputCommand((builder) =>
            builder
                .setName('servertime')
                .setDescription('Check how long a user has been in the server')
                .setIntegrationTypes(integrationTypes)
                .setContexts(contexts)
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName('user')
                        .setDescription('Check a specific user\'s server time')
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
                        .setDescription('Show server time leaderboard')
                )
        );
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'user') {
            const targetUser = interaction.options.getUser('target') || interaction.user;
            const serverTimeData = await getUserServerTime(targetUser.id);

            if (!serverTimeData) {
                return interaction.reply({
                    content: `❌ No server time data found for ${targetUser.username}. They may not be tracked yet.`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`📅 Server Time - ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: '📍 Joined Server',
                        value: `<t:${Math.floor(serverTimeData.joinedDate.getTime() / 1000)}:F>`,
                        inline: true
                    },
                    {
                        name: '⏱️ Time in Server',
                        value: serverTimeData.timeInServer.formatted,
                        inline: true
                    },
                    {
                        name: '📊 Days Count',
                        value: `${serverTimeData.timeInServer.days} days`,
                        inline: true
                    }
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setFooter({ text: 'Server Time Tracker' });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'leaderboard') {
            const allUsersData = await getAllUsersServerTime();
            const topUsers = allUsersData.filter(user => user.timeInServer).slice(0, 10);

            if (topUsers.length === 0) {
                return interaction.reply({
                    content: '❌ No server time data available yet.',
                    ephemeral: true
                });
            }

            const leaderboardText = topUsers
                .map((user, index) => {
                    const medal = index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`;
                    return `${medal} **${user.username}** - ${user.timeInServer?.formatted || 'Unknown'}`;
                })
                .join('\n');

            const embed = new EmbedBuilder()
                .setTitle('🏆 Server Time Leaderboard')
                .setDescription(leaderboardText)
                .setColor('#gold')
                .setTimestamp()
                .setFooter({ text: 'Top 10 members by server time' });

            return interaction.reply({ embeds: [embed] });
        }

        // This should never be reached, but adding for completeness
        return interaction.reply({
            content: '❌ Unknown subcommand.',
            ephemeral: true
        });
    }
}
