'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'W1', pending: 400 },
  { name: 'W2', pending: 300 },
  { name: 'W3', pending: 500 },
];

export default function PendingTrendChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="pending" stroke="#D97706" fill="#F59E0B" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
