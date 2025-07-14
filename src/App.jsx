import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UrlShortener from '../Frontend/UrlShortener';
import UrlShortenerStats from '../Frontend/UrlShortenerStats';
import RedirectHandler from '../Frontend/RedirectHandler';
import './App.css';

function saveShortenedUrls(urls) {
  localStorage.setItem('shortenedUrls', JSON.stringify(urls));
}

function getShortenedUrls() {
  const data = localStorage.getItem('shortenedUrls');
  return data ? JSON.parse(data) : [];
}

function App() {
  const handleShortened = (newResults) => {
    const prev = getShortenedUrls();
    saveShortenedUrls([...prev, ...newResults]);
  };

  return (
    <Router>
      <nav className="navbar">
        <div className="navbar-title">URL Shortener</div>
        <div className="navbar-links">
          <Link to="/">Shorten</Link>
          <Link to="/stats">Statistics</Link>
        </div>
      </nav>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<UrlShortener onShortened={handleShortened} />} />
          <Route path="/stats" element={<UrlShortenerStats />} />
          <Route path="/:shortcode" element={<RedirectHandler />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
