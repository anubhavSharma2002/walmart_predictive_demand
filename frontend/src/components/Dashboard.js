import { useEffect, useState } from "react";
import axios from "axios";
import Controls from "./Controls";
import Table from "./Table";
import Chart from "./Chart";

function Dashboard() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ product: "", date: "" });
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
  setLoading(true);
  axios.get("http://localhost:8000/predict")
    .then((res) => {
      setData(res.data);
    })
    .catch((err) => {
      console.error("❌ Error fetching predictions:", err.message);
    })
    .finally(() => setLoading(false));
}, []);


  const productOptions = [...new Set(data.map((d) => d.product_id))];

  const filtered = data.filter(
    (row) =>
      (!filters.product || row.product_id === filters.product) &&
      (!filters.date || row.date.includes(filters.date))
  );

  return (
  <div className="p-4 max-w-6xl mx-auto">
    <h1 className="text-3xl font-bold text-center mb-6">Walmart Predictive Demand Dashboard</h1>
    {loading ? (
      <p className="text-center text-lg text-blue-600 animate-pulse">Loading prediction data...</p>
    ) : (
      <>
        <Controls filters={filters} setFilters={setFilters} productOptions={productOptions} />
        {filtered.length > 0 ? (
          <>
            <Chart data={filtered} selectedProduct={filters.product} />
            <Table data={filtered.slice(0, 100)} /> {}
          </>
        ) : (
          <p className="text-center text-gray-600">No prediction data available.</p>
        )}
      </>
    )}
        </div>
    );
}
export default Dashboard;
