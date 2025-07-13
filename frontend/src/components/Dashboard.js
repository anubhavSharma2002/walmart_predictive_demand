// Dashboard.js
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
  const [fadeIn, setFadeIn] = useState(false);

  const fetchPrediction = useCallback(() => {
    setLoading(true);
    axios
      .get(`${process.env.REACT_APP_API_BASE_URL}/predict`)
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

  const productOptions = [...new Set(data.map((d) => d.product_id))];
  const filtered = data.filter(
    (row) =>
      (!filters.product || row.product_id === filters.product) &&
      (!filters.date || row.date.includes(filters.date))
  );

  return (
    <div className="relative min-h-screen bg-[#F3F5FF] text-[#1E293B] p-8 font-[Poppins] overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>

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
          <button
            onClick={async () => {
              const confirmed = window.confirm("Are you sure you want to reset all uploaded data and predictions?");
              if (!confirmed) return;

              try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/reset`, {
                  method: "POST",
                });
                const result = await res.json();
                alert(result.message);
                fetchPrediction(); // refresh data
              } catch (err) {
                alert("❌ Failed to reset backend.");
              }
            }}
            className="mt-4 w-[200px] bg-red-600 hover:bg-red-800 text-white px-5 py-2 rounded-full font-medium shadow-sm transition"
          >
            🧹 Reset Backend
          </button>
        </div>

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
