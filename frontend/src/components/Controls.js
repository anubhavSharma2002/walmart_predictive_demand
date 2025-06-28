function Controls({ filters, setFilters, productOptions }) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center mb-6 bg-[#F3F5FF] font-[Poppins]">
      <select
        className="bg-white text-[#1E293B] border border-gray-300 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition"
        value={filters.product}
        onChange={(e) => setFilters({ ...filters, product: e.target.value })}
      >
        <option value="">All Products</option>
        {productOptions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <input
        type="date"
        className="bg-white text-[#1E293B] border border-gray-300 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition"
        value={filters.date}
        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
      />

      <button
        onClick={() => window.open("http://localhost:8000/download")}
        className="bg-[#0B0A33] hover:bg-[#5335D9] text-white font-medium px-6 py-2 rounded-full transition"
      >
        Export CSV
      </button>
    </div>
  );
}

export default Controls;
