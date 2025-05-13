
import { useState } from "react";

export default function UploadParser() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("apiSpec", file);

    const res = await fetch("http://localhost:3001/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setOutput(data);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Upload OpenAPI Spec</h2>
      <input
        type="file"
        accept=".yaml,.yml,.json"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Parse
      </button>

      {output && (
        <div className="mt-4 bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
