import React, { useState, useEffect } from 'react';

const SummaryCards = ({ filters }) => {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        
        const params = new URLSearchParams();
        if (filters?.project && filters.project !== 'All Projects') {
          params.append('project', filters.project);
        }
        if (filters?.fromDate) {
          params.append('fromDate', filters.fromDate);
        }
        if (filters?.toDate) {
          params.append('toDate', filters.toDate);
        }
        
        // Fetch income and expenses data directly
        const [incomeRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/api/income?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/api/expenses?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);
        
        if (incomeRes.ok && expensesRes.ok) {
          const incomeData = await incomeRes.json();
          const expensesData = await expensesRes.json();
          
          // Calculate totals from actual data
          const totalRevenue = incomeData.reduce((sum, item) => {
            return sum + (item.totalIncome || item.amount || 0);
          }, 0);
          
          const totalExpenses = expensesData.reduce((sum, item) => {
            return sum + (item.totalCost || item.amount || 0);
          }, 0);
          
          const netProfit = totalRevenue - totalExpenses;
          
          setSummary({
            totalRevenue,
            totalExpenses,
            netProfit
          });
        }
      } catch (err) {
        console.error('Error fetching summary:', err);
      }
    };
    fetchSummary();
  }, [filters]);

  const cards = [
    { title: 'Total Revenue', value: `KShs ${summary.totalRevenue.toFixed(2)}`, color: 'text-green-600' },
    { title: 'Total Expenses', value: `KShs ${summary.totalExpenses.toFixed(2)}`, color: 'text-red-600' },
    { title: 'Net Profit', value: `KShs ${summary.netProfit.toFixed(2)}`, color: 'text-blue-600' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">{card.title}</h3>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;