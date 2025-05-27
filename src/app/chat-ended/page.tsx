'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatEndedPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000); // 5 seconds

    return () => clearTimeout(timer); // Cleanup the timer if the component unmounts
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      textAlign: 'center',
      padding: '20px',
      fontFamily: 'sans-serif' 
    }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333' }}>Chat Session Ended</h1>
      </header>
      <main>
        <p style={{ fontSize: '1.2rem', color: '#555', lineHeight: '1.6' }}>
          This chat session has been ended by the host. 
          <br />
          You will be redirected to the homepage shortly.
        </p>
      </main>
      <footer style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#777' }}>
        <p>If you are not redirected automatically, please <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>click here</a>.</p>
      </footer>
    </div>
  );
}
