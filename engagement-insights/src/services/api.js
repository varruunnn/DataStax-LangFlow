import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api'; // Your Node.js API URL

export const fetchInsights = async (postType) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/insights`, { postType });
    return response.data;
  } catch (error) {
    console.error('Error fetching insights:', error);
    throw error;
  }
};
