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

  export function createTranscript(
    channel: TextChannel,
    options?: TranscriptOptions
  ): Promise<AttachmentBuilder>;
}
