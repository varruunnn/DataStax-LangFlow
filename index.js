import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';
import OpenAI from 'openai';
dotenv.config();
const client = new DataAPIClient(process.env.ASTRA_DB_TOKEN);
const db = client.db(process.env.ASTRA_DB_URL);
const collectionName = 'social_engagement';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
let collection;
const app = express();
app.use(cors());
app.use(express.json());
const mockData = [
  {
    id: '1',
    post_type: 'carousel',
    engagement: { likes: 100, shares: 50, comments: 30 },
  },
  {
    id: '2',
    post_type: 'reels',
    engagement: { likes: 200, shares: 70, comments: 100 },
  },
  {
    id: '3',
    post_type: 'static',
    engagement: { likes: 50, shares: 20, comments: 10 },
  },
];
async function initializeDatabase() {
  try {
    const collections = await db.listCollections();
    const collectionExists = collections.some(
      (col) => col.name === 'social_engagement'
    );

    if (!collectionExists) {
      await db.createCollection('social_engagement');
      console.log('Collection created: social_engagement');
    } else {
      console.log('Collection already exists: social_engagement');
    }

    collection = db.collection('social_engagement');
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  }
}
app.post('/api/posts', async (req, res) => {
  try {
    const newPost = req.body;
    if (!newPost.post_type || !newPost.engagement) {
      return res.status(400).json({ error: 'Post type and engagement data are required' });
    }
    const result = await collection.insertOne(newPost);
    res.status(201).json({ message: 'Post added successfully', postId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/posts', async (req, res) => {
    try {
      const newPost = req.body;
      if (!newPost.post_type || !newPost.engagement) {
        return res.status(400).json({ error: 'Post type and engagement data are required' });
      }
      const result = await collection.insertOne(newPost);
      res.status(201).json({ message: 'Post added successfully', postId: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
app.post('/api/insights', async (req, res) => {
  const { postType } = req.body;
  try {
    const results = await collection.find({ postType });
    const averageEngagement = results.reduce((acc, curr) => acc + curr.engagement, 0) / results.length;
    const gptInsights = await getGPTInsights(postType, averageEngagement);
    res.json(gptInsights);
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).send('Failed to generate insights.');
  }
});
async function getBasicInsights(postType, engagementData) {
  return [
    `Average engagement for ${postType} posts: ${engagementData.avgLikes} likes, ${engagementData.avgShares} shares, ${engagementData.avgComments} comments`,
    `Total engagement score: ${engagementData.avgLikes + engagementData.avgShares * 2 + engagementData.avgComments * 3}`
  ];
}

app.get('/api/insights/:postType', async (req, res) => {
  const { postType } = req.params;

  try {
    const cursor = collection.find({ post_type: postType });
    const results = await cursor.toArray();
    
    if (!results.length) {
      return res.status(404).json({ error: `No posts found for type: ${postType}` });
    }

    const engagementData = results.reduce((acc, post) => ({
      avgLikes: acc.avgLikes + post.engagement.likes,
      avgShares: acc.avgShares + post.engagement.shares,
      avgComments: acc.avgComments + post.engagement.comments
    }), { avgLikes: 0, avgShares: 0, avgComments: 0 });

    Object.keys(engagementData).forEach(key => {
      engagementData[key] = Math.round(engagementData[key] / results.length);
    });

    try {
      const insights = await getGPTInsights(postType, engagementData);
      res.json({ insights, engagementData });
    } catch (error) {
      const basicInsights = await getBasicInsights(postType, engagementData);
      res.json({ insights: basicInsights, engagementData });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/insights/:postType', async (req, res) => {
  const { postType } = req.params;

  try {
    const cursor = collection.find({ post_type: postType });
    const results = await cursor.toArray();
    
    if (!results.length) {
      return res.status(404).json({ error: `No posts found for type: ${postType}` });
    }

    const engagementData = results.reduce((acc, post) => ({
      avgLikes: acc.avgLikes + post.engagement.likes,
      avgShares: acc.avgShares + post.engagement.shares,
      avgComments: acc.avgComments + post.engagement.comments
    }), { avgLikes: 0, avgShares: 0, avgComments: 0 });

    Object.keys(engagementData).forEach(key => {
      engagementData[key] = Math.round(engagementData[key] / results.length);
    });

    const insights = await getGPTInsights(postType, engagementData);
    res.json({ insights, engagementData });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/insights', async (req, res) => {
  try {
    const postTypes = ['carousel', 'static', 'reels'];
    const engagementDataByType = {};
    for (const postType of postTypes) {
      const results = await collection.find({ post_type: postType }).toArray();
      if (results.length) {
        const totalEngagement = results.reduce((acc, post) => ({
          avgLikes: acc.avgLikes + post.engagement.likes,
          avgShares: acc.avgShares + post.engagement.shares,
          avgComments: acc.avgComments + post.engagement.comments,
        }), { avgLikes: 0, avgShares: 0, avgComments: 0 });
        engagementDataByType[postType] = {
          avgLikes: Math.round(totalEngagement.avgLikes / results.length),
          avgShares: Math.round(totalEngagement.avgShares / results.length),
          avgComments: Math.round(totalEngagement.avgComments / results.length),
        };
      } else {
        engagementDataByType[postType] = { avgLikes: 0, avgShares: 0, avgComments: 0 };
      }
    }
    const insights = [];
    if (engagementDataByType.carousel && engagementDataByType.static) {
      const carouselEngagement = engagementDataByType.carousel.avgLikes +
        engagementDataByType.carousel.avgShares +
        engagementDataByType.carousel.avgComments;
      const staticEngagement = engagementDataByType.static.avgLikes +
        engagementDataByType.static.avgShares +
        engagementDataByType.static.avgComments;
      if (staticEngagement > 0) {
        const higherEngagement = ((carouselEngagement - staticEngagement) / staticEngagement) * 100;
        insights.push(`Carousel posts have ${Math.round(higherEngagement)}% higher engagement than static posts.`);
      }
    }
    if (engagementDataByType.reels && engagementDataByType.static) {
      const reelsComments = engagementDataByType.reels.avgComments;
      const staticComments = engagementDataByType.static.avgComments;
      if (staticComments > 0) {
        const commentMultiplier = (reelsComments / staticComments).toFixed(1);
        insights.push(`Reels drive ${commentMultiplier}x more comments compared to static posts.`);
      }
    }
    res.json({
      insights,
      engagementDataByType,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(console.error);
