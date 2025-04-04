import { ApplyOptions } from '@sapphire/decorators';
import { Command, Args, CommandOptions } from '@sapphire/framework';
import { Message, EmbedBuilder, Colors, TextChannel } from 'discord.js';
import { capitalise, removeDuplicates } from '../utils/Utils';
import { envParseArray } from '../lib/env-parser';

const OWNERS = envParseArray('OWNERS');

@ApplyOptions<CommandOptions>({
	name: 'help',
	description: 'Shows the help menu',
	fullCategory: ['General']
})
export default class helpCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const command: any = await args.pick('string').catch(() => null);
		const channel = message.channel as TextChannel;
		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setAuthor({ name: 'Help Menu', iconURL: message.author.displayAvatarURL() })
			.setThumbnail(this.container.client.user?.displayAvatarURL({ forceStatic: false }) as string)
			.setFooter({
				text: `Requested by ${message.author.username}`,
				iconURL: message.author.displayAvatarURL({ forceStatic: false }) as string
			})
			.setTimestamp();

		if (command) {
			const cmd: any = this.container.stores.get('commands');
			if (!cmd.has(command)) return channel.send(`Command \`${command}\` not found.`);
			embed.setAuthor({
				name: `${command}  Command Help`,
				iconURL: this.container.client.user?.displayAvatarURL({ forceStatic: false }) as string
			});

			embed.setDescription(
				`**❯ Aliases: ${
					cmd.get(command).aliases.length
						? cmd
								.get(command)
								.aliases.map((a: any) => `\`${a}\``)
								.join(', ')
						: 'No aliases found'
				}**\n` +
					`**❯ Description: ${cmd.get(command).description}**\n` +
					`**❯ Category: ${capitalise(cmd.get(command).fullCategory[0])}**\n`
			);

			return channel.send({ embeds: [embed] });
		} else {
			embed.setDescription(
				`These are the available commands for ${message.guild?.name}\n The bot's prefix is: ${this.container.client.options.defaultPrefix} \n Command Parameters: \`<>\` is strict & \`[]\` is optional`
			);

			let categories;
			if (!OWNERS.includes(message.author.id)) {
				categories = removeDuplicates(
					this.container.stores
						.get('commands')
						.filter((cmd: any) => cmd.category !== 'Owner')
						.map((cmd: any) => cmd.category)
				);
			} else {
				categories = removeDuplicates(this.container.stores.get('commands').map((cmd: any) => cmd.category));
			}

			for (const category of categories || []) {
				const commandsList = this.container.stores
					.get('commands')
					.filter((cmd: any) => cmd.category === category)
					.map((cmd: any) => `\`${cmd.name}\``)
					.join(' ');

				embed.addFields({
					name: `**${capitalise(category || 'Unknown')}**`,
					value: commandsList || 'No commands available',
					inline: false
				});
			}

			return channel.send({ embeds: [embed] });
		}
	}
}
