import { Listener } from '@sapphire/framework';
import { GuildMember, Interaction } from 'discord.js';
import {
	handleButton,
	handleEnlistmentModal,
	handleLOAModal,
	handleTranscriptButton,
	handleCloseTicketButton,
	handleDeleteChannelButton
} from '../utils/Utils';
import { TACTICAL_GAMES, CASUAL_GAMES } from '../lib/gameRoles';

export class InteractionCreateEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'interactionCreate'
		});
	}

	public async run(interaction: Interaction): Promise<void> {
		// Handle button interactions
		if (interaction.isButton()) {
			// Handle ticket creation buttons
			if (
				interaction.customId === 'ticket_enlistment' ||
				interaction.customId === 'ticket_staff' ||
				interaction.customId === 'ticket_loa' ||
				interaction.customId === 'ticket_hr'
			) {
				await handleButton(interaction);
			}
			// Handle transcript buttons
			else if (interaction.customId.startsWith('transcript_')) {
				await handleTranscriptButton(interaction);
			}
			// Handle close ticket buttons
			else if (interaction.customId.startsWith('close_')) {
				await handleCloseTicketButton(interaction);
			}
			// Handle delete channel buttons
			else if (interaction.customId.startsWith('delete_')) {
				await handleDeleteChannelButton(interaction);
			}
		}

		// Handle modal submissions
		if (interaction.isModalSubmit()) {
			if (interaction.customId === 'enlistment_modal') {
				await handleEnlistmentModal(interaction);
			} else if (interaction.customId === 'loa_modal') {
				await handleLOAModal(interaction);
			}
		}

		// Handle select menu interactions for game roles
		if (interaction.isStringSelectMenu()) {
			if (interaction.customId === 'game_roles_tactical' || interaction.customId === 'game_roles_casual') {
				await this.handleGameRoleSelection(interaction);
			}
		}
	}

	private async handleGameRoleSelection(interaction: Interaction): Promise<void> {
		if (!interaction.isStringSelectMenu()) return;

		// Defer reply immediately to avoid timeout
		await interaction.deferReply({ flags: 64 }); // 64 = ephemeral

		const member = interaction.member as GuildMember;
		if (!member) {
			await interaction.editReply({ content: 'Could not find member.' });
			return;
		}

		const selectedGameNames = interaction.values;
		const gameList = interaction.customId === 'game_roles_tactical' ? TACTICAL_GAMES : CASUAL_GAMES;

		const addedRoles: string[] = [];
		const removedRoles: string[] = [];
		const skippedRoles: string[] = [];

		try {
			// Only process the games that were selected - toggle them (add if missing, remove if present)
			for (const gameName of selectedGameNames) {
				const game = gameList.find((g) => g.name === gameName);
				if (!game) continue;

				// Skip if role ID is not configured
				if (game.roleId === 'ROLE_ID_HERE') {
					skippedRoles.push(game.name);
					continue;
				}

				const hasRole = member.roles.cache.has(game.roleId);

				if (hasRole) {
					// Remove the role (toggle off)
					await member.roles.remove(game.roleId);
					removedRoles.push(game.name);
				} else {
					// Add the role (toggle on)
					await member.roles.add(game.roleId);
					addedRoles.push(game.name);
				}
			}

			const messages: string[] = [];
			if (addedRoles.length > 0) {
				messages.push(`✅ Added: ${addedRoles.join(', ')}`);
			}
			if (removedRoles.length > 0) {
				messages.push(`❌ Removed: ${removedRoles.join(', ')}`);
			}
			if (skippedRoles.length > 0) {
				messages.push(`⚠️ Not configured: ${skippedRoles.join(', ')}`);
			}
			if (addedRoles.length === 0 && removedRoles.length === 0 && skippedRoles.length === 0) {
				messages.push('No changes were made to your roles.');
			}

			await interaction.editReply({
				content: messages.join('\n')
			});
		} catch (error) {
			console.error('Error updating game roles:', error);
			await interaction.editReply({
				content: 'An error occurred while updating your roles. Please contact an administrator.'
			});
		}
	}
}
