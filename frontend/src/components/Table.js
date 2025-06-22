function Table({ data }) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Region</th>
            <th className="border px-4 py-2">Product ID</th>
            <th className="border px-4 py-2">Sales</th>
            <th className="border px-4 py-2">Predicted Demand</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{row.date}</td>
              <td className="border px-4 py-2">{row.region}</td>
              <td className="border px-4 py-2">{row.product_id}</td>
              <td className="border px-4 py-2">{row.sales}</td>
              <td className="border px-4 py-2">{row.predicted_demand?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default Table;
