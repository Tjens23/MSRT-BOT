import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';
import { envParseArray } from '../lib/env-parser';

const OWNERS = envParseArray('OWNERS');


export class OwnerOnlyPrecondition extends Precondition {
  public override async messageRun(message: Message) {
    return this.checkOwner(message.author.id);
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    return this.checkOwner(interaction.user.id);
  }

  public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
    return this.checkOwner(interaction.user.id);
  }

  private async checkOwner(userId: string) {
    return OWNERS.includes(userId)
      ? this.ok()
      : this.error({ message: 'Only the bot owner can use this command!' });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    OwnerOnly: never;
  }
}
