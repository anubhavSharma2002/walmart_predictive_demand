import { useState } from "react";
import axios from "axios";

function Compare({ productOptions }) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const handleCompare = async () => {
    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }
    setError("");
    try {
      const res = await axios.get(`http://localhost:8000/compare/${selectedProduct}`);
      if (res.data.error) {
        setError(res.data.error);
        setResults([]);
      } else if (Array.isArray(res.data)) {
        setResults(res.data);
      } else {
        setError("Invalid data received from server.");
        setResults([]);
      }
    } catch (err) {
      setError("Error loading compare results.");
      setResults([]);
    }
  };
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Compare Predicted Demand vs Inventory</h1>
      <div className="flex items-center mt-4 gap-4">
        <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border rounded p-2"
        >
            <option value="">Select Product</option>
            {Array.isArray(productOptions) && productOptions.length > 0 ? (
              productOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))
            ) : (
              <option value="">Loading products...</option>
            )}
        </select>
        <button
            onClick={handleCompare}
            className="bg-blue-600 text-white rounded p-2"
        >
            Compare
        </button>
      </div>
      {error && <p className="text-red-600 mt-2">{error}</p>}

      {Array.isArray(results) && results.length > 0 && (
        <table className="min-w-full mt-4 border">
          <thead>
            <tr>
              <th className="border p-2">Region</th>
              <th className="border p-2">Sum Predicted (7d)</th>
              <th className="border p-2">Inventory</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i}>
                <td className="border p-2">{row.region}</td>
                <td className="border p-2">{row.sum_predicted}</td>
                <td className="border p-2">{row.inventory}</td>
                <td
                  className={`border p-2 ${row.status === "Overstock"
                      ? "bg-green-100"
                      : row.status === "Understock"
                      ? "bg-red-100"
                      : "bg-yellow-100"
                  }`}
                >
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {Array.isArray(results) && results.length === 0 && !error && (
        <p className="mt-4 text-gray-600">No results available for this product.</p>
      )}
    </div>
  );
}

export default Compare;
