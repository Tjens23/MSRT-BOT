import { Listener } from '@sapphire/framework';
import { Interaction } from 'discord.js';
import { handleButton, handleEnlistmentModal } from '../utils/Utils';

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
			if (interaction.customId === 'ticket_enlistment' || interaction.customId === 'ticket_staff' || interaction.customId === 'ticket_loa' || interaction.customId === 'ticket_hr') {
				await handleButton(interaction);
			}
		}
		
		// Handle modal submissions
		if (interaction.isModalSubmit()) {
			if (interaction.customId === 'enlistment_modal') {
				await handleEnlistmentModal(interaction);
			}
		}
	}
}
