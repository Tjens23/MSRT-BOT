import { google } from  'googleapis'
import { client } from '../index';
import { TextChannel } from 'discord.js';

const youtubeAPI=process.env.YOUTUBE_API_KEY!
const youtubeChannelId = 'YOUR_YOUTUBE_CHANNEL_ID';  // Replace with the YouTube channel ID you want to track
const channelId = '';

const youtube = google.youtube({
  version: 'v3',
  auth: youtubeAPI,
});


let lastVideoId: string | null = null;

async function getLatestVideo() {
  try {
    const res = youtube.search.list({
      channelId: youtubeChannelId,
      order: 'date',
      maxResults: 1,
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
  const videoTitle = video.snippet?.title;
  const videoDescription = video.snippet?.description;

  const message = `New video uploaded: **${videoTitle}**\n\n${videoDescription}\nWatch here: ${videoUrl}`;
  
  const channel: TextChannel = await client.channels.fetch(channelId) as TextChannel;
  if (channel?.isTextBased()) {
    channel.send(message);
  }
}

async function checkForNewVideo() {
  const latestVideo = await getLatestVideo();
  if (latestVideo) {
    if (latestVideo.id.videoId !== lastVideoId) {
      sendVideoUpdate(latestVideo);
      lastVideoId = latestVideo.id.videoId;
    }
  }
}
