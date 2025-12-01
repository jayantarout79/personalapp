import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { InsightSummary } from "../types";
import { formatCurrency } from "../utils";

const chartColors = ["#0EA5E9", "#22C55E", "#F59E0B", "#F97316", "#64748B"];

type InsightsProps = {
  insights: InsightSummary | null;
  loading?: boolean;
};

export function InsightsPanel({ insights, loading }: InsightsProps) {
  const hasData = insights && insights.trend.length > 0;
  const renderCategoryLabel = ({ value, payload }: PieLabelRenderProps) => {
    const data = payload as { category?: string; name?: string; amount?: number };
    const amount =
      typeof value === "number" ? value : Number(data?.amount ?? (value as number) ?? 0);
    const label = data?.category || data?.name || "";
    return label ? `${label} ${formatCurrency(amount)}` : formatCurrency(amount);
  };

  const cumulativeTrend =
    insights?.trend?.reduce<{ date: string; amount: number; cumulative: number }[]>(
      (acc, item) => {
        const last = acc[acc.length - 1];
        const cumulative = (last?.cumulative || 0) + (item.amount || 0);
        acc.push({ ...item, cumulative });
        return acc;
      },
      []
    ) || [];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h3>Expense overview</h3>
        </div>
      </div>

      {loading && <p className="muted">Crunching numbers...</p>}
      {!loading && !hasData && <p className="muted">Add transactions to see insights.</p>}

      {insights && hasData && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <p className="eyebrow">Total spent</p>
              <h3>{formatCurrency(insights.totalSpent)}</h3>
            </div>
            <div className="summary-card">
              <p className="eyebrow">Average daily</p>
              <h3>{formatCurrency(insights.averageDaily)}</h3>
            </div>
            <div className="summary-card">
              <p className="eyebrow">Top category</p>
              <h3>
                {insights.topCategory.category} · {formatCurrency(insights.topCategory.amount)}
              </h3>
            </div>
            <div className="summary-card">
              <p className="eyebrow">Transactions</p>
              <h3>{insights.count}</h3>
            </div>
          </div>

          <div className="charts">
            <div className="chart">
              <div className="chart-header">
                <h4>Spend over time (cumulative)</h4>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={cumulativeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#0EA5E9"
                    strokeWidth={3}
                    dot={false}
                  />
                  {cumulativeTrend.length > 0 && (
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="transparent"
                      dot={{
                        r: 6,
                        fill: "#0EA5E9",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      activeDot={false}
                      legendType="none"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart">
              <div className="chart-header">
                <h4>By category</h4>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    dataKey="amount"
                    nameKey="category"
                    data={insights.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={renderCategoryLabel}
                  >
                    {insights.categoryBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={chartColors[index % chartColors.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
