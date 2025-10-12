import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, InteractionContextType, ChatInputCommandInteraction, Message, PermissionFlagsBits } from 'discord.js';
import { bulkUpdateRanks } from '../utils/bulkUpdateRanks';

@ApplyOptions<Command.Options>({
	description: 'Admin command to bulk update rank data for all server members',
	name: 'bulk-update-ranks',
	aliases: ['bulkupdateranks', 'bur'],
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
			const guildId = process.env.GUILD_ID;
			if (!guildId) {
				await interaction.editReply({
					content: '❌ **Error:** GUILD_ID not configured in environment variables.'
				});
				return;
			}

			const result = await bulkUpdateRanks(guildId);

			if (result) {
				await interaction.editReply({
					content:
						`✅ **Bulk rank update completed!**\n` +
						`🔄 Processed: ${result.processed} members\n` +
						`📝 Ranks tracked: ${result.ranksTracked || 0}\n` +
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

	public override async messageRun(message: Message) {
		const guildId = process.env.GUILD_ID;
		if (!guildId) {
			await message.reply('❌ **Error:** GUILD_ID not configured in environment variables.');
			return;
		}

		// Send initial message indicating the process has started
		const initialMessage = await message.reply('🔄 **Starting bulk update of rank data...**\nThis may take a while depending on server size.');

		try {
			const result = await bulkUpdateRanks(guildId);

			if (result) {
				await initialMessage.edit({
					content:
						`✅ **Bulk rank update completed!**\n` +
						`🔄 Processed: ${result.processed} members\n` +
						`📝 Ranks tracked: ${result.ranksTracked || 0}\n` +
						`❌ Errors: ${result.errors}`
				});
			} else {
				await initialMessage.edit({
					content: '❌ Bulk rank update failed. Please check the logs for details.'
				});
			}
		} catch (error) {
			console.error('Error during bulk rank update:', error);
			await initialMessage.edit({
				content: '❌ An error occurred during the bulk rank update. Please check the logs.'
			});
		}
	}
}
