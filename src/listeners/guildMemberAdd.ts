import { Listener } from '@sapphire/framework';
import { ChannelType, Colors, EmbedBuilder, GuildMember, Role, TextChannel } from 'discord.js';

export class Joinevent extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: 'guildMemberAdd'
		});
	}

	public async run(member: GuildMember): Promise<void> {
		const channel: TextChannel = member.guild.channels.cache.find((channel) => channel.name === 'welcome') as TextChannel;
		const logChannel: TextChannel = member.guild.channels.cache.find((channel) => channel.name === 'logs') as TextChannel;
		if (!channel) {
			logChannel.send(`${channel} wasn't found, creating one for you!`);
			member.guild.channels.create({
				name: 'welcome',
				type: ChannelType.GuildText,
				parent: '1333202423619260417',
				permissionOverwrites: [
					{
						id: member.guild.roles.everyone.id,
						deny: ['SendMessages']
					}
				]
			});
		}

		const welcomeEmbed = new EmbedBuilder()
			.setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
			.setColor(Colors.Blurple)
			.setDescription(`Welcome to ${member.guild.name}, ${member}!`);
		await channel.send({ embeds: [welcomeEmbed] });

		const rolesToAdd: Array<Role> = [];

    rolesToAdd.forEach((role: Role) => {
			member.roles.add(role.id);
		});
	}
}
