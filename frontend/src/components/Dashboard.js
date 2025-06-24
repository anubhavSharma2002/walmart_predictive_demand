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
          console.error("⚠️ Backend Error:", res.data.error);
          setError(res.data.error);
          setData([]);
        } else {
          setError("Unexpected response from server.");
          setData([]);
        }
      })
      .catch((err) => {
        console.error("❌ Network Error:", err.message);
        setError("Unable to fetch prediction data. Please try again.");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPrediction();
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
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">
        Walmart Predictive Demand Dashboard
      </h1>

      <UploadSection onUploadComplete={fetchPrediction} />

      <div className="bg-gray-100 p-3 rounded mt-4 flex items-center gap-3 flex-wrap justify-center">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setInventoryFile(e.target.files[0])}
        />
        <button
          onClick={handleInventoryUpload}
          disabled={uploadingInventory}
          className="bg-green-600 text-white rounded px-3 py-2 hover:bg-green-700 disabled:opacity-60"
        >
          {uploadingInventory ? "Uploading Inventory..." : "Upload Inventory"}
        </button>
        <button
          onClick={handleCompareRedirect}
          className="bg-purple-600 text-white rounded px-3 py-2 hover:bg-purple-700"
        >
          Compare
        </button>
      </div>
      {inventoryMessage && (
        <p
          className={`mt-2 text-center font-semibold ${
            inventoryMessage.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {inventoryMessage}
        </p>
      )}

      {loading ? (
        <p className="text-center text-lg text-blue-600 animate-pulse">
          Loading prediction data...
        </p>
      ) : error ? (
        <p className="text-center text-red-600 font-semibold">{error}</p>
      ) : filtered.length > 0 ? (
        <>
          <Controls
            filters={filters}
            setFilters={setFilters}
            productOptions={productOptions}
          />
          <Chart data={filtered} selectedProduct={filters.product} />
          <Table data={filtered.slice(0, 100)} />
        </>
      ) : (
        <p className="text-center text-gray-600">
          No prediction data available.
        </p>
      )}
    </div>
  );
}

export default Dashboard;
