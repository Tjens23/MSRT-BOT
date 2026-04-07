import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { Message } from 'discord.js';
import { client } from '../..';

@ApplyOptions<CommandOptions>({
	name: 'pause',
	aliases: ['pa'],
	description: 'Pause the currently playing music',
	fullCategory: ['Music']
})
export default class PauseCommand extends Command {
	public override async messageRun(message: Message) {
		const player = message.guild ? client.lavalink.getPlayer(message.guild.id) : null;

		if (!player || !player.connected) {
			return message.reply('I am not connected to a voice channel!');
		}
		if (player.voiceChannelId !== message.member?.voice.channelId) {
			return message.reply('You need to be in the same voice channel as me to pause the music!');
		}
		if (!player.queue.current) return message.reply('there is no music playing.');
		if (player.paused) return message.reply('The music is already paused.');

		await player.pause();
		return message.reply(`Paused queue.`);
	}
}
