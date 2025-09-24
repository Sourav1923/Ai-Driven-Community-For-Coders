import React from 'react';

const TestComponent = () => {
    const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
    const isConfigured = apiKey && apiKey !== 'demo-key' && apiKey !== 'your-rapidapi-key-here';
    
    return (
        <div className="test-component bg-blue-900 text-white p-4 rounded-lg m-4">
            <h2 className="text-xl font-bold mb-2">Test Component</h2>
            <p>If you can see this, the basic React setup is working!</p>
            <p className="text-sm mt-2">Check the console for any errors.</p>
            <div className="mt-4 p-2 bg-blue-800 rounded">
                <p className="text-sm">
                    <strong>API Key Status:</strong> {isConfigured ? '✅ Configured' : '❌ Not Configured'}
                </p>
                <p className="text-xs mt-1">
                    Environment: {import.meta.env.MODE}
                </p>
            </div>
        </div>
    );
};

export default TestComponent; 