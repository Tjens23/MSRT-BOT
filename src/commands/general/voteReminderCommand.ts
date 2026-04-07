import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { sendVoteReminder } from '../../utils/voteReminder';

@ApplyOptions<Command.Options>({
	name: 'VoteReminder',
	description: 'Sends a vote reminder to this current channel',
	fullCategory: ['general']
})
export class VoteReminderCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(
			{
				name: this.name,
				description: this.description
			},
			{
				guildIds: [process.env.GUILD_ID!]
			}
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		await sendVoteReminder(interaction.channelId);
		await interaction.editReply({ content: 'Vote reminder sent!' });
	}
}
