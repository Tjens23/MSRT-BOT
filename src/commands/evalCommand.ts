import {ApplyOptions} from "@sapphire/decorators";
import {Args, Command, CommandOptions} from "@sapphire/framework";
import {Message} from "discord.js";

@ApplyOptions<CommandOptions>({
    name: 'eval',
    description: 'Evaulate javascript',
    fullCategory: ['Owner'],
    preconditions: ['OwnerOnly'],
})

export default class EvalCommand extends Command {
    public override async messageRun(message: Message, args: Args) {
        const code = await args.restResult('string');
        if (!code.isOk()) {
            return message.reply('Please provide a code snippet to evaluate.');
        }

        try {
            const result = eval(code.unwrap());
            return message.reply(`Result: ${result}`);
        } catch (error: any) {
            return message.reply(`Error: ${error.message}`);
        }
    }
}