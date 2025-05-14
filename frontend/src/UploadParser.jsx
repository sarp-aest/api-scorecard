import React, { useState } from 'react';

export default function UploadParser() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('apiSpec', file);

    const res = await fetch("http://localhost:3001/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setOutput(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4">
      <div className="max-w-4xl w-full px-6 lg:px-12 py-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Upload OpenAPI Spec</h2>
        <div className="flex items-center justify-center gap-4 mb-6">
          <input
            type="file"
            accept=".yaml,.yml,.json"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button
            onClick={handleUpload}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
          >
            Parse
          </button>
        </div>

        {output && (
          <div className="space-y-6">
            <div className="bg-white rounded shadow p-4 border text-left mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-center">📊 Readiness Summary</h3>
              <p><strong>API:</strong> {output.title} (v{output.version})</p>
              <p><strong>Endpoints:</strong> {output.endpointCount}</p>
              <p><strong>Readiness Score:</strong> {output.readinessScore} / 100</p>
              <p><strong>Grade:</strong> {output.grade}</p>
            </div>

            <div className="bg-white rounded shadow p-4 border text-left mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-center">🧠 Key Insights</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Auth Types:</strong> {output.insights.authTypes.join(", ")}</li>
                <li><strong>Example Coverage:</strong> {output.insights.exampleCoverage}</li>
                <li><strong>Schema Coverage:</strong> {output.insights.schemaCoverage}</li>
                <li><strong>Description Coverage:</strong> {output.insights.descriptionCoverage}</li>
                <li><strong>Status Code Count:</strong> {output.insights.statusCodeCount}</li>
                <li><strong>Common Status Codes:</strong> {output.insights.commonStatusCodes.join(", ")}</li>
              </ul>
            </div>

            <div className="bg-white rounded shadow p-4 border text-left mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-center">🚧 Improvement Areas</h3>
              <div className="mb-2">
                <h4 className="font-medium">Undocumented Endpoints</h4>
                <ul className="list-disc list-inside ml-4">
                  {output.insights.undocumentedEndpoints.map((ep, idx) => (
                    <li key={idx}>{ep}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Low Coverage</h4>
                <ul className="list-disc list-inside ml-4">
                  {parseFloat(output.insights.exampleCoverage) < 50 && (
                    <li>Example coverage is low ({output.insights.exampleCoverage})</li>
                  )}
                  {parseFloat(output.insights.descriptionCoverage) < 50 && (
                    <li>Description coverage is low ({output.insights.descriptionCoverage})</li>
                  )}
                  {parseFloat(output.insights.schemaCoverage) < 50 && (
                    <li>Schema coverage is low ({output.insights.schemaCoverage})</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded shadow p-4 border text-left mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-center">🔍 Raw Output</h3>
              <details>
                <summary className="cursor-pointer text-blue-600">View JSON</summary>
                <div className="mt-2 relative">
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(output, null, 2))}
                    className="absolute top-0 right-0 text-sm text-blue-500 hover:underline"
                  >
                    Copy
                  </button>
                  <pre className="text-sm whitespace-pre-wrap break-words mt-6">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
