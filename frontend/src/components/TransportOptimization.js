import { useState, useEffect } from "react";
import axios from "axios";

function TransportOptimization() {
  const [costRate, setCostRate] = useState(10);
  const [minThreshold, setMinThreshold] = useState(10);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [activeMapUrl, setActiveMapUrl] = useState("");
  const [mapExpanded, setMapExpanded] = useState(false);

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

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

      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/optimize-transport/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.error) {
        setError(res.data.error);
      } else {
        setResults(res.data);
      }
    } catch {
      setError("Error optimizing transport.");
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
      if (!groups[fromStore]) groups[fromStore] = [];
      groups[fromStore].push(...route.stops);
      return groups;
    }, {});

    const headers = ["From Store", "To Store", "Item", "Units", "Distance (km)", "Cost", "Time (mins)"];
    const rows = [];
    for (const [fromStore, stops] of Object.entries(groupedResults)) {
      rows.push([`FROM ${fromStore}`]);
      stops.forEach(stop => rows.push([
        fromStore, stop.to_store, stop.item, stop.units,
        stop.distance, stop.cost, stop.time
      ]));
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

  const getGoogleEmbedUrl = (fromStore, stops) => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const seen = new Set();
    const orderedStops = stops
      .map(stop => stop.to_store)
      .filter(to => {
        if (seen.has(to)) return false;
        seen.add(to);
        return true;
      });

    const origin = encodeURIComponent(fromStore);
    const destination = encodeURIComponent(orderedStops.at(-1));
    const waypointsArr = orderedStops.slice(0, -1).map(encodeURIComponent);
    const waypoints = waypointsArr.length > 0 ? `&waypoints=${waypointsArr.join("|")}` : "";

    return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}${waypoints}`;
  };

  return (
    <div className="min-h-screen bg-[#F3F5FF] py-12 px-4 font-[Poppins] text-[#1E293B] relative">
      <div className={`max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 transition-all duration-700 ease-out transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} delay-[100ms]`}>
        <h1 className={`text-3xl font-bold text-center mb-6 transition-all duration-700 ease-out transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} delay-[200ms]`}>
          Transport Optimization
        </h1>

        <div className={`flex flex-wrap gap-4 justify-center mb-6 transition-all duration-700 ease-out transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} delay-[400ms]`}>
          <div className="flex flex-col items-center">
            <input
              type="number"
              placeholder="Cost Rate (Rs/km/unit)"
              value={costRate}
              onChange={(e) => setCostRate(parseFloat(e.target.value))}
              className="px-4 py-2 border rounded-lg shadow-sm"
            />
            <h4 className="text-sm text-gray-600 mt-1">Cost Rate</h4>
          </div>

          <div className="flex flex-col items-center">
            <input
              type="number"
              placeholder="Min Quantity Threshold"
              value={minThreshold}
              onChange={(e) => setMinThreshold(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg shadow-sm"
            />
            <h4 className="text-sm text-gray-600 mt-1">Min Quantity Threshold</h4>
          </div>
        </div>
        <div className={`flex flex-wrap gap-4 justify-center mb-6 transition-all duration-700 ease-out transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} delay-[400ms]`}>
          <label className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition cursor-pointer">
            Choose CSV File
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <button onClick={handleOptimize} className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition">
            Optimize
          </button>
          <button onClick={handleExport} className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition">
            Export(.csv)
          </button>
        </div>

        {selectedFile && <p className="text-center text-green-600 font-medium mb-6">Uploaded successfully</p>}
        {loading && (
          <div className="mt-4 flex flex-col items-center text-[#0B0A33] font-semibold">
            <div className="loader mb-2"></div>
            <p>Processing... Please wait</p>
          </div>
        )}
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {results.length > 0 && !loading ? (
          <div className="mt-4">
            {Object.entries(
              results.reduce((groups, route) => {
                const fromStore = route.stops[0]?.from_store;
                if (!groups[fromStore]) groups[fromStore] = [];
                groups[fromStore].push(...route.stops);
                return groups;
              }, {})
            ).map(([fromStore, stops]) => (
              <div key={fromStore} className="mb-6 p-4 rounded-xl bg-white border shadow-sm">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold mb-2">From Store: {fromStore}</h2>
                  <button
                    onClick={() => setActiveMapUrl(getGoogleEmbedUrl(fromStore, stops))}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 0 29 29" fill="currentColor" className="ml-2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 4.63 7 13 7 13s7-8.37 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                    </svg>
                    <span className="ml-1">Map</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border text-sm text-center rounded-xl overflow-hidden">
                    <thead className="bg-[#E0E7FF]">
                      <tr>
                        <th className="border p-3">To Store</th>
                        <th className="border p-3">Item</th>
                        <th className="border p-3">Units</th>
                        <th className="border p-3">Distance (km)</th>
                        <th className="border p-3">Cost</th>
                        <th className="border p-3">Time (mins)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(
                        stops.reduce((acc, stop) => {
                          const key = stop.to_store;
                          if (!acc[key]) {
                            acc[key] = {
                              to_store: key,
                              items: [],
                              units: [],
                              distance: stop.distance,
                              cost: stop.cost,
                              time: stop.time,
                            };
                          }
                          acc[key].items.push(stop.item);
                          acc[key].units.push(stop.units);
                          return acc;
                        }, {})
                      ).map((grouped, idx) => (
                        <tr key={idx} className="bg-white hover:bg-[#f1f5f9]">
                          <td className="border p-2">{grouped.to_store}</td>
                          <td className="border p-2">{grouped.items.join(", ")}</td>
                          <td className="border p-2">{grouped.units.join(", ")}</td>
                          <td className="border p-2">{grouped.distance.toFixed(2)}</td>
                          <td className="border p-2">₹{grouped.cost.toFixed(2)}</td>
                          <td className="border p-2">{grouped.time.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (!error && !loading && (
          <p className={`text-center text-gray-500 mt-6 transition-all duration-700 ease-out transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} delay-[800ms]`}>
            No results available for this selection.
          </p>
        ))}
      </div>

      {activeMapUrl && (
        <div className={`fixed ${mapExpanded ? "inset-0 m-4" : "bottom-4 left-4 right-4 md:left-auto md:right-4"} bg-white border rounded-lg shadow-xl z-50 max-w-5xl w-full md:w-[900px] h-[500px] transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className="flex justify-between items-center bg-gray-100 px-4 py-2 border-b">
            <p className="font-semibold">Route Preview</p>
            <div className="flex gap-3">
              <button
                onClick={() => setMapExpanded(!mapExpanded)}
                className="text-blue-600 font-semibold text-sm hover:underline"
              >
                {mapExpanded ? "Collapse" : "Expand"}
              </button>
              <button
                onClick={() => {
                  setActiveMapUrl("");
                  setMapExpanded(false);
                }}
                className="text-red-500 font-semibold text-sm hover:underline"
              >
                Close
              </button>
            </div>
          </div>
          <iframe
            src={activeMapUrl}
            title="Google Maps Route"
            className={`w-full ${mapExpanded ? "h-[calc(100%-45px)]" : "h-[455px]"} rounded-b-lg`}
            allowFullScreen
            loading="lazy"
          />
        </div>
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
