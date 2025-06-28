import { useState, useEffect } from "react";
import axios from "axios";

function Compare({ productOptions }) {
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [selectedRegionGroup, setSelectedRegionGroup] = useState("All");
  const [selectedStore, setSelectedStore] = useState("All");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false); // fade trigger

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const walmartStoreLocations = [
    { pincode: "282001", name: "Agra Walmart", region: "North" },
    { pincode: "143001", name: "Amritsar Walmart", region: "North" },
    { pincode: "160017", name: "Chandigarh Walmart", region: "North" },
    { pincode: "110001", name: "Delhi Walmart", region: "North" },
    { pincode: "144001", name: "Jalandhar Walmart", region: "North" },
    { pincode: "141001", name: "Ludhiana Walmart", region: "North" },
    { pincode: "250001", name: "Meerut Walmart", region: "North" },
    { pincode: "400001", name: "Mumbai Walmart", region: "West" },
    { pincode: "440001", name: "Nagpur Walmart", region: "West" },
    { pincode: "444601", name: "Amravati Walmart", region: "West" },
    { pincode: "452001", name: "Indore Walmart", region: "West" },
    { pincode: "302001", name: "Jaipur Walmart", region: "West" },
    { pincode: "431001", name: "Aurangabad Walmart", region: "West" },
    { pincode: "492001", name: "Raipur Walmart", region: "East" },
    { pincode: "834001", name: "Ranchi Walmart", region: "East" },
    { pincode: "700001", name: "Kolkata Walmart", region: "East" },
    { pincode: "522002", name: "Guntur Walmart", region: "East" },
    { pincode: "781001", name: "Guwahati Walmart", region: "East" },
    { pincode: "533101", name: "Rajahmundry Walmart", region: "East" },
    { pincode: "520001", name: "Vijayawada Walmart", region: "East" },
    { pincode: "560001", name: "Bengaluru Walmart", region: "South" },
    { pincode: "600001", name: "Chennai Walmart", region: "South" },
    { pincode: "641001", name: "Coimbatore Walmart", region: "South" },
    { pincode: "500001", name: "Hyderabad Walmart", region: "South" },
    { pincode: "530001", name: "Visakhapatnam Walmart", region: "South" },
    { pincode: "632001", name: "Vellore Walmart", region: "South" },
  ];

  const handleCompare = async () => {
    setError("");
    try {
      const res = await axios.get("http://localhost:8000/compare", {
        params: {
          product_id: selectedProduct,
        },
      });

      if (res.data.error) {
        setError(res.data.error);
        setResults([]);
      } else {
        let filtered = res.data;

        if (selectedRegionGroup !== "All") {
          filtered = filtered.filter((r) => {
            const store = walmartStoreLocations.find((w) => w.pincode === r.region);
            return store?.region === selectedRegionGroup;
          });
        }

        if (selectedStore !== "All") {
          filtered = filtered.filter((r) => r.region === selectedStore);
        }

        setResults(filtered);
      }
    } catch {
      setError("Error loading compare results.");
      setResults([]);
    }
  };

  const handleExportReport = () => {
    if (!results.length) {
      alert("No results available to export.");
      return;
    }

    const headers = [
      "Product",
      "Store (Pincode)",
      "Store Name",
      "Final Stock Count"
    ];

    const rows = results.map((row) => {
      const surplus = Math.round(row.inventory - (row.sum_predicted + 10));
      const required = Math.round(row.sum_predicted - row.inventory);
      const finalStock =
        row.status === "Overstock"
          ? `+${surplus}`
          : row.status === "Understock"
          ? `-${required}`
          : "0";

      const storeData = walmartStoreLocations.find((w) => w.pincode === row.region);
      const storeLabel = storeData ? storeData.name : row.region;

      return [
        row.product_id,
        row.region,
        storeLabel,
        finalStock,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "stock_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F3F5FF] py-12 px-4 font-[Poppins] text-[#1E293B]">
      <div
        className={`max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 transition-all duration-700 ease-out transform ${
          fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } delay-[100ms]`}
      >
        <h1
          className={`text-3xl font-bold text-center mb-6 transition-all duration-700 ease-out transform ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } delay-[200ms]`}
        >
          Compare Predicted Demand vs Inventory
        </h1>

        <div
          className={`flex flex-wrap gap-4 justify-center mb-6 transition-all duration-700 ease-out transform ${
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          } delay-[400ms]`}
        >
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-4 py-2 border rounded-lg shadow-sm"
          >
            <option value="All">All Products</option>
            {productOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={selectedRegionGroup}
            onChange={(e) => {
              setSelectedRegionGroup(e.target.value);
              setSelectedStore("All");
            }}
            className="px-4 py-2 border rounded-lg shadow-sm"
          >
            <option value="All">All Regions</option>
            <option value="North">North</option>
            <option value="West">West</option>
            <option value="East">East</option>
            <option value="South">South</option>
          </select>

          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-2 border rounded-lg shadow-sm"
          >
            <option value="All">All Stores</option>
            {walmartStoreLocations
              .filter((w) => selectedRegionGroup === "All" || w.region === selectedRegionGroup)
              .map((w) => (
                <option key={w.pincode} value={w.pincode}>
                  {w.name} ({w.region})
                </option>
              ))}
          </select>

          <button
            onClick={handleCompare}
            className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            Compare
          </button>

          <button
            onClick={handleExportReport}
            className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            Export Stock Report (.csv)
          </button>

          <button
            onClick={() => (window.location.href = "/transport")}
            className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            Go to Transport Optimization
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-center mb-4 transition-opacity duration-500 ease-out delay-[600ms]">
            {error}
          </p>
        )}

        {results.length > 0 ? (
          <div
            className={`overflow-x-auto mt-4 transition-all duration-700 ease-out transform ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            } delay-[700ms]`}
          >
            <table className="w-full border text-sm text-center rounded-xl overflow-hidden">
              <thead className="bg-[#E0E7FF]">
                <tr>
                  <th className="border p-3">Product</th>
                  <th className="border p-3">Store (Pincode)</th>
                  <th className="border p-3">Sum Predicted (7d)</th>
                  <th className="border p-3">Inventory</th>
                  <th className="border p-3">Status</th>
                  <th className="border p-3">Stock (+/-)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => {
                  const surplus = Math.round(row.inventory - (row.sum_predicted + 10));
                  const required = Math.round(row.sum_predicted - row.inventory);
                  const stockDisplay =
                    row.status === "Overstock" ? (
                      <span className="text-green-600 font-medium">+{surplus}</span>
                    ) : row.status === "Understock" ? (
                      <span className="text-red-600 font-medium">-{required}</span>
                    ) : (
                      <span className="text-gray-600 font-medium">0</span>
                    );

                  return (
                    <tr key={i} className="bg-white hover:bg-[#f1f5f9]">
                      <td className="border p-2">{row.product_id}</td>
                      <td className="border p-2">{row.region}</td>
                      <td className="border p-2">{row.sum_predicted}</td>
                      <td className="border p-2">{row.inventory}</td>
                      <td
                        className={`border p-2 font-medium ${
                          row.status === "Overstock"
                            ? "bg-green-100"
                            : row.status === "Understock"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                        }`}
                      >
                        {row.status}
                      </td>
                      <td className="border p-2">{stockDisplay}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !error && (
            <p
              className={`text-center text-gray-500 mt-6 transition-all duration-700 ease-out transform ${
                fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              } delay-[800ms]`}
            >
              No results available for this selection.
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default Compare;
