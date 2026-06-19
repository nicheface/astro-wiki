/**
 * DataChart.jsx — Minimal Recharts Chart Component
 *
 * Renders a clean line or bar chart from JSON data.
 * Stripped of visual noise: no heavy gridlines, subtle axes, Apple-grade minimalism.
 */
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ----- Types -----
interface ChartDataPoint {
  [key: string]: string | number;
}

interface DataChartProps {
  /** Array of data objects, e.g. [{ month: "Jan", value: 42 }, ...] */
  data: ChartDataPoint[];
  /** Chart type: "line" or "bar" */
  type?: "line" | "bar";
  /** Key for the y-axis numeric value */
  dataKey: string;
  /** Key for the x-axis label */
  xKey: string;
  /** Accent color (hex, e.g. "#3b82f6") */
  color?: string;
  /** Optional chart title */
  title?: string;
  /** Height in px */
  height?: number;
}

// ----- Custom Minimal Tooltip -----
function CustomTooltip({
  active,
  payload,
  label,
  dataKey,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  dataKey: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-zinc-100 dark:border-slate-700">
      <p className="text-xs text-zinc-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-slate-200">
        {dataKey}: {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

// ----- Main Component -----
export default function DataChart({
  data,
  type = "line",
  dataKey,
  xKey,
  color = "#3b82f6",
  title,
  height = 320,
}: DataChartProps) {
  const ChartComponent = type === "bar" ? BarChart : LineChart;

  return (
    <div className="not-prose my-10 p-6 rounded-2xl bg-zinc-50/50 dark:bg-slate-900/50 border border-zinc-100/60 dark:border-slate-800/60">
      {title && (
        <h4 className="text-sm font-medium text-zinc-500 dark:text-slate-400 mb-6 tracking-wide">
          {title}
        </h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          {/* Minimal grid — only horizontal, very faint */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f4f4f5"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            dx={-4}
            width={40}
          />
          <Tooltip
            content={<CustomTooltip dataKey={dataKey} />}
            cursor={{ stroke: "#e4e4e7", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          {type === "bar" ? (
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          ) : (
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
