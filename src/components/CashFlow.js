import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import apiService from '../services/api';

const CashFlow = () => {
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    apiService.request('/api/monthly-financials')
      .then(data => setMonthlyData(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error fetching monthly data:', err);
        setMonthlyData([]);
      });
  }, []);

  const chartData = {
    labels: monthlyData.length > 0 ? monthlyData.map(item => item.month?.slice(0, 3) || 'N/A') : ['Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Income',
        data: monthlyData.length > 0 ? monthlyData.map(item => item.income || 0) : [0, 0, 0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Expenses',
        data: monthlyData.length > 0 ? monthlyData.map(item => item.expenses || 0) : [0, 0, 0],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Cash on Hand',
        data: monthlyData.length > 0 ? monthlyData.map(item => item.cashOnHand || 0) : [1000000, 1000000, 1000000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      }
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Cash Flow Analysis'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'KShs ' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-5 gap-2 mb-4 text-center">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-base font-semibold truncate">KShs 1M</div>
            <div className="text-xs text-gray-500">Start</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-base font-semibold truncate">KShs 0</div>
            <div className="text-xs text-gray-500">Income</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-base font-semibold truncate">KShs 0</div>
            <div className="text-xs text-gray-500">Expense</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-base font-semibold text-green-600">OK</div>
            <div className="text-xs text-gray-500">Status</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-base font-semibold truncate">KShs 1M</div>
            <div className="text-xs text-gray-500">Current</div>
          </div>
        </div>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default CashFlow;