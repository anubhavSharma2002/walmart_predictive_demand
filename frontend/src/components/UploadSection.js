import { useState } from "react";

function UploadSection({onUploadComplete}) {
  const [salesFile, setSalesFile] = useState(null);
  const [calendarFile, setCalendarFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!salesFile || !calendarFile) {
      setMessage("❌ Please select both files.");
      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("sales_file", salesFile);
    formData.append("calendar_file", calendarFile);

    try {
      const res = await fetch("http://localhost:8000/upload-data/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.message) {
        setMessage(data.message);
        onUploadComplete();
      } else if (data.error) {
        setMessage(`❌ Error: ${data.error}`);
      } else {
        setMessage("⚠️ Unknown response from server.");
      }
    } catch (error) {
      setMessage(`❌ Upload failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-4 bg-gray-100 p-4 rounded-md shadow">
      <h2 className="text-xl font-semibold mb-2">Upload Training Data</h2>

      <div className="flex items-center gap-4">
        <input type="file" onChange={(e) => setSalesFile(e.target.files[0])} />
        <input type="file" onChange={(e) => setCalendarFile(e.target.files[0])} />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading & Training..." : "Upload & Retrain"}
        </button>
      </div>

      {message && (
        <p className={`mt-3 ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default UploadSection;
