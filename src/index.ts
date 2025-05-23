import 'dotenv/config';
import './lib/setup';

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { database } from './database';
import { CheckActivity } from './utils/checkActivity';
/*
import { google, youtube_v3 } from 'googleapis';
*/
import cron from 'node-cron';


export const client = new SapphireClient({
	defaultPrefix: process.env.PREFIX,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers
	],
	loadMessageCommandListeners: true
});
/*
const checkYouTubeChannel = async () => {
	const youtube = google.youtube({
		version: 'v3',
		auth: process.env.YOUTUBE_API_KEY
	});

	const response: youtube_v3.Schema$SearchListResponse = await youtube.search.list({
		part: ['snippet'],
		channelId: process.env.YOUTUBE_CHANNEL_ID,
		order: 'date',
		maxResults: 1
	});

	const latestVideo: any = response.data.items?.[0];
	if (latestVideo) {
		const channel = client.channels.cache.find(channel => channel.name === 'msrt-media') as TextChannel;
		if (channel) {
			await channel.send(`New video or stream: https://www.youtube.com/watch?v=${latestVideo.id.videoId}`);
		}
	}
};
*/
const main = async () => {
	try {
		database
			.initialize()
			.then(() => client.logger.info('Database connected'))
			.catch((error) => client.logger.fatal(error));
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
		await CheckActivity();
		cron.schedule('*/5 * * * *', await CheckActivity);
		//cron.schedule('*/5 * * * *', checkYouTubeChannel);
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
