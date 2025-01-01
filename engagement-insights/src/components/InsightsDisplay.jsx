import React from 'react';

const InsightsDisplay = ({ insights }) => {
  if (!insights) return null;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Generated Insights:</h2>
      <ul className="list-disc pl-5">
        {insights.map((insight, index) => (
          <li key={index} className="mb-2">
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsightsDisplay;
