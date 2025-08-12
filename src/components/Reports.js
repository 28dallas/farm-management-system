import React, { useState, useEffect } from 'react';
import FinancialSummaryReport from './FinancialSummaryReport';
import BalanceSheetReport from './BalanceSheetReport';
import IncomeStatementReport from './IncomeStatementReport';
import CashFlowReport from './CashFlowReport';
import apiService from '../services/api';

const API_URL = 'http://localhost:5001';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('');
  const [revenueByCrop, setRevenueByCrop] = useState([]);
  const [profitMargin, setProfitMargin] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
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

  // Download helpers (CSV export for demo)
  const downloadCSV = (data, filename) => {
    const csvRows = [];
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    for (const row of data) {
      csvRows.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setActiveReport('summary')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Financial Summary</button>
        <button onClick={() => setActiveReport('balance')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Balance Sheet</button>
        <button onClick={() => setActiveReport('income')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Income Statement</button>
        <button onClick={() => setActiveReport('cashflow')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Cash Flow</button>
      </div>

      {/* Report Sections */}
      {activeReport === 'summary' && (
        <FinancialSummaryReport />
      )}
      {activeReport === 'balance' && (
        <BalanceSheetReport profitMargin={profitMargin} transactions={transactions} />
      )}
      {activeReport === 'income' && (
        <IncomeStatementReport transactions={transactions} />
      )}
      {activeReport === 'cashflow' && (
        <CashFlowReport transactions={transactions} />
      )}
    </div>
  );
};

export default Reports;
