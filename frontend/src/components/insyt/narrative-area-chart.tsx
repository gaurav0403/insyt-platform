"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { VolumeBucket } from "@/lib/mock/narratives";

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-surface-edge px-3 py-2">
      <p className="t-label text-text-3 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="t-small text-text">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function NarrativeAreaChart({
  data,
}: {
  data: VolumeBucket[];
}) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis
            dataKey="date"
            tick={
              {
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fill: "#7A7263",
              } as any
            }
            tickFormatter={(d: string) => d.slice(5)}
            axisLine={{ stroke: "#2A261E" }}
            tickLine={false}
            interval={14}
          />
          <YAxis
            tick={
              {
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fill: "#7A7263",
              } as any
            }
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="neutral"
            stackId="1"
            fill="#4A4438"
            stroke="none"
          />
          <Area
            type="monotone"
            dataKey="competitors"
            stackId="1"
            fill="#2A261E"
            stroke="none"
          />
          <Area
            type="monotone"
            dataKey="yours"
            stackId="1"
            fill="#C8392C"
            fillOpacity={0.7}
            stroke="#E85543"
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
