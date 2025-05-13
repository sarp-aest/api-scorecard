
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('apiSpec', file);
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload spec');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('http://localhost:3001/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch spec from URL');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>API Readiness Scorecard</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Upload a .yaml or .json file:</label><br />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleFileUpload}>Upload</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Or enter a URL:</label><br />
        <input
          type="text"
          placeholder="https://example.com/openapi.json"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
        <button onClick={handleUrlSubmit} style={{ marginTop: '0.5rem' }}>Submit URL</button>
      </div>

      {loading && <p>Analyzing...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {result && (
        <div style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '5px' }}>
          <h2>{result.title} (v{result.version})</h2>
          <p><strong>Score:</strong> {result.readinessScore}/100</p>
          <p><strong>Grade:</strong> {result.grade}</p>
          <h4>Insights</h4>
          <ul>
            <li>Auth Types: {result.insights.authTypes.join(', ')}</li>
            <li>Example Coverage: {result.insights.exampleCoverage}</li>
            <li>Schema Coverage: {result.insights.schemaCoverage}</li>
            <li>Status Codes: {result.insights.statusCodeCount}</li>
            <li>Description Coverage: {result.insights.descriptionCoverage}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
