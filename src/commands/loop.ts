import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Message } from 'discord.js';
import { client } from '..';

@ApplyOptions<CommandOptions>({
	name: 'loop',
	aliases: ['repeat'],
	description: 'Loop the currently playing music or queue',
	fullCategory: ['Music']
})
export default class LoopCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const player = message.guild ? client.lavalink.getPlayer(message.guild.id) : null;

		if (!player || !player.connected) {
			return message.reply('I am not connected to a voice channel!');
		}
		if (player.voiceChannelId !== message.member?.voice.channelId) {
			return message.reply('You need to be in the same voice channel as me to change loop mode!');
		}
		if (!player.queue.current) return message.reply('There is no music playing.');

		const mode = await args.pick('string').catch(() => null);

		if (!mode) {
			const currentMode = player.repeatMode;
			let newMode: 'off' | 'track' | 'queue';

			if (currentMode === 'off') newMode = 'track';
			else if (currentMode === 'track') newMode = 'queue';
			else newMode = 'off';

			await player.setRepeatMode(newMode);
			return message.reply(`Loop mode set to **${newMode}**.`);
		}

		// Set specific mode
		const lowerMode = mode.toLowerCase();
		if (lowerMode === 'track' || lowerMode === 'song') {
			await player.setRepeatMode('track');
			return message.reply('Now looping the **current track**.');
		} else if (lowerMode === 'queue' || lowerMode === 'all') {
			await player.setRepeatMode('queue');
			return message.reply('Now looping the **entire queue**.');
		} else if (lowerMode === 'off' || lowerMode === 'none' || lowerMode === 'disable') {
			await player.setRepeatMode('off');
			return message.reply('Loop mode **disabled**.');
		}

		return message.reply('Invalid mode. Use `track`, `queue`, or `off`.');
	}
}
