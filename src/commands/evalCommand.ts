import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command, CommandOptions } from '@sapphire/framework';
import { Message, PermissionFlagsBits, TextChannel } from 'discord.js';
import { inspect } from 'util';

class Type {
	constructor(private value: any) {}

	get is(): string {
		return typeof this.value;
	}
}

@ApplyOptions<CommandOptions>({
	name: 'eval',
	description: 'Evaulate javascript',
	fullCategory: ['Owner'],
	preconditions: [],
	requiredUserPermissions: [PermissionFlagsBits.Administrator]
})
export default class EvalCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		let code = await args.restResult('string');
		const channel: TextChannel = message.channel as TextChannel;
		if (!code.isOk()) {
			return message.reply('Please provide a code snippet to evaluate.');
		}

		let codeString = code.unwrap();
		const msg = message;
		if (!codeString.length) return msg.reply(`Provide javascript code to evaluate...`);
		codeString = codeString.replace(/[""]/g, '"').replace(/[""]/g, "'");
		let evaled;

		try {
			const start = process.hrtime();
			evaled = eval(codeString);
			if (evaled instanceof Promise) {
				evaled = await evaled;
			}

			const stop = process.hrtime(start);
			const response = [
				`**Output:** \`\`\`js\n${this.clean(inspect(evaled, { depth: 0 }))}\n\`\`\``,
				`**Type:** \`\`\`ts\n${new Type(evaled).is}\n\`\`\``,
				`**Time taken:** \`\`\`${(stop[0] * 1 + stop[1]) / 1e6}ms \`\`\``
			];
			const res = response.join('\n');
			if (res.length < 2000) {
				return await channel.send(res);
			}
		} catch (e) {
			return channel.send(`Error: \`\`\`x1\n${this.clean(e)}\n\`\`\``);
		}
	}

	clean(text: any) {
		if (typeof text === 'string') {
			text = text
				.replace(/`/g, `\`${String.fromCharCode(8203)}`)
				.replace(/@/g, `@${String.fromCharCode(8203)}`)
				.replace(new RegExp(this.container.client.token || '', 'gi'), 'No token for you bitch');
		}
		return text;
	}
}
