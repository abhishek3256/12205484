import React, { useEffect, useState } from 'react';
import { logEvent } from '../LoggingMiddleware/loggingMiddleware';

function getShortenedUrls() {
  const data = localStorage.getItem('shortenedUrls');
  return data ? JSON.parse(data) : [];
}

export default function UrlShortenerStats() {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const data = getShortenedUrls();
    setUrls(data);
    logEvent({ stack: 'frontend', level: 'info', packageName: 'page', message: 'Loaded statistics page' });
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '32px auto' }}>
      <h4>Shortened URL Statistics</h4>
      {urls.length === 0 ? (
        <div>No URLs shortened yet.</div>
      ) : (
        urls.map((url, idx) => (
          <div key={idx} style={{ border: '1px solid #ccc', padding: 16, margin: '16px 0', borderRadius: 8 }}>
            <div><b>Short URL:</b> <a href={`/${url.shortcode}`} target="_blank" rel="noopener noreferrer">http://localhost:3000/{url.shortcode}</a></div>
            <div><b>Original:</b> {url.url}</div>
            <div><b>Created:</b> {new Date(url.createdAt).toLocaleString()}</div>
            <div><b>Expires:</b> {new Date(url.expiry).toLocaleString()}</div>
            <div><b>Total Clicks:</b> {url.clicks ? url.clicks.length : 0}</div>
            {url.clicks && url.clicks.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <b>Click Details:</b>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ccc', padding: 4 }}>Timestamp</th>
                      <th style={{ border: '1px solid #ccc', padding: 4 }}>Source</th>
                      <th style={{ border: '1px solid #ccc', padding: 4 }}>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {url.clicks.map((click, cidx) => (
                      <tr key={cidx}>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}>{new Date(click.timestamp).toLocaleString()}</td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}>{click.source || '-'}</td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}>{click.location || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
} 