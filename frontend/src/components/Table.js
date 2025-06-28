function Table({ data }) {
  return (
    <div className="overflow-x-auto mt-6 font-[Poppins]">
      <table className="min-w-full border border-gray-200 bg-[#F3F5FF] rounded-lg shadow-sm overflow-hidden">
        <thead className="bg-[#5335D9] text-white">
          <tr>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold rounded-tl-lg">
              Date
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">
              Region
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">
              Product ID
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">
              Sales
            </th>
            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold rounded-tr-lg">
              Predicted Demand
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="hover:bg-[#E0F2FE] transition-colors text-[#334155] text-sm"
            >
              <td className="border border-gray-200 px-4 py-2">{row.date}</td>
              <td className="border border-gray-200 px-4 py-2">{row.region}</td>
              <td className="border border-gray-200 px-4 py-2">{row.product_id}</td>
              <td className="border border-gray-200 px-4 py-2">{row.sales}</td>
              <td className="border border-gray-200 px-4 py-2">
                {row.predicted_demand?.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
