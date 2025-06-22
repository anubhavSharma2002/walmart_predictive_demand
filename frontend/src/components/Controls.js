function Controls({ filters, setFilters, productOptions }) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center mb-4">
      <select
        className="border p-2 rounded"
        value={filters.product}
        onChange={(e) => setFilters({ ...filters, product: e.target.value })}
      >
        <option value="">All Products</option>
        {productOptions.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <input
        type="date"
        className="border p-2 rounded"
        value={filters.date}
        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
      />

      <button
        onClick={() => window.open("http://localhost:8000/download")}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Export CSV
      </button>
    </div>
  );
}
export default Controls;
