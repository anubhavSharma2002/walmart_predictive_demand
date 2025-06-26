import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import Dashboard from "./components/Dashboard"; 
import Compare from "./components/Compare";
import TransportOptimization from "./components/TransportOptimization";

function App() {
  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/meta")
      .then((res) => {
        if (res.data && Array.isArray(res.data.products)) {
          setProductOptions(res.data.products);
        } else {
          console.error("No valid products data found.");
        }
      })
      .catch((err) => {
        console.error("Error loading meta:", err);
      });
  }, []);

  return (
    <Router>
      <nav className="p-3 flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/compare">Compare</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/compare" element={<Compare productOptions={productOptions} />} />
        <Route path="/transport" element={<TransportOptimization />} />
      </Routes>
    </Router>
  );
}

export default App;
