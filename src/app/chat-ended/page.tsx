import Link from 'next/link';
import { FiInfo } from 'react-icons/fi'; // Optional: for a bit of visual flair

export default function ChatEndedPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-neutral-800 p-8 sm:p-12 rounded-xl shadow-2xl max-w-lg w-full border border-neutral-200 dark:border-neutral-700">
        <FiInfo className="text-5xl sm:text-6xl text-indigo-500 dark:text-indigo-400 mx-auto mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">
          Chat Session Ended
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed mb-8">
          This chat has ended. Please await a new invitation to start another conversation.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
        >
          Go to Homepage
        </Link>
      </div>
      <footer className="mt-12 text-center">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          &copy; {new Date().getFullYear()} Your App Name. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
