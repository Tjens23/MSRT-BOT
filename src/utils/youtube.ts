import { google } from 'googleapis';
import { client } from '../index';
import { TextChannel } from 'discord.js';

const youtubeAPI = process.env.YOUTUBE_API_KEY!;
const youtubeChannelId = 'YOUR_YOUTUBE_CHANNEL_ID';  // Replace with the YouTube channel ID you want to track
const discordChannelId = 'YOUR_DISCORD_CHANNEL_ID';  // Replace with the Discord channel ID where updates will be sent

const youtube = google.youtube({
  version: 'v3',
  auth: youtubeAPI,
});

let lastVideoId: string | null = null;

async function getLatestVideo() {
  try {
    const res = await youtube.search.list({
      part: 'snippet',
      channelId: youtubeChannelId,
      order: 'date',
      maxResults: 1,
      type: 'video',
    });

    const video = res.data.items?.[0];
    if (video) {
      return video;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return null;
  }
}

async function sendVideoUpdate(video: any) {
  const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
  const videoTitle = video.snippet?.title || 'Untitled';
  const videoDescription = video.snippet?.description || 'No description available.';

  const message = `📢 **New Video Uploaded!**\n🎬 **${videoTitle}**\n📄 ${videoDescription}\n▶️ Watch here: ${videoUrl}`;
  
  try {
    const channel = await client.channels.fetch(discordChannelId) as TextChannel;
    if (channel?.isTextBased()) {
      await channel.send(message);
      console.log(`Video update sent: ${videoTitle}`);
    }
  } catch (err) {
    console.error("Failed to send video update:", err);
  }
}

async function checkForNewVideo() {
  const latestVideo = await getLatestVideo();
  if (latestVideo) {
    if (latestVideo.id.videoId !== lastVideoId) {
      await sendVideoUpdate(latestVideo);
      lastVideoId = latestVideo.id.videoId;
    }
  }
}

setInterval(checkForNewVideo, 5 * 60 * 1000);
