"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

interface RatingChartProps {
  data: { stars: number; count: number }[];
}

const COLORS = ["#C8392C", "#C8392C", "#9A7A2E", "#5A6B3F", "#5A6B3F"];

export default function RatingChart({ data }: RatingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" barSize={16}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="stars"
          tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "#7A7263" }}
          axisLine={false}
          tickLine={false}
          width={24}
          tickFormatter={(v: number) => `${v}★`}
        />
        <Bar dataKey="count" radius={0}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
