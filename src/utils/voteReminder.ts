import { container } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from 'discord.js';

const UNIT_ID = process.env.MILSIM_UNIT_ID!;
if (!UNIT_ID) throw new Error('Missing env variable: MILSIM_UNIT_ID');

const API_URL = `https://milsimunits.com/api/units/${UNIT_ID}`;

interface MilSimUnit {
    name: string;
    clan_tag: string;
    member_count: number;
    current_vote_count: number;
    is_recruiting: boolean;
    insignia_url: string;
    banner_url: string;
}

export async function sendVoteReminder(channelId: string): Promise<void> {
    const response = await fetch(API_URL);

    if (!response.ok) {
        container.logger.error(`failed to fetch unit data: ${response.status} ${response.statusText}`);
        return;
    }

    const unit = await response.json() as MilSimUnit;
    container.logger.info(`Fetched unit: ${unit.name}, votes today: ${unit.current_vote_count}`);

    const embed = new EmbedBuilder()
        .setTitle(`🗳️ Daily Vote Reminder — ${unit.clan_tag}`)
        .setDescription(`Support **${unit.name}** by casting your daily vote on MilSim Units!`)
        .addFields(
            { name: '📊 Votes Today', value: `${unit.current_vote_count}`, inline: true },
            { name: '👥 Members', value: `${unit.member_count}`, inline: true },
        )
        .setThumbnail(unit.insignia_url)
        .setColor(0x48462d)
        .setFooter({ text: 'VINCIT QUI SE VINCIT — He conquers who conquers himself' })
        .setTimestamp();

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel('Vote for MSRT')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://milsimunits.com/unit/${process.env.MILSIM_VOTE_SLUG!}`)
            .setEmoji('🗳️')
    );

    const channel = await container.client.channels.fetch(channelId);

    if (!channel || !(channel instanceof TextChannel)) {
        container.logger.warn('Provided channel ID is not a valid text channel');
        return;
    }

    await channel.send({
        content: `<@&${process.env.VOTE_REMINDER_ROLE!}>`,
        embeds: [embed],
        components: [button],
        allowedMentions: {
            roles: [process.env.VOTE_REMINDER_ROLE!]
        }
    });

    container.logger.info('Vote reminder sent!');
}