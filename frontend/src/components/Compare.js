// Compare.js
import { useState, useEffect } from "react";
import axios from "axios";

function Compare({ productOptions }) {
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [selectedRegionGroup, setSelectedRegionGroup] = useState("All");
  const [selectedStore, setSelectedStore] = useState("All");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  // New inventory upload states
  const [inventoryFile, setInventoryFile] = useState(null);
  const [inventoryMessage, setInventoryMessage] = useState("");
  const [uploadingInventory, setUploadingInventory] = useState(false);

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
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/upload-inventory/`, {
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

  useEffect(() => {
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  const walmartStoreLocations = [/* same store data as before */];

  const handleCompare = async () => {
    setError("");
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/compare`, {
        params: { product_id: selectedProduct },
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

    const headers = ["Product", "Store (Pincode)", "Store Name", "Final Stock Count"];
    const rows = results.map((row) => {
      const surplus = Math.round(row.inventory - (row.sum_predicted + 10));
      const required = Math.round(row.sum_predicted - row.inventory);
      const finalStock =
        row.status === "Overstock" ? `+${surplus}` :
        row.status === "Understock" ? `-${required}` : "0";

      const storeData = walmartStoreLocations.find((w) => w.pincode === row.region);
      const storeLabel = storeData ? storeData.name : row.region;

      return [row.product_id, row.region, storeLabel, finalStock];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
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
      <div className={`max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 transition-all duration-700 ease-out transform ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} delay-[100ms]`}>
        <h1 className="text-3xl font-bold text-center mb-6">Compare Predicted Demand vs Inventory</h1>

        {/* Upload Inventory Section */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-4">Upload Your Inventory File</h2>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setInventoryFile(e.target.files[0])}
            className="mb-2"
          />
          <br />
          <button
            onClick={handleInventoryUpload}
            disabled={uploadingInventory}
            className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            {uploadingInventory ? "Uploading..." : "Upload Inventory"}
          </button>
          {inventoryMessage && (
            <p className={`mt-3 font-medium ${
              inventoryMessage.includes("✔") || inventoryMessage.includes("success")
                ? "text-green-600"
                : "text-red-600"
            }`}>
              {inventoryMessage}
            </p>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="px-4 py-2 border rounded-lg shadow-sm">
            <option value="All">All Products</option>
            {productOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select value={selectedRegionGroup} onChange={(e) => { setSelectedRegionGroup(e.target.value); setSelectedStore("All"); }} className="px-4 py-2 border rounded-lg shadow-sm">
            <option value="All">All Regions</option>
            <option value="North">North</option>
            <option value="West">West</option>
            <option value="East">East</option>
            <option value="South">South</option>
          </select>

          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="px-4 py-2 border rounded-lg shadow-sm">
            <option value="All">All Stores</option>
            {walmartStoreLocations
              .filter((w) => selectedRegionGroup === "All" || w.region === selectedRegionGroup)
              .map((w) => (
                <option key={w.pincode} value={w.pincode}>
                  {w.name} ({w.region})
                </option>
              ))}
          </select>

          <button onClick={handleCompare} className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition">
            Compare
          </button>

          <button onClick={handleExportReport} className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition">
            Export Stock Report (.csv)
          </button>

          <button onClick={() => (window.location.href = "/transport")} className="bg-[#5335D9] hover:bg-[#0B0A33] text-white px-5 py-2 rounded-lg font-medium shadow-sm transition">
            Go to Transport Optimization
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-center mb-4">{error}</p>
        )}

        {/* Results Table */}
        {results.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full border text-sm text-center rounded-xl overflow-hidden">
              <thead className="bg-[#E0E7FF]">
                <tr>
                  <th className="border p-3">Product</th>
                  <th className="border p-3">Store (Pincode)</th>
                  <th className="border p-3">Sum Predicted (30d)</th>
                  <th className="border p-3">Inventory</th>
                  <th className="border p-3">Status</th>
                  <th className="border p-3">Stock (+/-)</th>
                  <th className="border p-3">Stock End Date</th>
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
                      <td className={`border p-2 font-medium ${
                        row.status === "Overstock"
                          ? "bg-green-100"
                          : row.status === "Understock"
                          ? "bg-red-100"
                          : "bg-yellow-100"
                      }`}>
                        {row.status}
                      </td>
                      <td className="border p-2">{stockDisplay}</td>
                      <td className="border p-2">
                        {row.status === "Understock" ? row.stock_end_date || "Unknown" : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !error && <p className="text-center text-gray-500 mt-6">No results available for this selection.</p>
        )}
      </div>
    </div>
  );
}

export default Compare;
