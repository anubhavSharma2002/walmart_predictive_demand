import { useState } from "react";
import axios from "axios";

function TransportOptimization() {
  const [costRate, setCostRate] = useState(10);
  const [minThreshold, setMinThreshold] = useState(10);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    if (!selectedFile) {
      alert("Please select a .csv file first.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const formData = new FormData();
      formData.append("stock_file", selectedFile);
      formData.append("cost_rate", costRate);
      formData.append("min_quantity", minThreshold);

      const res = await axios.post("http://localhost:8000/optimize-transport/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.error) {
        setError(res.data.error);
        setResults([]);
      } else {
        setResults(res.data);
      }
    } catch (err) {
      setError("Error optimizing transport.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = () => {
    if (!results.length) {
      alert("No results to export.");
      return;
    }

    const groupedResults = results.reduce((groups, route) => {
      const fromStore = route.stops[0]?.from_store;
      if (!groups[fromStore]) {
        groups[fromStore] = [];
      }
      groups[fromStore].push(...route.stops);
      return groups;
    }, {});

    const headers = ["From Store", "To Store", "Item", "Units", "Distance (km)", "Cost", "Time (mins)"];
    const rows = [];
    for (const [fromStore, stops] of Object.entries(groupedResults)) {
      rows.push([`FROM ${fromStore}`]); 
      stops.forEach(stop =>
        rows.push([
          fromStore,
          stop.to_store,
          stop.item,
          stop.units,
          stop.distance,
          stop.cost,
          stop.time,
        ])
      );
      rows.push([]);
    }

    const blob = new Blob([[headers.join(","), ...rows.map(r => r.join(","))].join("\n")], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "grouped_transport_optimization.csv";
    link.href = url;
    link.click();
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Transport Optimization</h1>
      <div className="flex flex-col gap-4 mt-4">
        <input
          type="number"
          placeholder="Cost Rate (Rs/km/unit)"
          value={costRate}
          onChange={(e) => setCostRate(parseFloat(e.target.value))}
          className="border rounded p-2"
        />
        <input
          type="number"
          placeholder="Min Quantity Threshold"
          value={minThreshold}
          onChange={(e) => setMinThreshold(parseInt(e.target.value))}
          className="border rounded p-2"
        />
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className="border rounded p-2"
        />
        <button
          onClick={handleOptimize}
          className="bg-blue-600 text-white rounded p-2"
        >
          Optimize
        </button>
        <button
          onClick={handleExport}
          className="bg-gray-600 text-white rounded p-2"
        >
          Export Grouped Results (.csv)
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex flex-col items-center text-blue-600 font-bold">
          <div className="loader"></div>
          <p>Processing... Please wait</p>
        </div>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}

      {results.length > 0 && !loading && (
        <div className="mt-4">
          {Object.entries(
            results.reduce((groups, route) => {
              const fromStore = route.stops[0]?.from_store;
              if (!groups[fromStore]) {
                groups[fromStore] = [];
              }
              groups[fromStore].push(...route.stops);
              return groups;
            }, {})
          ).map(([fromStore, stops]) => (
            <div key={fromStore} className="mb-4 p-4 rounded border">
              <h2 className="text-xl font-bold">From Store: {fromStore}</h2>
              <table className="min-w-full mt-2 border">
                <thead>
                  <tr>
                    <th className="border p-2">To Store</th>
                    <th className="border p-2">Item</th>
                    <th className="border p-2">Units</th>
                    <th className="border p-2">Distance (km)</th>
                    <th className="border p-2">Cost</th>
                    <th className="border p-2">Time (mins)</th>
                  </tr>
                </thead>
                <tbody>
                  {stops.map((stop, idx) => (
                    <tr key={idx}>
                      <td className="border p-2">{stop.to_store}</td>
                      <td className="border p-2">{stop.item}</td>
                      <td className="border p-2">{stop.units}</td>
                      <td className="border p-2">{stop.distance}</td>
                      <td className="border p-2">{stop.cost}</td>
                      <td className="border p-2">{stop.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {results.length === 0 && !error && !loading && (
        <p className="mt-4 text-gray-600">No results available for this selection.</p>
      )}
      <style>{`
        .loader {
          border: 6px solid #f3f3f3;
          border-radius: 50%;
          border-top: 6px solid #3498db;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg) }
          100% { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  );
}

export default TransportOptimization;
