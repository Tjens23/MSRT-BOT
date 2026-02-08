import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message, TextChannel, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'recruit',
	description: 'Send the USMC SRT welcome message for new recruits',
	requiredClientPermissions: ['SendMessages'],
	requiredUserPermissions: ['Administrator']
})
export class Recruit extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('recruit').setDescription('Send the USMC SRT welcome message for new recruits')
		);
	}

	public override async messageRun(message: Message, _args: Args) {
		const channel = message.channel as TextChannel;
		const canSend = (await channel.isSendable()) ? channel.sendTyping() : null;
		if (!canSend) return message.reply('I am missing permission to send messages in this channel. Please check my permissions and try again.');
		await setTimeout(() => {
			message.delete();
		}, 3000);

		// Split the content into multiple embeds due to Discord's character limits
		const embed1 = new EmbedBuilder()
			.setTitle('🎖️ WELCOME TO THE USMC SRT')
			.setDescription(
				`Congratulations on your application being accepted. Before continuing with your IET process, please take a minute to get familiar with the server layout. This channel contains all of the information you need to know.

This server is currently laid out as a battalion.

- First company (1st COY) consists of 3 platoons, Cerberus (Ready Or Not), Specter (Ground Branch), and Green Team, our training platoon.

- Second company (2nd COY) consists of the reserves platoon.

Once you complete your OQA (RoN), or your BRQ (GB), you will be assigned a platoon. You can join both platoons, but you'll need to complete both IET processes.`
			)
			.setColor('#FF6B35');

		const embed2 = new EmbedBuilder()
			.setTitle('📋 Server Tour - Bulletin')
			.setDescription(
				`**<#1090008731300937778>** contains important info such as our TASKORG, staff shops, rank structure, event standards and conduct expectations that need to be reviewed by all members.

**<#1102302307653263480>** is a channel for general announcements to all server members, from the leadership.

**<#1019137754292043818>** contains recaps from previous muster events, containing imporant unit updates, promotions and awards.

**<#1019137721664553031>** is a channel for all event announcements coming from leadership. Mainly musters, accuracy assessments for RoN etc.

**<#1106269700511502507>** is a channel dedicated to specific role play related "news broadcasts" and other items related to in game campaigns and certain other operations`
			)
			.setColor('#FF6B35');

		const embed3 = new EmbedBuilder()
			.setTitle('🎫 Forms and Tickets')
			.setDescription(
				`**<#1178147137507315712>** is our internal Human Resources ticket. If you have an issue with ANY member of this server regardless of rank and or role, please fill our an ARH ticket and your case will be handled by an ARH officer acting outside of the chain of command.

**<#1019137989634437120>** is a ticket to apply to join our staff team. While the rank requirement is mostly E-3 and up, we encourage our marines to spend some time with the server to get to know how everything works before jumping into a staff role. More information on the various roles and duties can be found in the ticket.

**<#1050265399914139668>** is a ticket to be filled out when taking a leave of absence. If for any reason you foresee yourself not being able to make squad commitments for a set amount of time, please fill out an LOA ticket and a member of staff will process your ticket.`
			)
			.setColor('#FF6B35');

		const embed4 = new EmbedBuilder()
			.setTitle('🍽️ Chow Hall & 🔧 Modding')
			.setDescription(
				`**Chow Hall:**
**<#1019140307134185502>** is a channel for general chat.
**<#1019140371038621717>** is a channel for media (no nsfw or gore/shock content).
**<#1019140348833968198>** is a channel for memes (no nsfw or gore/shock content).
**<#1019140398364504074>** is our pickup games channel. If you would like to play a specific game, such as ready or not, then ping @Ready or Not or @here. Please refrain from using @everyone, @Marine, or @Recruit.

**Modding:**
Under the **<#1019389371717255218>** channel, there is an MSRT modpack. Before your initial training you are expected to have downloaded and installed the MSRT modpack. If you have questions regarding mod installation, please refer to the **<#1064713901696102460>** channel and if you need further support, you may refer to **<#1043565867729960982>**.`
			)
			.setColor('#FF6B35');

		const embed5 = new EmbedBuilder()
			.setTitle('🎓 MSRT Training')
			.setDescription(
				`Before training, recruits will be placed in Green Team, a platoon designed to develop foundational operational and communication based skills that are essential to unit operations. More info can be found in **<#1178021210815205438>**.

Feel free to review the **<#1406752279817617580>**. While you will be taught everything you need to know to become a fully blooded marine in your OQT/BRQ, you can always review the material for a refresher.

All green team announcements, updates and other imporant info will be posted in **<#1178021877818597477>**.

OQT/As, BRQs and other Green Team events will be posted in **<#1178021877818597477>**. Scheduled events will appear on that channel and the "Events" tab at the very top above the server stats. Recruits have a maximum of 30 days to finish their IET process, otherwise they are discharged.

If you have any further questions, do not hesitate to consult through your ticket, or ask in **<#1178021525211856896>**.

**It's good to have you here, MSRT wishes you a pleasant stay, and we'll see you on the field.**`
			)
			.setColor('#FF6B35');

		try {
			await channel.send({ embeds: [embed1] });
			await channel.send({ embeds: [embed2] });
			await channel.send({ embeds: [embed3] });
			await channel.send({ embeds: [embed4] });
			await channel.send({ embeds: [embed5] });
		} catch (error) {
			console.error('Error sending recruit welcome message:', error);
			await message.reply('An error occurred while sending the welcome message. Please try again later.');
		}
	}
}
