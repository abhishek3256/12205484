import React, { useState } from 'react';
import { logEvent } from '../LoggingMiddleware/loggingMiddleware';
import './UrlShortener.css';

const DEFAULT_VALIDITY = 30;
const MAX_URLS = 5;

// Checks if the url is valid (accepts www. and http/https)
function isValidUrl(val) {
  let test = val;
  if (val.startsWith('www.')) {
    test = 'http://' + val;
  }
  try {
    new URL(test);
    return true;
  } catch {
    return false;
  }
}

// Checks if shortcode is valid
function isValidShortcode(val) {
  if (!val) return true;
  if (val.length < 3 || val.length > 12) return false;
  for (let i = 0; i < val.length; i++) {
    let ch = val[i];
    if (!((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9'))) {
      return false;
    }
  }
  return true;
}

const emptyInput = { url: '', validity: '', shortcode: '', error: '' };

export default function UrlShortener(props) {
  const [list, setList] = useState([{ ...emptyInput }]);
  const [result, setResult] = useState([]);
  const [used, setUsed] = useState([]);

  function handleChange(idx, field, val) {
    let arr = [];
    for (let i = 0; i < list.length; i++) {
      if (i === idx) {
        let item = { ...list[i] };
        item[field] = val;
        item.error = '';
        arr.push(item);
      } else {
        arr.push(list[i]);
      }
    }
    setList(arr);
  }

  function addRow() {
    if (list.length < MAX_URLS) {
      let arr = [];
      for (let i = 0; i < list.length; i++) arr.push(list[i]);
      arr.push({ ...emptyInput });
      setList(arr);
      logEvent({ stack: 'frontend', level: 'info', packageName: 'component', message: 'Added new URL input field' });
    }
  }

  function removeRow(idx) {
    let arr = [];
    for (let i = 0; i < list.length; i++) {
      if (i !== idx) arr.push(list[i]);
    }
    setList(arr);
    logEvent({ stack: 'frontend', level: 'info', packageName: 'component', message: 'Removed URL input field at index ' + idx });
  }

  function checkAll() {
    let ok = true;
    let arr = [];
    for (let i = 0; i < list.length; i++) {
      let item = list[i];
      let err = '';
      if (!isValidUrl(item.url)) {
        err = 'Invalid URL format';
        ok = false;
      } else if (!isValidShortcode(item.shortcode)) {
        err = 'Shortcode must be 3-12 alphanumeric chars';
        ok = false;
      } else if (item.validity && (!/^[0-9]+$/.test(item.validity) || parseInt(item.validity) <= 0)) {
        err = 'Validity must be a positive integer';
        ok = false;
      } else if (item.shortcode && used.indexOf(item.shortcode) !== -1) {
        err = 'Shortcode already used in this session';
        ok = false;
      }
      arr.push({ ...item, error: err });
    }
    setList(arr);
    return ok;
  }

  function makeCode() {
    let code = '';
    let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    while (used.indexOf(code) !== -1) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return code;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!checkAll()) {
      logEvent({ stack: 'frontend', level: 'warn', packageName: 'component', message: 'Validation failed for one or more inputs' });
      return;
    }
    let now = new Date();
    let arr = [];
    let newCodes = [];
    for (let i = 0; i < list.length; i++) {
      let item = list[i];
      let code = item.shortcode ? item.shortcode : makeCode();
      let mins = item.validity ? parseInt(item.validity) : DEFAULT_VALIDITY;
      let expiry = new Date(now.getTime() + mins * 60000);
      let urlToSave = item.url;
      if (urlToSave.startsWith('www.')) urlToSave = 'http://' + urlToSave;
      arr.push({
        url: urlToSave,
        shortcode: code,
        createdAt: now.toISOString(),
        expiry: expiry.toISOString(),
      });
      newCodes.push(code);
    }
    setResult(arr);
    setUsed(used.concat(newCodes));
    if (props.onShortened) props.onShortened(arr);
    logEvent({ stack: 'frontend', level: 'info', packageName: 'component', message: 'Shortened ' + arr.length + ' URLs' });
  }

  return (
    <div className="url-shortener-container">
      <h2>URL Shortener</h2>
      <form onSubmit={handleSubmit}>
        {/* Render all input rows */}
        {(() => {
          let rows = [];
          for (let i = 0; i < list.length; i++) {
            let item = list[i];
            rows.push(
              <div className="url-input-block" key={i}>
                <input
                  type="text"
                  placeholder="Long URL"
                  value={item.url}
                  onChange={e => handleChange(i, 'url', e.target.value)}
                  required
                  className={item.error ? 'input-error' : ''}
                />
                <input
                  type="number"
                  placeholder="Validity (min)"
                  value={item.validity}
                  onChange={e => handleChange(i, 'validity', e.target.value)}
                  min={1}
                />
                <input
                  type="text"
                  placeholder="Custom Shortcode"
                  value={item.shortcode}
                  onChange={e => handleChange(i, 'shortcode', e.target.value)}
                />
                {list.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => removeRow(i)}>-</button>
                )}
                {item.error && <div className="error-msg">{item.error}</div>}
              </div>
            );
          }
          return rows;
        })()}
        <div className="btn-row">
          <button type="button" onClick={addRow} disabled={list.length >= MAX_URLS}>Add URL</button>
          <button type="submit">Shorten URLs</button>
        </div>
      </form>
      {/* Show results */}
      {result.length > 0 && (
        <div className="results-block">
          <h3>Shortened URLs</h3>
          {(() => {
            let out = [];
            for (let i = 0; i < result.length; i++) {
              let item = result[i];
              out.push(
                <div className="result-item" key={i}>
                  <div>Original: {item.url}</div>
                  <div>Short URL: <a href={`/${item.shortcode}`} target="_blank" rel="noopener noreferrer">http://localhost:3000/{item.shortcode}</a></div>
                  <div>Expires at: {new Date(item.expiry).toLocaleString()}</div>
                </div>
              );
            }
            return out;
          })()}
        </div>
      )}
    </div>
  );
} 