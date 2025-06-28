import { useState } from "react";

function UploadSection({ onUploadComplete }) {
  const [salesFile, setSalesFile] = useState(null);
  const [calendarFile, setCalendarFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [salesUploaded, setSalesUploaded] = useState(false);
  const [calendarUploaded, setCalendarUploaded] = useState(false);

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
        setSalesUploaded(true);
        setCalendarUploaded(true);
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
    <div className="my-8 bg-[#F3F5FF] p-6 rounded-2xl font-[Poppins] flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold mb-6 text-[#1E293B]">
        Upload Training Data
      </h2>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-4">
        <label className="w-[200px] inline-flex flex-col items-center justify-center text-white bg-[#5335d9] hover:bg-[#0B0A33] transition px-4 py-3 rounded-full shadow-sm text-md font-medium text-center cursor-pointer relative">
          Select Sales File
          <input
            type="file"
            onChange={(e) => {
              setSalesFile(e.target.files[0]);
              setSalesUploaded(false);
            }}
            className="hidden"
          />
          {salesFile && (
            <span className="absolute -bottom-6 text-xs text-green-600 font-medium">
              {salesUploaded ? "" : "" + salesFile.name}
            </span>
          )}
        </label>

        <label className="w-[210px] inline-flex flex-col items-center justify-center text-white bg-[#5335d9] hover:bg-[#0B0A33] transition px-4 py-3 rounded-full shadow-sm text-md font-medium text-center cursor-pointer relative">
          Select Calendar File
          <input
            type="file"
            onChange={(e) => {
              setCalendarFile(e.target.files[0]);
              setCalendarUploaded(false);
            }}
            className="hidden"
          />
          {calendarFile && (
            <span className="absolute -bottom-6 text-xs text-green-600 font-medium">
              {calendarUploaded ? "" : "" + calendarFile.name}
            </span>
          )}
        </label>

        <button
          className="w-[200px] inline-flex items-center justify-center text-[#5335d9] border border-[#5335d9] hover:border-[#0B0A33] bg-[#F3F5FF] hover:bg-[#0B0A33] hover:text-white transition px-4 py-3 rounded-full text-md font-semibold shadow-sm disabled:opacity-50"
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? "Uploading & Training..." : "Upload & Retrain"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-4 font-medium ${message.includes("") || message.includes("")
            ? "text-green-600"
            : "text-red-600"
            }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default UploadSection;
