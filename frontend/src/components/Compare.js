import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import html2canvas from "html2canvas"; 

function Compare({ productOptions }) {
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("All"); 
  const mapRef = useRef();

  const handleCompare = async () => {
    setError("");
    try {
      const res = await axios.get(`http://localhost:8000/compare`, {
        params: {
          product_id: selectedProduct,
          region: selectedRegion,
        },
      });
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
  
  const walmartStoreLocations = [
    { pincode: "282001", name: "Agra Walmart", coords: [27.1767, 78.0081] },
    { pincode: "143001", name: "Amritsar Walmart", coords: [31.633979, 74.872264] },
    { pincode: "431001", name: "Aurangabad Walmart", coords: [19.876165, 75.343315] },
    { pincode: "560001", name: "Bengaluru Walmart", coords: [12.9716, 77.5946] },
    { pincode: "462001", name: "Bhopal Walmart", coords: [23.259933, 77.412615] },
    { pincode: "160017", name: "Chandigarh Walmart", coords: [30.7333, 76.7794] },
    { pincode: "600001", name: "Chennai Walmart", coords: [13.0827, 80.2707] },
    { pincode: "641001", name: "Coimbatore Walmart", coords: [11.0168, 76.9558] },
    { pincode: "110001", name: "Delhi Walmart", coords: [28.6139, 77.2090] },
    { pincode: "522002", name: "Guntur Walmart", coords: [16.3067, 80.4365] },
    { pincode: "781001", name: "Guwahati Walmart", coords: [26.1445, 91.7362] },
    { pincode: "500001", name: "Hyderabad Walmart", coords: [17.3850, 78.4867] },
    { pincode: "452001", name: "Indore Walmart", coords: [22.719568, 75.857728] },
    { pincode: "144001", name: "Jalandhar Walmart", coords: [31.3260, 75.5762] },
    { pincode: "302001", name: "Jaipur Walmart", coords: [26.9124, 75.7873] },
    { pincode: "700001", name: "Kolkata Walmart", coords: [22.5726, 88.3639] },
    { pincode: "226001", name: "Lucknow Walmart", coords: [26.8467, 80.9462] },
    { pincode: "141001", name: "Ludhiana Walmart", coords: [30.900965, 75.857276] },
    { pincode: "250001", name: "Meerut Walmart", coords: [28.9845, 77.7064] },
    { pincode: "400001", name: "Mumbai Walmart", coords: [19.0760, 72.8777] },
    { pincode: "440001", name: "Nagpur Walmart", coords: [21.1458, 79.0882] },
    { pincode: "533101", name: "Rajahmundry Walmart", coords: [17.0005, 81.8040] },
    { pincode: "492001", name: "Raipur Walmart", coords: [21.2514, 81.6296] },
    { pincode: "444601", name: "Amravati Walmart", coords: [20.9333, 77.7513] },
    { pincode: "834001", name: "Ranchi Walmart", coords: [23.3441, 85.3099] },
    { pincode: "520001", name: "Vijayawada Walmart", coords: [16.5062, 80.6480] },
    { pincode: "530001", name: "Visakhapatnam Walmart", coords: [17.6868, 83.2185] },
    { pincode: "632001", name: "Vellore Walmart", coords: [12.9165, 79.1325] },
  ];

  const getPointColor = (status) => {
    if (status === "Overstock") return "green";
    if (status === "Understock") return "red";
    return "yellow";
  };
  
  const FitBounds = ({ results }) => {
    const map = useMap();
    useEffect(() => {
      if (results.length > 0) {
        const coords = results
          .map((r) => {
            const loc = walmartStoreLocations.find((w) => w.pincode === r.region);
            return loc?.coords;
          })
          .filter(Boolean);
        if (coords.length > 0) {
          map.fitBounds(coords);
        }
      }
    }, [results, map]);
    return null;
  };
  
  const handlePointClick = (row) => {
    alert(`Product: ${row.product_id}\nRegion: ${row.region}\nSum Predicted: ${row.sum_predicted}\nInventory: ${row.inventory}\nStatus: ${row.status}`);
  };
  
  const handleExportMap = async () => {
    if (!mapRef.current) return;
    const mapEl = mapRef.current.querySelector(".leaflet-container");
    if (!mapEl) return;

    const canvas = await html2canvas(mapEl);
    const link = document.createElement("a");
    link.download = "walmart_map.png";
    link.href = canvas.toDataURL();
    link.click();
  };
  
  const filteredResults = results.filter((row) => {
    const matchesSearch =
      searchQuery ? (row.region.includes(searchQuery) || row.product_id.includes(searchQuery)) : true;

    const matchesFilter = statusFilter === "All" || row.status === statusFilter;

    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Compare Predicted Demand vs Inventory</h1>
      <div className="flex flex-col md:flex-row items-center mt-4 gap-4">
        <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="border rounded p-2"
        >
            <option value="All">All Products</option>
            {Array.isArray(productOptions) && productOptions.length > 0 ? (
              productOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))
            ) : (
              <option value="">Loading products...</option>
            )}
        </select>
        <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="border rounded p-2"
        >
            <option value="All">All Stores</option>
            {walmartStoreLocations.map((w) => (
              <option key={w.pincode} value={w.pincode}>{w.name}</option>
            ))}
        </select>
        <input
            type="text"
            placeholder="Search Product or Store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded p-2"
        />
        <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded p-2"
        >
            <option value="All">All Status</option>
            <option value="Overstock">Overstock</option>
            <option value="Understock">Understock</option>
            <option value="As required">As required</option>
        </select>
        <button
            onClick={handleCompare}
            className="bg-blue-600 text-white rounded p-2"
        >
            Compare
        </button>
        <button
            onClick={handleExportMap}
            className="bg-gray-600 text-white rounded p-2"
        >
            Export Map
        </button>
      </div>
      {error && <p className="text-red-600 mt-2">{error}</p>}

      <div ref={mapRef} className="mt-4">
        <h2 className="text-xl font-bold">Store Locations on Map</h2>
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            className="rounded mt-2"
            style={{ height: "400px", width: "100%" }}
        >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {walmartStoreLocations.map((store, idx) => (
              <Marker
                key={idx}
                position={store.coords}
                icon={L.divIcon({
                  html: '<div style="font-size:1.5rem">🛍️</div>',
                  className: "walmart-marker",
                  iconSize: [30, 30]
                })}
              >
                <Popup>{store.name}</Popup>
              </Marker>
            ))}

            <FitBounds results={results} />

            {filteredResults.map((row, i) => {
              const loc = walmartStoreLocations.find((w) => w.pincode === row.region);
              if (!loc) return null;

              const isBlinking = row.status === "Overstock" || row.status === "Understock";
              return (
                <CircleMarker
                  key={i}
                  center={loc.coords}
                  color={getPointColor(row.status)}
                  fillColor={getPointColor(row.status)}
                  fillOpacity={1}
                  radius={12}
                  className={isBlinking ? "blinking-marker" : ""}
                  eventHandlers={{
                    click: () => handlePointClick(row),
                  }}
                >
                  <Tooltip>
                    <div>
                      <strong>{loc.name}</strong><br/>
                      Product: {row.product_id}<br/>
                      Sum Predicted: {row.sum_predicted}<br/>
                      Inventory: {row.inventory}<br/>
                      Status: {row.status}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
        </MapContainer>

        <div className="mt-2 flex justify-around text-sm">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse inline-block mr-1"></span> Understock
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-600 animate-pulse inline-block mr-1"></span> Overstock
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block mr-1"></span> As required
            </span>
        </div>
      </div>

      {Array.isArray(filteredResults) && filteredResults.length > 0 && (
        <table className="min-w-full mt-4 border">
          <thead>
            <tr>
              <th className="border p-2">Product</th>
              <th className="border p-2">Region (Pincode)</th>
              <th className="border p-2">Sum Predicted (7d)</th>
              <th className="border p-2">Inventory</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((row, i) => (
              <tr key={i}>
                <td className="border p-2">{row.product_id}</td>
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
      {Array.isArray(filteredResults) && filteredResults.length === 0 && !error && (
        <p className="mt-4 text-gray-600">No results available for this selection.</p>
      )}
    </div>
  );
}

export default Compare;
