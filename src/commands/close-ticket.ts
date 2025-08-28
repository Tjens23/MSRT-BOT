import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { database } from '../database';
import Ticket from '../database/entities/Ticket';

@ApplyOptions<Command.Options>({
    description: 'Close the current ticket channel'
})
export class CloseTicketCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
        const contexts: InteractionContextType[] = [InteractionContextType.Guild];

        registry.registerChatInputCommand((builder) =>
            builder
                .setName('close-ticket')
                .setDescription('Close the current ticket channel')
                .setIntegrationTypes(integrationTypes)
                .setContexts(contexts)
        );
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        // Check if this is a ticket channel
        if (!interaction.channel || interaction.channel.type !== 0) { // 0 = GUILD_TEXT
            return interaction.reply({ 
                content: '❌ This command can only be used in text channels.', 
                ephemeral: true 
            });
        }

        const channelName = (interaction.channel as any).name;
        if (!channelName || !channelName.startsWith('ticket-')) {
            return interaction.reply({ 
                content: '❌ This command can only be used in ticket channels.', 
                ephemeral: true 
            });
        }

        // Initialize database if needed
        if (!database.isInitialized) {
            await database.initialize();
        }

        try {
            // Find the ticket associated with this user
            const ticket = await Ticket.findOne({
                where: {
                    user: { userId: interaction.user.id },
                    closed: false
                },
                relations: ['user']
            });

            if (!ticket) {
                return interaction.reply({ 
                    content: '❌ No open ticket found for you, or you do not have permission to close this ticket.', 
                    ephemeral: true 
                });
            }

            // Close the ticket
            ticket.closed = true;
            await ticket.save();

            // Create closure embed
            const closeEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔒 Ticket Closed')
                .setDescription('This ticket has been closed.')
                .addFields(
                    { name: '👤 Closed by', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📅 Closed at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '🎫 Ticket ID', value: ticket.id.toString(), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'This channel will be deleted in 30 seconds.' });

            await interaction.reply({ embeds: [closeEmbed] });

            // Delete the channel after 30 seconds
            return setTimeout(async () => {
                try {
                    if (interaction.channel && 'delete' in interaction.channel) {
                        await interaction.channel.delete();
                    }
                } catch (error) {
                    console.error('Failed to delete ticket channel:', error);
                }
            }, 30000);

        } catch (error) {
            console.error('Error closing ticket:', error);
            return interaction.reply({ 
                content: '❌ An error occurred while closing the ticket.', 
                ephemeral: true 
            });
        }
    }
}
