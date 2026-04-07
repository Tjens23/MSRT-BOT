import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { Message } from 'discord.js';
import { client } from '../..';

@ApplyOptions<CommandOptions>({
	name: 'stop',
	aliases: ['s'],
	description: 'Stop the currently playing music and clear the queue',
	fullCategory: ['Music']
})
export default class StopCommand extends Command {
	public override async messageRun(message: Message) {
		const player = message.guild ? client.lavalink.getPlayer(message.guild.id) : null;

		if (!player || !player.connected) {
			return message.reply('I am not connected to a voice channel!');
		}
		if (player.voiceChannelId !== message.member?.voice.channelId) {
			return message.reply('You need to be in the same voice channel as me to stop the music!');
		}
		player.stopPlaying();
		player.destroy();
		return message.reply('Music stopped and queue cleared!');
	}
}
