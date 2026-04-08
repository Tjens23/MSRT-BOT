import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Times out a user',
	name: 'timeout',
	fullCategory: ['Moderation'],
	aliases: ['mute']
})
export class TimeoutCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const user = await args.pick('member').catch(() => null);
		const reason = await args.rest('string');
		const time = await args.pick('string').catch(() => '10m');

		if (!user) return message.reply('Invalid usage! Please provide a user to timeout.');
		if (!reason) return message.reply('Invalid usage! Please provide a reason for the timeout.');
		if (user.roles.highest.position >= message.member!.roles.highest.position)
			return message.reply('You cannot timeout this user because they have a higher or equal role than you.');

		const duration = this.parseDuration(time);
		if (duration === null) return message.reply('Invalid duration format! Please provide a valid duration (e.g., 10m, 1h, 1d).');

		await user
			.timeout(duration, reason)
			.then(() => {
				message.reply(`${user.user.tag} has been timed out for ${time}. Reason: ${reason}`);
			})
			.catch(() => {
				message.reply('Failed to timeout the user. Please check my permissions and try again.');
			});
	}

	private parseDuration(input: string): number | null {
		const match = /^(\d+)([smhd])$/i.exec(input.trim());
		if (!match) return null;

		const value = Number(match[1]);
		const unit = match[2].toLowerCase();

		if (!Number.isFinite(value) || value <= 0) return null;

		const unitToMs: Record<string, number> = {
			s: 1000,
			m: 60_000,
			h: 3_600_000,
			d: 86_400_000
		};

		return value * unitToMs[unit];
	}
}
