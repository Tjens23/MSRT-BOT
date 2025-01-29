import { Listener } from '@sapphire/framework';
import { createEnlistmentChannel } from '../Utils';
import { Interaction } from 'discord.js';

export class InteractionCreateEvent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'interactionCreate'
		});
	}

	public async run(interaction: Interaction): Promise<void> {
		if (!interaction.isButton()) return;

		createEnlistmentChannel(interaction.guild!, interaction);
	}
}
