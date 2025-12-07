import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { InsightSummary, Transaction } from "../types";
import { formatCurrency, parseLocalDate } from "../utils";

const chartColors = ["#0EA5E9", "#22C55E", "#F59E0B", "#F97316", "#64748B"];

type InsightsProps = {
  insights: InsightSummary | null;
  transactions: Transaction[];
  categories: string[];
  loading?: boolean;
};

type RangeKey = "month" | "60" | "90" | "180";

const rangeOptions: { label: string; value: RangeKey }[] = [
  { label: "Current month", value: "month" },
  { label: "Last 60 days", value: "60" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 180 days", value: "180" },
];

const buildFiltered = (transactions: Transaction[], range: RangeKey, category: string) => {
  const now = new Date();
  const start =
    range === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getTime() - Number(range) * 24 * 60 * 60 * 1000);

  const filtered = transactions.filter((tx) => {
    const date = parseLocalDate(tx.date);
    if (!date) return false;
    if (date < start || date > now) return false;
    if (category && tx.category !== category) return false;
    return true;
  });

  const totalsByDate: Record<string, number> = {};
  filtered.forEach((tx) => {
    totalsByDate[tx.date] = (totalsByDate[tx.date] || 0) + (Number(tx.amount) || 0);
  });

  const datesSorted = Object.keys(totalsByDate).sort();
  let running = 0;
  const timeSeries = datesSorted.map((date) => {
    running += totalsByDate[date];
    return { date, amount: totalsByDate[date], cumulative: running };
  });

  const categoryTotals: Record<string, number> = {};
  filtered.forEach((tx) => {
    categoryTotals[tx.category || "Other"] =
      (categoryTotals[tx.category || "Other"] || 0) + (Number(tx.amount) || 0);
  });
  const categoryBreakdown = Object.entries(categoryTotals).map(([cat, amount]) => ({
    category: cat,
    amount,
  }));

  return { filtered, timeSeries, categoryBreakdown };
};

export function InsightsPanel({ insights, transactions, categories, loading }: InsightsProps) {
  const [range, setRange] = useState<RangeKey>("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const { timeSeries, categoryBreakdown } = buildFiltered(transactions, range, categoryFilter);
  const hasData = insights && insights.trend.length > 0;
  const renderCategoryLabel = ({ value, payload }: PieLabelRenderProps) => {
    const data = payload as { category?: string; name?: string; amount?: number };
    const amount =
      typeof value === "number" ? value : Number(data?.amount ?? (value as number) ?? 0);
    const label = data?.category || data?.name || "";
    return label ? `${label} ${formatCurrency(amount)}` : formatCurrency(amount);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h3>Expense overview</h3>
        </div>
        <div className="chart-filters">
          <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>
            {rangeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
                <h4>Spend over time</h4>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" name="Daily spend" fill="#0EA5E9" />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative"
                    stroke="#F97316"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
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
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={renderCategoryLabel}
                  >
                    {categoryBreakdown.map((_, index) => (
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
