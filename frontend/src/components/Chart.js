import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function Chart({ data, selectedProduct }) {
  return (
    <div className="w-full h-[300px] my-6">
      <h2 className="text-xl font-semibold text-center mb-2">
        {selectedProduct ? `Predicted Demand for ${selectedProduct}` : "Predicted Demand (Top 10 Products)"}
      </h2>
      <ResponsiveContainer>
        <LineChart data={data.slice(0, 30)}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="predicted_demand" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export default Chart;
