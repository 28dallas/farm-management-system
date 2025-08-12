
import React, { useState, useEffect } from 'react';
import SummaryCards from './SummaryCards';
import CashFlow from './CashFlow';
import Projects from './Projects';
import apiService from '../services/api';

const FinanceTab = () => {
  const [revenueByCrop, setRevenueByCrop] = useState([]);
  const [profitMargin, setProfitMargin] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    const API_URL = 'http://localhost:5001';
    
    apiService.request('/api/revenue-by-crop')
      .then(data => setRevenueByCrop(data || []))
      .catch(err => console.error('Failed to fetch revenue by crop:', err));
    
    apiService.getSummary()
      .then(data => {
        if (data.totalRevenue !== undefined && data.totalExpenses !== undefined) {
          const margin = data.totalRevenue === 0 ? 0 : ((data.totalRevenue - data.totalExpenses) / data.totalRevenue) * 100;
          setProfitMargin(margin);
        }
      })
      .catch(err => console.error('Failed to fetch summary:', err));
    
    Promise.all([
      apiService.getIncome(),
      apiService.getExpenses()
    ])
    .then(([income, expenses]) => {
      setTransactions([
        ...(income || []).map(i => ({ ...i, type: 'Income' })),
        ...(expenses || []).map(e => ({ ...e, type: 'Expense' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)));
    })
    .catch(err => console.error('Failed to fetch transactions:', err));
    
    apiService.getProjects()
      .then(data => setProjects(data || []))
      .catch(err => console.error('Failed to fetch projects:', err));
  }, []);

  return (
    <div className="space-y-8">
      {/* Date Range and Filter Buttons */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="date"
          value={dateRange.from}
          onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="date"
          value={dateRange.to}
          onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Apply</button>
  {/* Report buttons moved to Reports tab */}
      </div>
      {/* Summary Cards */}
      <SummaryCards />
      {/* Revenue vs Expenses and Profit Margin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
          <CashFlow />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Profit Margin</h3>
          <p className="text-3xl font-bold text-blue-600">{profitMargin !== null ? profitMargin.toFixed(2) + '%' : 'N/A'}</p>
        </div>
      </div>
      {/* Revenue by Crop and Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Crop</h3>
          <ul className="divide-y divide-gray-200">
            {revenueByCrop.length === 0 && <li className="py-2 text-gray-500">No data</li>}
            {revenueByCrop.map((item, idx) => (
              <li key={idx} className="py-2 flex justify-between">
                <span>{item.crop}</span>
                <span className="font-semibold">KShs {item.revenue?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-left">Date</th>
                  <th className="px-2 py-1 text-left">Type</th>
                  <th className="px-2 py-1 text-left">Amount</th>
                  <th className="px-2 py-1 text-left">Source/Category</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr><td colSpan="4" className="text-gray-500 py-2">No transactions</td></tr>
                )}
                {transactions.slice(0, 8).map((t, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1">{t.date}</td>
                    <td className="px-2 py-1">{t.type}</td>
                    <td className="px-2 py-1">KShs {t.amount?.toLocaleString()}</td>
                    <td className="px-2 py-1">{t.type === 'Income' ? t.source : t.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Upcoming Projects */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Projects</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">Project</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Budget</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr><td colSpan="3" className="text-gray-500 py-2">No projects</td></tr>
              )}
              {projects.slice(0, 5).map((p, idx) => (
                <tr key={idx}>
                  <td className="px-2 py-1">{p.name}</td>
                  <td className="px-2 py-1">{p.status}</td>
                  <td className="px-2 py-1">KShs {p.budget?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceTab;
