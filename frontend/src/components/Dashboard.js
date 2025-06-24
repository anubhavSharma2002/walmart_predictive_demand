import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Controls from "./Controls";
import Table from "./Table";
import Chart from "./Chart";
import UploadSection from "./UploadSection";

function Dashboard() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ product: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPrediction = useCallback(() => {
    setLoading(true);
    axios.get("http://localhost:8000/predict")
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
