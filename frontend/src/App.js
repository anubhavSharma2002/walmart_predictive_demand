import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import Dashboard from "./components/Dashboard";
import Compare from "./components/Compare";
import TransportOptimization from "./components/TransportOptimization";

function Navbar() {
  const location = useLocation();
  const current = location.pathname;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/compare", label: "Compare" },
    { path: "/transport", label: "Transport Optimization" },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-[#F3F5FF]/70 font-[Poppins] shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-[#5335d9] text-2xl font-bold">Walmart Predictive Dashboard</div>
        <div className="flex gap-6 text-sm sm:text-base font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition px-3 py-1.5 rounded-md ${current === link.path
                  ? "bg-[#5335d9] rounded-full px-4 text-white"
                  : "text-gray-700 hover:bg-[#e0e7ff] rounded-full px-3"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>

  );
}


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
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/compare" element={<Compare productOptions={productOptions} />} />
        <Route path="/transport" element={<TransportOptimization />} />
      </Routes>
    </Router>
  );
}

export default App;
