import React, { useState } from 'react';
import axios from 'axios';
import './App.css'
function App() {
  const [postType, setPostType] = useState('');
  const [insights, setInsights] = useState(null);
  const [fullInsights, setFullInsights] = useState(null); 
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setError('');
    setInsights(null);

    if (!postType) {
      setError('Post type is required!');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3001/api/insights/${postType}`);
      setInsights(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong!');
    }
  };

  const fetchFullInsights = async () => {
    setError('');
    setFullInsights(null);

    try {
      const response = await axios.get('http://localhost:3001/api/insights');
      setFullInsights(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong!');
    }
  };

  return (
    <div >
      <h1 >Social Engagement Insights</h1>
      <div>
        <input
          type="text"
          placeholder="Enter Post Type (e.g., carousel)"
          value={postType}
          onChange={(e) => setPostType(e.target.value)}
        />
        <button
          onClick={fetchInsights}
        >
          Get Insights
        </button>
        <button
          onClick={fetchFullInsights}
        >
          Get Full Insights
        </button>
      </div>

      {error && <div >{error}</div>}
      {insights && (
        <div >
          <h3 >Insights for {postType} Posts:</h3>
          <ul >
            {insights.insights.map((insight, index) => (
              <li key={index} >
                {insight}
              </li>
            ))}
          </ul>
          <h4 >Engagement Data:</h4>
          <p >Average Likes: {insights.engagementData.avgLikes}</p>
          <p >Average Shares: {insights.engagementData.avgShares}</p>
          <p >Average Comments: {insights.engagementData.avgComments}</p>
        </div>
      )}
      {fullInsights && (
        <div >
          <h3>Full Insights:</h3>
          <ul>
            {fullInsights.insights.map((insight, index) => (
              <li key={index} >
                {insight}
              </li>
            ))}
          </ul>
          <h4>Engagement Data by Post Type:</h4>
          {Object.keys(fullInsights.engagementDataByType).map((type) => (
            <div key={type}>
              <h5>{type} Posts:</h5>
              <p >Average Likes: {fullInsights.engagementDataByType[type].avgLikes}</p>
              <p >Average Shares: {fullInsights.engagementDataByType[type].avgShares}</p>
              <p >Average Comments: {fullInsights.engagementDataByType[type].avgComments}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
