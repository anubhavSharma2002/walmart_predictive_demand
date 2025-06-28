import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Chart({ data, selectedProduct }) {
  return (
    <div className="w-full h-[400px] my-8 p-6 rounded-2xl shadow-sm font-[Poppins] bg-[#F3F5FF]">
      <h2 className="text-2xl font-semibold text-center text-[#1E293B] mb-4">
        {selectedProduct
          ? `Predicted Demand for ${selectedProduct}`
          : "Predicted Demand (Top 10 Products)"}
      </h2>

      <div className="w-full h-full rounded-xl">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.slice(0, 30)}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="date"
              stroke="#94A3B8"
              tick={{ fill: "#475569", fontSize: 12 }}
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fill: "#475569", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #5335D9",
                borderRadius: "8px",
                color: "#0F172A",
                fontSize: 14,
              }}
              labelStyle={{ color: "#0F172A", fontWeight: "bold" }}
              itemStyle={{ color: "#5335D9" }}
              cursor={{ stroke: "#5335D9", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="predicted_demand"
              stroke="#5335D9"
              strokeWidth={2}
              dot={{ r: 3, fill: "#5335D9" }}
              activeDot={{ r: 6, fill: "#5335D9", stroke: "#0B0A33" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Chart;
