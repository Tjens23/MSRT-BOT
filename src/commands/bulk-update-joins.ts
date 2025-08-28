import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { bulkUpdateJoinDates } from '../utils/bulkUpdateJoinDates';

@ApplyOptions<Command.Options>({
    description: 'Admin command to bulk update join dates for all server members',
    requiredUserPermissions: [PermissionFlagsBits.Administrator]
})
export class BulkUpdateCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
        const contexts: InteractionContextType[] = [InteractionContextType.Guild];

        registry.registerChatInputCommand((builder) =>
            builder
                .setName('bulk-update-joins')
                .setDescription('Bulk update join dates for all server members (Admin only)')
                .setIntegrationTypes(integrationTypes)
                .setContexts(contexts)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        );
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const result = await bulkUpdateJoinDates();
            
            if (result) {
                await interaction.editReply({
                    content: `✅ **Bulk update completed!**\n` +
                            `📝 Created: ${result.created} new user records\n` +
                            `🔄 Updated: ${result.updated} existing records\n` +
                            `❌ Errors: ${result.errors}`
                });
            } else {
                await interaction.editReply({
                    content: '❌ Bulk update failed. Please check the logs for details.'
                });
            }
        } catch (error) {
            console.error('Error during bulk update:', error);
            await interaction.editReply({
                content: '❌ An error occurred during the bulk update. Please check the logs.'
            });
        }
    }
}
