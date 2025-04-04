import { Listener } from '@sapphire/framework';
import { Interaction } from 'discord.js';
import { handleButton } from '../utils/Utils';

export class InteractionCreateEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'interactionCreate'
		});
	}

	public async run(interaction: Interaction): Promise<void> {
		if (!interaction.isButton()) return;

		if (interaction.customId === 'ticket_enlistment' || interaction.customId === 'ticket_staff' || interaction.customId === 'ticket_loa') {
			await handleButton(interaction);
		}
	}
}
