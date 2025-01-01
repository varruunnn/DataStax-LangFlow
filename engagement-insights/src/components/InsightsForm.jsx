import React, { useState } from 'react';
import { fetchInsights } from '../services/api';

const InsightsForm = ({ setInsights }) => {
  const [postType, setPostType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const insights = await fetchInsights(postType);
      setInsights(insights);
    } catch (error) {
      alert('Error fetching insights. Check console for details.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <label htmlFor="postType" className="block mb-2">
        Enter Post Type (e.g., carousel, reels, static images):
      </label>
      <input
        type="text"
        id="postType"
        value={postType}
        onChange={(e) => setPostType(e.target.value)}
        className="border p-2 w-full mb-4"
        required
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded">
        Get Insights
      </button>
    </form>
  );
};

export default InsightsForm;
