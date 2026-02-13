import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message, EmbedBuilder, TextChannel, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { TACTICAL_GAMES, CASUAL_GAMES } from '../lib/gameRoles';

@ApplyOptions<Command.Options>({
	name: 'game-roles',
	aliases: ['gameroles', 'gr'],
	description: 'Posts the game role selector panel',
	requiredUserPermissions: ['Administrator'],
	fullCategory: ['Admin']
})
export class GameRolesCommand extends Command {
	public override async messageRun(message: Message) {
		const channel = message.channel as TextChannel;

		// Build the embed
		const embed = new EmbedBuilder()
			.setColor(0x2b2d31)
			.setDescription(
				'*All Marines and Recruits select your eligible game roles from the reaction selection below:*\n\n' + this.buildGameList()
			)
			.setFooter({
				iconURL: message.guild?.iconURL() ?? undefined,
				text: message.guild?.name ?? 'MSRT'
			});

		// Build the Tactical Games select menu
		const tacticalSelectMenu = new StringSelectMenuBuilder()
			.setCustomId('game_roles_tactical')
			.setPlaceholder('Tactical Games')
			.setMinValues(0)
			.setMaxValues(TACTICAL_GAMES.length)
			.addOptions(
				TACTICAL_GAMES.map((game) => new StringSelectMenuOptionBuilder().setLabel(game.name).setValue(game.name).setEmoji(game.emoji))
			);

		// Build the Casual Games select menu
		const casualSelectMenu = new StringSelectMenuBuilder()
			.setCustomId('game_roles_casual')
			.setPlaceholder('Casual Games')
			.setMinValues(0)
			.setMaxValues(CASUAL_GAMES.length)
			.addOptions(CASUAL_GAMES.map((game) => new StringSelectMenuOptionBuilder().setLabel(game.name).setValue(game.name).setEmoji(game.emoji)));

		const tacticalRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tacticalSelectMenu);
		const casualRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(casualSelectMenu);

		await message.delete().catch(() => null);
		await channel.send({
			content: '<@&1020122444029243482> <@&1019122765921521745>',
			embeds: [embed],
			components: [tacticalRow, casualRow]
		});
	}

	private buildGameList(): string {
		let list = '**Tactical Games**\n\n';

		for (const game of TACTICAL_GAMES) {
			list += `${game.emoji} - @${game.name}\n`;
		}

		list += '\n**Casual Games**\n\n';

		for (const game of CASUAL_GAMES) {
			list += `${game.emoji} - @${game.name}\n`;
		}

		return list;
	}
}
