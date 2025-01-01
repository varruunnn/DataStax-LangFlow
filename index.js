import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataAPIClient } from '@datastax/astra-db-ts';

// Load environment variables
dotenv.config();

// Initialize Astra DB client
const client = new DataAPIClient(process.env.ASTRA_DB_TOKEN);
const db = client.db(process.env.ASTRA_DB_URL);
const collectionName = 'social_engagement';
let collection;

// Define Express app
const app = express();
app.use(cors());
app.use(express.json());

// Sample data for engagement
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

// Initialize database and collection
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


  app.post('/api/insights', async (req, res) => {
    const { postType } = req.body;
  
    try {
      // Query the Astra DB for engagement data
      const results = await collection.find({ postType });
  
      // Analyze data and pass it to Langflow for GPT insights
      const averageEngagement = results.reduce((acc, curr) => acc + curr.engagement, 0) / results.length;
      const gptInsights = await getGPTInsights(postType, averageEngagement);
  
      res.json(gptInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).send('Failed to generate insights.');
    }
  });
  
  // Function to interact with Langflow (Mock)
  async function getGPTInsights(postType, averageEngagement) {
    // Simulated Langflow interaction
    return [
      `The average engagement for ${postType} posts is ${averageEngagement}.`,
      `${postType} posts perform better than other formats by 20%.`,
    ];
  }
  
  
// API Endpoints
// Add a new post to the collection
app.post('/api/posts', async (req, res) => {
    try {
      const newPost = req.body; // Expecting post details in the request body
  
      // Validate the incoming post
      if (!newPost.post_type || !newPost.engagement) {
        return res.status(400).json({ error: 'Post type and engagement data are required' });
      }
  
      // Insert the new post into the collection
      const result = await collection.insertOne(newPost);
      res.status(201).json({ message: 'Post added successfully', postId: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
// Fetch analytics by post type
app.get('/api/analytics', async (req, res) => {
  try {
    const posts = await collection.find({}).toArray();
    const analytics = posts.reduce((acc, post) => {
      const type = post.post_type;
      if (!acc[type]) {
        acc[type] = { total_posts: 0, total_likes: 0, total_shares: 0, total_comments: 0 };
      }
      acc[type].total_posts += 1;
      acc[type].total_likes += post.engagement.likes;
      acc[type].total_shares += post.engagement.shares;
      acc[type].total_comments += post.engagement.comments;
      return acc;
    }, {});

    const result = Object.entries(analytics).map(([postType, data]) => ({
      post_type: postType,
      avg_likes: (data.total_likes / data.total_posts).toFixed(2),
      avg_shares: (data.total_shares / data.total_posts).toFixed(2),
      avg_comments: (data.total_comments / data.total_posts).toFixed(2),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(console.error);
