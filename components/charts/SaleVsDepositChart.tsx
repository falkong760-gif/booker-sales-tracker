'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', sales: 4000, deposits: 2400 },
  { name: 'Feb', sales: 3000, deposits: 1398 },
  { name: 'Mar', sales: 2000, deposits: 9800 },
];

export default function SaleVsDepositChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="sales" fill="#0F3D5C" name="Sales" />
          <Bar dataKey="deposits" fill="#0E8A7D" name="Deposits" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
