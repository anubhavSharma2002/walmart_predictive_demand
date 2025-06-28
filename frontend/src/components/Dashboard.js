import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Controls from "./Controls";
import Table from "./Table";
import Chart from "./Chart";
import UploadSection from "./UploadSection";

function Dashboard() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ product: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inventoryFile, setInventoryFile] = useState(null);
  const [inventoryMessage, setInventoryMessage] = useState("");
  const [uploadingInventory, setUploadingInventory] = useState(false);
  const [inventoryUploaded, setInventoryUploaded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const navigate = useNavigate();

  const fetchPrediction = useCallback(() => {
    setLoading(true);
    axios
      .get("http://localhost:8000/predict")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setData(res.data);
          setError("");
        } else if (res.data.error) {
          setError(res.data.error);
          setData([]);
        } else {
          setError("Unexpected response from server.");
          setData([]);
        }
      })
      .catch(() => {
        setError("Unable to fetch prediction data. Please try again.");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPrediction();
    setTimeout(() => setFadeIn(true), 100);
  }, [fetchPrediction]);

  const handleInventoryUpload = async () => {
    if (!inventoryFile) {
      setInventoryMessage("❌ Please select an inventory file first.");
      return;
    }

    setUploadingInventory(true);
    setInventoryMessage("");
    const formData = new FormData();
    formData.append("inventory_file", inventoryFile);

    try {
      const res = await fetch("http://localhost:8000/upload-inventory/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.message) {
        setInventoryMessage(data.message);
        setInventoryUploaded(true);
      } else if (data.error) {
        setInventoryMessage(`❌ Error: ${data.error}`);
      } else {
        setInventoryMessage("⚠️ Unknown response from server.");
      }
    } catch (error) {
      setInventoryMessage(`❌ Upload failed: ${error.message}`);
    } finally {
      setUploadingInventory(false);
    }
  };

  const handleCompareRedirect = () => {
    navigate("/compare");
  };

  const productOptions = [...new Set(data.map((d) => d.product_id))];
  const filtered = data.filter(
    (row) =>
      (!filters.product || row.product_id === filters.product) &&
      (!filters.date || row.date.includes(filters.date))
  );

  return (
    <div className="relative min-h-screen bg-[#F3F5FF] text-[#1E293B] p-8 font-[Poppins] overflow-hidden">
      {/* Background Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        <h1
          className={`text-5xl font-bold text-center mb-8 mt-20 tracking-tight transition-all duration-700 ease-out transform ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } delay-[100ms]`}
        >
          Smarter Stocking Starts Here
        </h1>

        <p
          className={`text-center text-[#475569] text-lg max-w-2xl mx-auto transition-all duration-700 ease-out transform ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } delay-[300ms]`}
        >
          Get a quick view of what’s selling and what’s not. Upload your data and make informed decisions faster.
        </p>

        <div
          className={`transition-all duration-700 ease-out transform ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } delay-[500ms]`}
        >
          <UploadSection onUploadComplete={fetchPrediction} />
        </div>

        <div
          className={`bg-[#F3F5FF] p-6 rounded-xl mt-6 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-700 ease-out transform ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } delay-[700ms]`}
        >
          <h2 className="text-2xl font-semibold text-[#1E293B] mb-5">
            Compare With Your Inventory
          </h2>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center">
            <label className="w-[200px] text-center cursor-pointer text-white bg-[#5335D9] hover:bg-[#0B0A33] transition px-4 py-2 rounded-full shadow-sm font-medium relative">
              Select Inventory File
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setInventoryFile(e.target.files[0]);
                  setInventoryUploaded(false);
                }}
                className="hidden"
              />
              {inventoryFile && (
                <span className="absolute -bottom-6 text-xs text-green-600 font-medium">
                  {inventoryUploaded ? "" : `${inventoryFile.name}`}
                </span>
              )}
            </label>

            <button
              onClick={handleInventoryUpload}
              disabled={uploadingInventory}
              className="w-[200px] bg-[#5335D9] hover:bg-[#0B0A33] px-5 py-2 rounded-full text-white font-medium shadow-sm transition disabled:opacity-50"
            >
              {uploadingInventory ? "Uploading..." : "Upload Inventory"}
            </button>

            <button
              onClick={handleCompareRedirect}
              className="w-[200px] px-5 py-2 rounded-full text-[#5335d9] border border-[#5335d9] hover:border-[#0B0A33] bg-[#F3F5FF] hover:bg-[#0B0A33] hover:text-white font-medium shadow-sm transition"
            >
              Compare
            </button>
          </div>
        </div>

        {inventoryMessage && (
          <p
            className={`mt-4 text-center font-medium ${
              inventoryMessage.includes("✔") || inventoryMessage.includes("success")
                ? "text-green-600"
                : "text-red-600"
            } transition-all duration-700 ease-out transform ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            } delay-[900ms]`}
          >
            {inventoryMessage}
          </p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div
              className={`mt-8 transition-all duration-700 ease-out transform ${
                fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } delay-[1000ms]`}
            >
              <Controls
                filters={filters}
                setFilters={setFilters}
                productOptions={productOptions}
              />
            </div>

            <div
              className={`mt-6 bg-[#F3F5FF] border border-[#5335D9] p-6 rounded-xl transition-all duration-700 ease-out transform ${
                fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } delay-[1100ms]`}
            >
              <Chart data={filtered} selectedProduct={filters.product} />
            </div>

            <div
              className={`mt-6 transition-all duration-700 ease-out transform ${
                fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } delay-[1200ms]`}
            >
              <Table data={filtered.slice(0, 100)} />
            </div>
          </>
        )}

        {loading && (
          <p className="text-center mt-10 text-lg text-[#5335D9] animate-pulse">
            Loading prediction data...
          </p>
        )}
        {error && (
          <p className="text-center text-red-600 mt-4 font-semibold">{error}</p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-center text-gray-500 mt-6">
            No prediction data available.
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
