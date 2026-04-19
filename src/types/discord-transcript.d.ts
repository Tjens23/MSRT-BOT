declare module 'discord-transcript' {
	import { TextChannel, Collection, Message, AttachmentBuilder } from 'discord.js';

	interface TranscriptOptions {
		limit?: number;
		returnType?: 'buffer' | 'attachment' | 'string';
		filename?: string;
		saveImages?: boolean;
		poweredBy?: boolean;
		footerText?: string;
	}

	export function generate(
		message: any,
		messageCollection: Collection<string, Message>,
		channel: TextChannel,
		options?: TranscriptOptions
	): Promise<AttachmentBuilder | Buffer | string>;

	export function createTranscript(channel: TextChannel, options?: TranscriptOptions): Promise<AttachmentBuilder>;
}

declare module 'discord-transcript-v2' {
	import { TextChannel, Collection, Message, AttachmentBuilder, GuildTextBasedChannel } from 'discord.js';

	export enum ExportReturnType {
		Attachment = 'attachment',
		Buffer = 'buffer',
		String = 'string'
	}

	export interface TranscriptOptions {
		/** Max messages to fetch, -1 for all */
		limit?: number;
		/** Return type: attachment (default), buffer, or string */
		returnType?: ExportReturnType;
		/** Output file name */
		filename?: string;
		/** Download & embed images into the file */
		saveImages?: boolean;
		/** Show footer credit */
		poweredBy?: boolean;
		/** Custom footer text ({number} = count, {s} = plural) */
		footerText?: string;
		/** Page favicon URL */
		favicon?: 'guild' | string;
		/** Server-side hydrate web components */
		hydrate?: boolean;
	}

	export function createTranscript(channel: GuildTextBasedChannel, options?: TranscriptOptions): Promise<AttachmentBuilder>;

	export function generateFromMessages(
		messages: Collection<string, Message>,
		channel: GuildTextBasedChannel,
		options?: TranscriptOptions
	): Promise<AttachmentBuilder | Buffer | string>;
}
