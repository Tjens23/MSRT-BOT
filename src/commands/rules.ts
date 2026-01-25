import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message, EmbedBuilder, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'rules',
	description: 'Displays the server rules',
	requiredUserPermissions: ['Administrator'],
	fullCategory: ['Admin']
})
export class UserCommand extends Command {
	public override async messageRun(message: Message) {
		const channel: TextChannel | null = message.channel as TextChannel;

		const embed1 = new EmbedBuilder()
			.setTitle('**USMC SRT PRINCIPLES**')
			.setThumbnail(message.guild!.iconURL() ?? '')
			.setDescription(
				'*TO: Marines, Guests, Prospective Enlistees in the USMC SRT SERVER. \n\n Please take the time to review our bedrock principles established within the blood, bone, and sinew of our unit.\n\n If there is any disagreement with any of the following principles for an individual at any level of this address, feel free to submit a request for discharge and / or see yourself out of the server.*'
			);

		const embed2 = new EmbedBuilder()
			.setTitle('**MSRT Mission Statement**')
			.setThumbnail(message.guild!.iconURL() ?? '')
			.setDescription(
				`To inspire others to master themselves through our unwavering pursuit of excellent Mil-Sim.

**Our Vision**
We believe that every individual should have the opportunity to improve their lives through their passion.

**Individual Accountability**
We are heavily reliant on good demonstrations of culture by each individual in the unit. We consider ourselves professional in both appearance and deed.

**Measured and Deliberate Progress**
Evaluation for progress relies upon level of activity, demonstration of operator competency, and reflection of the unit culture through your actions.

**Character First - Rank Second**
Pulling rank is a sign of weakness. We seek leaders, not admin, nor rank climbers in our unit. A leader earns their position through respect from their fellow marines. This respect is earned as a reflection of their actions both internal and external to our unit.

**Respect the Leadership**
If any marine volunteers to lead a team or element, all marines joining their stack must respect their calls and leadership of the team. Be responsible with your actions to ensure you are supporting the team rather than acting independently. Respect the team lead's priority in communication.

**After Action Debriefs**
During official unit operations, we include an objective review of the performance for both the individual and the team to identify points of improvement. This feedback is not taken personally, ego and pride are barriers to taking accountability for your personal improvement as an Officer / Operator.

This is also where we stress test our standing CQB SOP's to identify where evolution is required.

**Quality Over Quantity**
Our unit is highly selective for appropriate attitude and conduct befitting the acceptance of a spot in a professional military law enforcement unit. We will at times rely upon role-play to enrich the experience for unit members.

**Sense of Humor**
We have times and places where we can loosen our collars as you cannot build a great team without a sense of humor. A candidate must understand the context for both and act accordingly.

**MSRT Training-Forward Philosophy**
We believe in forward training public players to give them a proper experience in the games we play. This also allows them to make the decision for themselves if they would like to play tactical MilSim on a higher level. Whether they seek enlistment or not, they have received a higher quality experience and skills without obligation to my unit or marines.

**Brother Unit Mentality**
We do not see the MilSim community as a zero-sum game. We view the RoN MilSim's community as a whole aligned in effort to enhance the game for the average player experience. We treat partner unit personnel as honored guests in our server and brothers in-game until proven otherwise.

Word of warning, if you join our unit with intent to sabotage, our hunt for you begins the day you join our server. You will find no friend and no comfort. Worst of all, you will be consigned in silence to witness the flourishing of our unit and culture as it takes hold in the community at large.

**Intellectual Theft**
Any member of this unit who is found to be using / copying / ripping / plagiarizing from another individual or unit without their express and confirmed permission will meet swift and severe consequences. Committing this act is a dishonorable reflection of personal character and upon our unit's cultural values.`
			);

		const embed3 = new EmbedBuilder()
			.setTitle('**OUR MOTTOS**')
			.setThumbnail(message.guild!.iconURL() ?? '')
			.setDescription(
				`**VINCIT QUI SE VINCIT**
*"He conquers who conquers himself"*

A person who overcomes their weaknesses or failings, who is able to control their feelings and actions, wins life's most important battle. It is a conversion of a phrase by Publilius Syrus, a Latin writer of maxims ( 1st century BC ).

**SEMPER FIDELIS - A.K.A. Semper Fi**
*"Always Faithful"*

Semper Fidelis is the motto of every Marine—an eternal and collective commitment to the success of our battles, the progress of our Nation, and the steadfast loyalty to the fellow Marines we fight alongside.

Make those we seek to emulate proud. That is all.
*MSRT Unit Command*`
			);

		const embed4 = new EmbedBuilder()
			.setTitle('**U.S.M.C. SPECIAL REACTION TEAM RULES**')
			.setThumbnail(message.guild!.iconURL() ?? '')
			.setDescription(
				`1. No spamming in any of the chats.

2. Use each chat as it should be used.

3. Racially insensitive memes/posts/chats on the server will not be tolerated.

4. No bigotry or hate speech.

5. Be kind to all members of the unit.

6. If you have an issue with a member or squad leader you should fill out an HR Form.

7. Be conscious of our allowed ages. NSFW is disallowed on the server.

8. Tread moderately with profanity.

9. Do not abuse the voice channels.

10. No verbal or sexual harassment.

11. No expression of self-harm.

12. Only use "@Here" in text channels. Use of "@Everyone" is strictly prohibited (Officers are only allowed to use "@Everyone")

13. No exposure of people's identity (Doxxing) (Picture, Name Etc...) without their permission.

14. Refrain from dogmatic speech including: politics, religion, other unsolicited belief patterns.

15. No pornography, gore, shock content, or images, texts, audios, or videos intended to shock, offend, or disgust may be posted, transmitted over voice, or sent to members privately through any of our unit communication channels.

16. Members of our unit must be 18  or above no exceptions.

17. Multi-clanning, membership in multiple Ready or Not units, is not prohibited outright. However, if you seek positions of responsibility in MSRT you will have certain commitments to fulfill. We will be monitoring activity and inquire if inactive. We request any officer who feels they can no longer remain active in our server, to reach out to staff to have their roles/access adjusted.

18. You must understand that while playing inside other units or representing other units with our tags or identity. You are an ambassador for our unit and your actions will reflect upon us, and Marines must be mindful of their conduct and their representation of MSRT.

19. Make an open effort at all times to assist, make welcome, and include new members. Make a concerted effort to make new people feel good about their choice to join the Marine Special Reaction Team.`
			);

		const embed5 = new EmbedBuilder()
			.setTitle('**PERSONAL CONDUCT**')
			.setThumbnail(message.guild!.iconURL() ?? '')
			.setDescription(
				`1. You are a member of the Marine Special Reactions Team unit. You have a responsibility as a member, and friend to other members, to ensure you are helping to create and foster a friendly, safe, and fun environment to play MilSim in.

2. Respect is often used in other units exclusively when referring to hierarchy and "superiors." In the MSRT, you only have the requirement to treat everyone with respect as a fellow player in our unit. You respect their time, commitment, ability, and desire to play MilSim just as you'd respect your own, not only because their rank is bigger than yours.

3. While you respect other players as fellow members out of game, in game you must also respect leadership (whether by rank or position being played) and their instructions. This allows us to accurately simulate a military environment and play at our best performance. While feedback and constructive criticism are always welcome, there is a time and a place, and in-game there needs to be someone giving commands and in charge. Save feedback for AAR (After Action Report) or de-brief.

4. You represent our unit at all times when you interact with the RoN community. You must remain respectful to other groups and people, you must conduct yourself maturely and seriously to other members of the RoN community if you can be identified as MSRT, and you must always be consciously thinking about if your actions reflect positively on us.

5. You must always keep an open mind. We are constantly stress testing and playtesting new features, tactics, techniques, server stuff, etc. Or, we are messing around with how the unit is run and organized. Adjust, adapt, and adopt.`
			);

		const embed6 = new EmbedBuilder()
			.setTitle('**PUNISHMENT**')
			.setThumbnail(message.guild!.iconURL() ?? '')
			.setDescription(
				`1. The most minor punishment is a verbal, formal warning. This warning is the first step for the first recent offense of a minor rule. Warnings are less of a punishment, and more of a friendly reminder not to repeat actions in violation of our rules. After the verbal warning is issued, the offending officer is now recognized as being aware of the issue to fix. We expect the officer to adjust their behavior accordingly. Warnings expire after 30 days.

2. Re-offense of minor rule / Multi minor rule violations within 30 days or Major rule violation.
If you reoffend another minor rule within 30 days of your last warning, or you violate a major rule, then the next step is as follows: you must have a conversation with your leaders and unit leaders to identify your issues, discuss where you went wrong, and how to move forward. Chastising you is not the objective of this conversation—we just must make sure you're aware of what you did wrong and the next steps to fixing it. If the offense is very minor ( i.e. two negligent discharges in two months ), this may be just a quick check-in akin to a warning. If the offense is more major ( i.e. the use of racist language or behavior ), this could be a more serious discussion of your conduct. This is where the punishment for minor rule breaks ends. If you again reoffend a minor rule, you will repeat this punishment until there are no more offenses, unless you are deemed to be offending out of malice.

3. If, within 30 days of a major rule violation, you reoffend that same rule, there will be another conversation with your leadership, a potential court-martial, as well as removal from a leadership position. We will establish a probationary period of two months, where you will officially be "on thin ice." Following the end of the two months of probation, your reduction in rank may be reversed if your behavior and attitude have improved, and you will again be eligible for leadership positions.

4. If, while in your probationary period, you then break a major rule or repeatedly break minor rules, you will receive a dishonorable discharge from the unit and you likely will be either permanently prohibited from rejoining or will be given a term-limit ( period of time ) before reenlistment is allowed. Our entire punishment program is designed to, over many months or even years, give you many chances to amend your behavior.`
			);

		const embed7 = new EmbedBuilder()
			.setTitle('**ENLISTMENT**')
			.setThumbnail(message.guild!.iconURL() ?? '')
			.setDescription('**CLICK BUTTON TO SUBMIT AN ENLISTMENT TICKET TODAY!**');

		const firstMessage = await channel.send({ embeds: [embed1] });
		await channel.send({ embeds: [embed2] });
		await channel.send({ embeds: [embed3] });
		await channel.send({ embeds: [embed4] });
		await channel.send({ embeds: [embed5] });
		await channel.send({ embeds: [embed6] });

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel('Submit a Ticket')
				.setStyle(ButtonStyle.Link)
				.setURL('https://discord.com/channels/1019121062312673291/1019129936780468304/1020138693517901926'),
			new ButtonBuilder().setLabel('Back to the Top').setStyle(ButtonStyle.Link).setURL(firstMessage.url)
		);

		channel.send({ embeds: [embed7], components: [row] });
	}
}
