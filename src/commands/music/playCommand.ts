import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { EmbedBuilder, Message, VoiceChannel } from 'discord.js';
import { client } from '../../index';

@ApplyOptions<CommandOptions>({
	name: 'play',
	aliases: ['p'],
	description: 'Play music from various sources',
	fullCategory: ['Music']
})
export default class PlayCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const query = await args.rest('string').catch(() => null);

		if (!query) {
			return message.reply('Please provide a song name or URL.');
		}

		const vcId = message.member?.voice.channelId;
		if (!vcId) {
			return message.reply('Join a voice channel first!');
		}

		const vc = message.member?.voice.channel as VoiceChannel;
		if (!vc?.joinable || !vc?.speakable) {
			return message.reply('I cannot join or speak in your voice channel.');
		}

		if (!message.guild) return;

		// Get existing player or create new one
		const player =
			client.lavalink.getPlayer(message.guild.id) ||
			(await client.lavalink.createPlayer({
				guildId: message.guild.id,
				voiceChannelId: vcId,
				textChannelId: message.channel.id,
				selfDeaf: true,
				selfMute: false,
				volume: 80,
				instaUpdateFiltersFix: true,
				applyVolumeAsFilter: false
			}));

		const connected = player.connected;

		if (!connected) {
			await player.connect();
		}

		if (player.voiceChannelId !== vcId) {
			return message.reply('You need to be in my voice channel!');
		}

		const isUrl = query.startsWith('https://') || query.startsWith('http://');

		// Search for tracks
		const response = await player.search(isUrl ? { query } : { query, source: 'ytmsearch' as const }, message.author);

		client.logger.debug(
			`[Play] Search response - loadType: ${response?.loadType}, tracks: ${response?.tracks?.length ?? 0}, exception: ${JSON.stringify(response?.exception)}`
		);

		if (!response || !response.tracks?.length) {
			const errorMsg = response?.exception ? `: ${response.exception.message}` : '';
			return message.reply(`No tracks found${errorMsg}`);
		}

		const isPlaylist = response.loadType === 'playlist';
		const queueBefore = player.queue.tracks.length;

		await player.queue.add(isPlaylist ? response.tracks : response.tracks[0]);

		const embed = new EmbedBuilder().setColor(0x5865f2);

		if (isPlaylist) {
			embed
				.setTitle('Playlist Added')
				.setDescription(`**[${response.playlist?.title || 'Playlist'}](${response.playlist?.uri || ''})** - ${response.tracks.length} tracks`)
				.addFields({ name: 'Position', value: `#${queueBefore + 1}`, inline: true });
		} else {
			const track = response.tracks[0];
			embed
				.setTitle('Track Added')
				.setDescription(`**[${track.info.title}](${track.info.uri})**`)
				.addFields(
					{ name: 'Author', value: track.info.author || 'Unknown', inline: true },
					{ name: 'Duration', value: this.formatDuration(track.info.duration || 0), inline: true },
					{ name: 'Position', value: `#${queueBefore + 1}`, inline: true }
				);
			if (track.info.artworkUrl) {
				embed.setThumbnail(track.info.artworkUrl);
			}
		}

		await message.reply({ embeds: [embed] });

		if (!player.playing) {
			try {
				await player.play(connected ? { volume: 80, paused: false } : undefined);
			} catch (e) {
				client.logger.error('Failed to play track:', e);
				return message.reply(`Failed to start playback: ${e instanceof Error ? e.message : 'Unknown error'}`);
			}
		}
	}

	private formatDuration(ms: number): string {
		const seconds = Math.floor((ms / 1000) % 60);
		const minutes = Math.floor((ms / 1000 / 60) % 60);
		const hours = Math.floor(ms / 1000 / 60 / 60);

		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
}
