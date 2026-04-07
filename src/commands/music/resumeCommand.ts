import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { Message } from 'discord.js';
import { client } from '../..';

@ApplyOptions<CommandOptions>({
	name: 'resume',
	aliases: ['res'],
	description: 'Resume the currently paused music',
	fullCategory: ['Music']
})
export default class ResumeCommand extends Command {
	public override async messageRun(message: Message) {
		const player = message.guild ? client.lavalink.getPlayer(message.guild.id) : null;

		if (!player || !player.connected) {
			return message.reply('I am not connected to a voice channel!');
		}
		if (player.voiceChannelId !== message.member?.voice.channelId) {
			return message.reply('You need to be in the same voice channel as me to resume the music!');
		}
		if (!player.queue.current) return message.reply('there is no music playing.');

		await player.resume();
		return message.reply(`Resumed queue.`);
	}
}
