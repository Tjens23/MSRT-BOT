import { Colors, EmbedBuilder, Guild, TextChannel } from 'discord.js';

export const LOG_CHANNEL_ID = '1184271264764940388';

export type LogEventType =
	| 'CHANNEL_CREATE'
	| 'CHANNEL_DELETE'
	| 'CHANNEL_UPDATE'
	| 'MEMBER_JOIN'
	| 'MEMBER_LEAVE'
	| 'MEMBER_UPDATE'
	| 'MEMBER_BAN'
	| 'MEMBER_UNBAN'
	| 'MESSAGE_DELETE'
	| 'MESSAGE_BULK_DELETE'
	| 'MESSAGE_UPDATE'
	| 'ROLE_CREATE'
	| 'ROLE_DELETE'
	| 'ROLE_UPDATE'
	| 'INVITE_CREATE'
	| 'INVITE_DELETE'
	| 'VOICE_STATE_UPDATE'
	| 'THREAD_CREATE'
	| 'THREAD_DELETE'
	| 'THREAD_UPDATE'
	| 'EMOJI_CREATE'
	| 'EMOJI_DELETE'
	| 'EMOJI_UPDATE'
	| 'STICKER_CREATE'
	| 'STICKER_DELETE'
	| 'STICKER_UPDATE'
	| 'GUILD_UPDATE'
	| 'WEBHOOK_UPDATE';

const eventColors: Record<LogEventType, number> = {
	CHANNEL_CREATE: Colors.Green,
	CHANNEL_DELETE: Colors.Red,
	CHANNEL_UPDATE: Colors.Yellow,
	MEMBER_JOIN: Colors.Green,
	MEMBER_LEAVE: Colors.Red,
	MEMBER_UPDATE: Colors.Blue,
	MEMBER_BAN: Colors.DarkRed,
	MEMBER_UNBAN: Colors.Green,
	MESSAGE_DELETE: Colors.Orange,
	MESSAGE_BULK_DELETE: Colors.DarkOrange,
	MESSAGE_UPDATE: Colors.Yellow,
	ROLE_CREATE: Colors.Green,
	ROLE_DELETE: Colors.Red,
	ROLE_UPDATE: Colors.Yellow,
	INVITE_CREATE: Colors.Green,
	INVITE_DELETE: Colors.Red,
	VOICE_STATE_UPDATE: Colors.Purple,
	THREAD_CREATE: Colors.Green,
	THREAD_DELETE: Colors.Red,
	THREAD_UPDATE: Colors.Yellow,
	EMOJI_CREATE: Colors.Green,
	EMOJI_DELETE: Colors.Red,
	EMOJI_UPDATE: Colors.Yellow,
	STICKER_CREATE: Colors.Green,
	STICKER_DELETE: Colors.Red,
	STICKER_UPDATE: Colors.Yellow,
	GUILD_UPDATE: Colors.Blue,
	WEBHOOK_UPDATE: Colors.Yellow
};

const eventEmojis: Record<LogEventType, string> = {
	CHANNEL_CREATE: '📁',
	CHANNEL_DELETE: '🗑️',
	CHANNEL_UPDATE: '✏️',
	MEMBER_JOIN: '📥',
	MEMBER_LEAVE: '📤',
	MEMBER_UPDATE: '👤',
	MEMBER_BAN: '🔨',
	MEMBER_UNBAN: '🔓',
	MESSAGE_DELETE: '🗑️',
	MESSAGE_BULK_DELETE: '🗑️',
	MESSAGE_UPDATE: '✏️',
	ROLE_CREATE: '🎭',
	ROLE_DELETE: '🗑️',
	ROLE_UPDATE: '✏️',
	INVITE_CREATE: '📨',
	INVITE_DELETE: '🗑️',
	VOICE_STATE_UPDATE: '🎤',
	THREAD_CREATE: '🧵',
	THREAD_DELETE: '🗑️',
	THREAD_UPDATE: '✏️',
	EMOJI_CREATE: '😀',
	EMOJI_DELETE: '🗑️',
	EMOJI_UPDATE: '✏️',
	STICKER_CREATE: '🏷️',
	STICKER_DELETE: '🗑️',
	STICKER_UPDATE: '✏️',
	GUILD_UPDATE: '🏠',
	WEBHOOK_UPDATE: '🔗'
};

export interface AuditLogOptions {
	guild: Guild;
	eventType: LogEventType;
	title: string;
	description?: string;
	fields?: Array<{ name: string; value: string; inline?: boolean }>;
	thumbnail?: string;
	footer?: string;
}

export async function getLogChannel(guild: Guild): Promise<TextChannel | null> {
	const channel = guild.channels.cache.get(LOG_CHANNEL_ID) as TextChannel | undefined;

	return channel || null;
}

export async function sendAuditLog(options: AuditLogOptions): Promise<void> {
	const { guild, eventType, title, description, fields, thumbnail, footer } = options;

	const logChannel = await getLogChannel(guild);
	if (!logChannel) return;

	const embed = new EmbedBuilder().setColor(eventColors[eventType]).setTitle(`${eventEmojis[eventType]} ${title}`).setTimestamp();

	if (description) {
		embed.setDescription(description);
	}

	if (fields && fields.length > 0) {
		embed.addFields(fields);
	}

	if (thumbnail) {
		embed.setThumbnail(thumbnail);
	}

	if (footer) {
		embed.setFooter({ text: footer });
	}

	try {
		await logChannel.send({ embeds: [embed] });
	} catch (error) {
		console.error(`Failed to send audit log: ${error}`);
	}
}

export function truncateString(str: string, maxLength: number = 1024): string {
	if (str.length <= maxLength) return str;
	return str.substring(0, maxLength - 3) + '...';
}
