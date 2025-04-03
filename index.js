// Discord Avatar Proxy Service for Railway
// Save this file as index.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Enable CORS for your GitHub Pages domain
app.use(cors({
  origin: '*', // Replace with your GitHub Pages URL in production
  methods: ['GET']
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('Discord avatar proxy service is running');
});

// Discord avatar proxy endpoint
app.get('/avatar', async (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId parameter' });
  }
  
  try {
    // Discord API requires a bot token for authentication
    const botToken = process.env.DISCORD_BOT_TOKEN;
    
    // Fetch user information from Discord API
    const response = await axios.get(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        'Authorization': `Bot ${botToken}`
      }
    });
    
    const user = response.data;
    
    // Construct avatar URL using Discord's CDN
    // https://discord.com/developers/docs/reference#image-formatting
    let avatarUrl;
    
    if (user.avatar) {
      // Format: https://cdn.discordapp.com/avatars/user_id/user_avatar.png
      // For animated avatars (gif), use .gif extension if the hash starts with "a_"
      const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.${extension}?size=256`;
    } else {
      // Default avatar if user doesn't have a custom one
      // Default avatars are based on discriminator or user ID modulo 5
      const defaultAvatarNumber = (parseInt(userId) >> 22) % 6;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
    }
    
    // Return the avatar URL
    res.status(200).json({
      avatarUrl: avatarUrl,
      username: user.username,
      displayName: user.global_name || user.username
    });
  } catch (error) {
    console.error('Error fetching Discord avatar:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid Discord bot token'
      });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Discord user not found'
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch Discord avatar',
      details: error.message
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Discord avatar proxy service running on port ${PORT}`);
});
