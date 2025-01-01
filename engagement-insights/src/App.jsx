import React, { useState } from 'react';
import InsightsForm from './components/InsightsForm';
import InsightsDisplay from './components/InsightsDisplay';

const App = () => {
  const [insights, setInsights] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl">Engagement Insights</h1>
      </header>
      <main className="p-4">
        <InsightsForm setInsights={setInsights} />
        <InsightsDisplay insights={insights} />
      </main>
    </div>
  );
};

export default App;
