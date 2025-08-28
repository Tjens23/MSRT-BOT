import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { bulkUpdateRanks } from '../utils/bulkUpdateRanks';

@ApplyOptions<Command.Options>({
    description: 'Admin command to bulk update rank data for all server members',
    requiredUserPermissions: [PermissionFlagsBits.Administrator]
})
export class BulkUpdateRanksCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
        const contexts: InteractionContextType[] = [InteractionContextType.Guild];

        registry.registerChatInputCommand((builder) =>
            builder
                .setName('bulk-update-ranks')
                .setDescription('Bulk update rank data for all server members (Admin only)')
                .setIntegrationTypes(integrationTypes)
                .setContexts(contexts)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        );
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const result = await bulkUpdateRanks();
            
            if (result) {
                await interaction.editReply({
                    content: `✅ **Bulk rank update completed!**\n` +
                            `🔄 Processed: ${result.processed} members\n` +
                            `❌ Errors: ${result.errors}`
                });
            } else {
                await interaction.editReply({
                    content: '❌ Bulk rank update failed. Please check the logs for details.'
                });
            }
        } catch (error) {
            console.error('Error during bulk rank update:', error);
            await interaction.editReply({
                content: '❌ An error occurred during the bulk rank update. Please check the logs.'
            });
        }
    }
}
