import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { logEvent } from '../LoggingMiddleware/loggingMiddleware';

function getShortenedUrls() {
  const data = localStorage.getItem('shortenedUrls');
  return data ? JSON.parse(data) : [];
}

function saveShortenedUrls(urls) {
  localStorage.setItem('shortenedUrls', JSON.stringify(urls));
}

async function getLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.country_name || data.country_code || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export default function RedirectHandler() {
  const { shortcode } = useParams();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleRedirect() {
      const urls = getShortenedUrls();
      const idx = urls.findIndex(u => u.shortcode === shortcode);
      if (idx === -1) {
        setStatus('error');
        setError('Short URL not found.');
        logEvent({ stack: 'frontend', level: 'error', packageName: 'page', message: `Shortcode ${shortcode} not found` });
        return;
      }
      const urlObj = urls[idx];
      if (new Date(urlObj.expiry) < new Date()) {
        setStatus('error');
        setError('Short URL has expired.');
        logEvent({ stack: 'frontend', level: 'warn', packageName: 'page', message: `Shortcode ${shortcode} expired` });
        return;
      }
      const location = await getLocation();
      const click = {
        timestamp: new Date().toISOString(),
        source: document.referrer || 'Direct',
        location,
      };
      if (!urlObj.clicks) urlObj.clicks = [];
      urlObj.clicks.push(click);
      urls[idx] = urlObj;
      saveShortenedUrls(urls);
      logEvent({ stack: 'frontend', level: 'info', packageName: 'page', message: `Redirected to ${urlObj.url} from shortcode ${shortcode}` });
      window.location.href = urlObj.url;
    }
    handleRedirect();
  }, [shortcode]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 64 }}>
        <div style={{ width: 32, height: 32, border: '4px solid #ccc', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: 16 }}>Redirecting...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 500, margin: '64px auto' }}>
      <div style={{ padding: 24, border: '1px solid #e74c3c', borderRadius: 8, background: '#fff0f0' }}>
        <div style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '1.2em' }}>{error}</div>
      </div>
    </div>
  );
} 