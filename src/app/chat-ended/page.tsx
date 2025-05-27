'use client'; // Good practice for simple static pages, though not strictly necessary if no client hooks

import React from 'react';
// Optional: If you have a standard page layout component, import and use it.
// import PageLayout from '@/components/layout/PageLayout'; 

const ChatEndedPage = () => {
  return (
    // If using a PageLayout, wrap content with it.
    // <PageLayout title="Chat Ended">
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Chat Session Ended
        </h1>
        <p className="text-gray-600">
          This chat has ended. Please await a new invitation to start another conversation.
        </p>
        {/* Optional: Add a button to navigate to the homepage or login page */}
        {/* <button
          onClick={() => window.location.href = '/'}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Go to Homepage
        </button> */}
      </div>
    </div>
    // </PageLayout>
  );
};

export default ChatEndedPage;
