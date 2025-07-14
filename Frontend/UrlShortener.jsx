import React, { useState } from 'react';
import { logEvent } from '../LoggingMiddleware/loggingMiddleware';
import './UrlShortener.css';

const DEFAULT_VALIDITY = 30;
const MAX_URLS = 5;

function isValidUrl(url) {
  let testUrl = url;
  if (url.startsWith('www.')) {
    testUrl = 'http://' + url;
  }
  try {
    new URL(testUrl);
    return true;
  } catch {
    return false;
  }
}

function isValidShortcode(code) {
  if (!code) return true;
  if (code.length < 3 || code.length > 12) return false;
  for (let i = 0; i < code.length; i++) {
    let ch = code[i];
    if (!((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9'))) {
      return false;
    }
  }
  return true;
}

const emptyInput = { url: '', validity: '', shortcode: '', error: '' };

export default function UrlShortener(props) {
  const [inputs, setInputs] = useState([{ ...emptyInput }]);
  const [results, setResults] = useState([]);
  const [usedShortcodes, setUsedShortcodes] = useState([]);
  function handleInputChange(idx, field, value) {
    let arr = [];
    for (let i = 0; i < inputs.length; i++) {
      if (i === idx) {
        let obj = { ...inputs[i] };
        obj[field] = value;
        obj.error = '';
        arr.push(obj);
      } else {
        arr.push(inputs[i]);
      }
    }
    setInputs(arr);
  }

  function addInput() {
    if (inputs.length < MAX_URLS) {
      let arr = [];
      for (let i = 0; i < inputs.length; i++) arr.push(inputs[i]);
      arr.push({ ...emptyInput });
      setInputs(arr);
      logEvent({ stack: 'frontend', level: 'info', packageName: 'component', message: 'Added new URL input field' });
    }
  }

  function removeInput(idx) {
    let arr = [];
    for (let i = 0; i < inputs.length; i++) {
      if (i !== idx) arr.push(inputs[i]);
    }
    setInputs(arr);
    logEvent({ stack: 'frontend', level: 'info', packageName: 'component', message: 'Removed URL input field at index ' + idx });
  }

  function validateInputs() {
    let valid = true;
    let arr = [];
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      let err = '';
      if (!isValidUrl(input.url)) {
        err = 'Invalid URL format';
        valid = false;
      } else if (!isValidShortcode(input.shortcode)) {
        err = 'Shortcode must be 3-12 alphanumeric chars';
        valid = false;
      } else if (input.validity && (!/^[0-9]+$/.test(input.validity) || parseInt(input.validity) <= 0)) {
        err = 'Validity must be a positive integer';
        valid = false;
      } else if (input.shortcode && usedShortcodes.indexOf(input.shortcode) !== -1) {
        err = 'Shortcode already used in this session';
        valid = false;
      }
      arr.push({ ...input, error: err });
    }
    setInputs(arr);
    return valid;
  }

  function makeShortcode() {
    let code = '';
    let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    while (usedShortcodes.indexOf(code) !== -1) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return code;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateInputs()) {
      logEvent({ stack: 'frontend', level: 'warn', packageName: 'component', message: 'Validation failed for one or more inputs' });
      return;
    }
    let now = new Date();
    let arr = [];
    let newShorts = [];
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      let code = input.shortcode ? input.shortcode : makeShortcode();
      let validity = input.validity ? parseInt(input.validity) : DEFAULT_VALIDITY;
      let expiry = new Date(now.getTime() + validity * 60000);
      let urlToSave = input.url;
      if (urlToSave.startsWith('www.')) urlToSave = 'http://' + urlToSave;
      arr.push({
        url: urlToSave,
        shortcode: code,
        createdAt: now.toISOString(),
        expiry: expiry.toISOString(),
      });
      newShorts.push(code);
    }
    setResults(arr);
    setUsedShortcodes(usedShortcodes.concat(newShorts));
    if (props.onShortened) props.onShortened(arr);
    logEvent({ stack: 'frontend', level: 'info', packageName: 'component', message: 'Shortened ' + arr.length + ' URLs' });
  }

  return (
    <div className="url-shortener-container">
      <h2>URL Shortener</h2>
      <form onSubmit={handleSubmit}>
        {(() => {
          let rows = [];
          for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            rows.push(
              <div className="url-input-block" key={i}>
                <input
                  type="text"
                  placeholder="Long URL"
                  value={input.url}
                  onChange={e => handleInputChange(i, 'url', e.target.value)}
                  required
                  className={input.error ? 'input-error' : ''}
                />
                <input
                  type="number"
                  placeholder="Validity (min)"
                  value={input.validity}
                  onChange={e => handleInputChange(i, 'validity', e.target.value)}
                  min={1}
                />
                <input
                  type="text"
                  placeholder="Custom Shortcode"
                  value={input.shortcode}
                  onChange={e => handleInputChange(i, 'shortcode', e.target.value)}
                />
                {inputs.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => removeInput(i)}>-</button>
                )}
                {input.error && <div className="error-msg">{input.error}</div>}
              </div>
            );
          }
          return rows;
        })()}
        <div className="btn-row">
          <button type="button" onClick={addInput} disabled={inputs.length >= MAX_URLS}>Add URL</button>
          <button type="submit">Shorten URLs</button>
        </div>
      </form>
      {results.length > 0 && (
        <div className="results-block">
          <h3>Shortened URLs</h3>
          {(() => {
            let out = [];
            for (let i = 0; i < results.length; i++) {
              let res = results[i];
              out.push(
                <div className="result-item" key={i}>
                  <div>Original: {res.url}</div>
                  <div>Short URL: <a href={`/${res.shortcode}`} target="_blank" rel="noopener noreferrer">http://localhost:3000/{res.shortcode}</a></div>
                  <div>Expires at: {new Date(res.expiry).toLocaleString()}</div>
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