import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Message, TextChannel } from 'discord.js';
import { client } from '../..';

@ApplyOptions<CommandOptions>({
	name: 'volume',
	aliases: ['v'],
	description: 'Adjust the volume of the currently playing music',
	fullCategory: ['Music']
})
export default class VolumeCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const currentVolume = message.guild ? client.lavalink.getPlayer(message.guild.id)?.volume : null;
		const channel: TextChannel = message.channel as TextChannel;
		const volumeArg = await args.pick('integer').catch(() => null);
		const player = message.guild ? client.lavalink.getPlayer(message.guild.id) : null;

		if (!player || !player.connected) return message.reply('I am not connected to a voice channel!');
		if (player.voiceChannelId !== message.member?.voice.channelId)
			return message.reply('You need to be in the same voice channel as me to adjust the volume!');
		if (!volumeArg) return message.reply(`Current volume is **${currentVolume}%**`);
		if (volumeArg < 0 || volumeArg > 100) return message.reply(`Current volume is **${currentVolume}%**. Volume must be between 0 and 100.`);

		channel.send(`Current volume is **${currentVolume}%**. Setting volume to **${volumeArg}%**...`);
		player.setVolume(volumeArg);
		return message.reply(`Volume set to **${volumeArg}%**.`);
	}
}
