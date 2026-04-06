import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { EmbedBuilder, Message } from 'discord.js';
import { client } from '..';

@ApplyOptions<CommandOptions>({
	name: 'queue',
	aliases: ['q'],
	description: 'Display the current music queue',
	fullCategory: ['Music']
})
export default class QueueCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const player = message.guild ? client.lavalink.getPlayer(message.guild.id) : null;

		if (!player || !player.connected) {
			return message.reply('I am not connected to a voice channel!');
		}
		if (player.voiceChannelId !== message.member?.voice.channelId) {
			return message.reply('You need to be in the same voice channel as me to view the queue!');
		}

		const queue = player.queue;
		const embed = new EmbedBuilder().setAuthor({ name: 'Music Queue', iconURL: message.guild?.iconURL() ?? undefined }).setColor('Random');

		// change for the amount of tracks per page
		const multiple = 10;
		const pageArg = await args.pick('integer').catch(() => 1);
		const page = pageArg > 0 ? pageArg : 1;

		const end = page * multiple;
		const start = end - multiple;

		const tracks = queue.tracks.slice(start, end);

		if (queue.current) embed.addFields({ name: 'Now Playing', value: `[${queue.current.info.title}](${queue.current.info.uri})`, inline: false });

		if (!tracks.length) embed.setDescription(`No tracks in ${page > 1 ? `page ${page}` : 'the queue'}.`);
		else embed.setDescription(tracks.map((track: any, i: number) => `${start + ++i} - [${track.info.title}](${track.info.uri})`).join('\n'));

		const maxPages = Math.ceil(queue.tracks.length / multiple) || 1;

		embed.setFooter({ text: `Page ${page > maxPages ? maxPages : page} of ${maxPages}` });

		return message.reply({ embeds: [embed] });
	}
}
