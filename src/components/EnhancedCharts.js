import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, DollarSign, Package, Calendar, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const EnhancedCharts = ({ filters }) => {
  const [chartData, setChartData] = useState({
    cashFlow: { income: [], expenses: [], labels: [] },
    projectRevenue: { data: [], labels: [] },
    profitMargin: { data: [], labels: [] },
    cropDistribution: { data: [], labels: [] },
    expenseBreakdown: { data: [], labels: [] },
    monthlyTrend: { income: [], expenses: [], labels: [] },
    dailyTrend: { income: [], expenses: [], labels: [] }
  });

  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState('overview');

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
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
        
        const [incomeRes, expensesRes, revenueByCropRes] = await Promise.all([
          fetch(`${API_URL}/api/income?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/expenses?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/revenue-by-crop?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (incomeRes.ok && expensesRes.ok && revenueByCropRes.ok) {
          const incomeData = await incomeRes.json();
          const expensesData = await expensesRes.json();
          const revenueByCropData = await revenueByCropRes.json();
          
          const processedData = processChartData(incomeData, expensesData, revenueByCropData, filters);
          setChartData(processedData);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [filters]);

  const processChartData = (income, expenses, revenueByCrop, filters) => {
    // Process data based on selected filters
    const isSingleDate = filters?.fromDate && (!filters?.toDate || filters.fromDate === filters.toDate);
    
    if (isSingleDate) {
      // Single date view - show detailed breakdown
      const targetDate = filters.fromDate;
      
      // Cash flow by project
      const cashFlowByProject = {};
      income.forEach(item => {
        if (item.date === targetDate) {
          cashFlowByProject[item.project || 'Unknown'] = (cashFlowByProject[item.project || 'Unknown'] || 0) + (item.totalIncome || item.amount || 0);
        }
      });
      
      expenses.forEach(item => {
        if (item.date === targetDate) {
          cashFlowByProject[item.project || 'Unknown'] = (cashFlowByProject[item.project || 'Unknown'] || 0) - (item.totalCost || item.amount || 0);
        }
      });
      
      // Calculate profit margins
      const profitMargins = Object.keys(cashFlowByProject).map(project => {
        const revenue = income.filter(i => i.date === targetDate && (i.project || 'Unknown') === project).reduce((sum, i) => sum + (i.totalIncome || i.amount || 0), 0);
        const costs = expenses.filter(e => e.date === targetDate && (e.project || 'Unknown') === project).reduce((sum, e) => sum + (e.totalCost || e.amount || 0), 0);
        return revenue > 0 ? ((revenue - costs) / revenue * 100) : 0;
      });
      
      return {
        cashFlow: {
          labels: Object.keys(cashFlowByProject),
          income: Object.values(cashFlowByProject).map(val => Math.max(0, val)),
          expenses: Object.values(cashFlowByProject).map(val => Math.abs(Math.min(0, val))),
        },
        profitMargin: {
          labels: Object.keys(cashFlowByProject),
          data: profitMargins
        },
        cropDistribution: {
          labels: revenueByCrop.map(item => item.crop),
          data: revenueByCrop.map(item => item.totalRevenue || 0),
        },
        expenseBreakdown: {
          labels: [...new Set(expenses.map(e => e.category || 'Other'))],
          data: [...new Set(expenses.map(e => e.category || 'Other'))].map(category => 
            expenses.filter(e => (e.category || 'Other') === category).reduce((sum, e) => sum + (e.totalCost || e.amount || 0), 0)
          ),
        },
        monthlyTrend: {
          labels: [],
          income: [],
          expenses: []
        },
        projectRevenue: {
          labels: Object.keys(cashFlowByProject),
          data: Object.values(cashFlowByProject)
        }
      };
    } else {
      // Date range view - show trends
      const monthlyData = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      months.forEach((month, index) => {
        const monthIncome = income.filter(i => {
          const date = new Date(i.date);
          return date.getMonth() === index && date.getFullYear() === new Date().getFullYear();
        }).reduce((sum, i) => sum + (i.totalIncome || i.amount || 0), 0);
        
        const monthExpenses = expenses.filter(e => {
          const date = new Date(e.date);
          return date.getMonth() === index && date.getFullYear() === new Date().getFullYear();
        }).reduce((sum, e) => sum + (e.totalCost || e.amount || 0), 0);
        
        monthlyData[month] = { income: monthIncome, expenses: monthExpenses };
      });
      
      // Project revenue data
      const projectRevenue = {};
      income.forEach(item => {
        projectRevenue[item.project || 'Unknown'] = (projectRevenue[item.project || 'Unknown'] || 0) + (item.totalIncome || item.amount || 0);
      });
      
      // Calculate profit margins for projects
      const projectProfitMargins = Object.keys(projectRevenue).map(project => {
        const revenue = income.filter(i => (i.project || 'Unknown') === project).reduce((sum, i) => sum + (i.totalIncome || i.amount || 0), 0);
        const costs = expenses.filter(e => (e.project || 'Unknown') === project).reduce((sum, e) => sum + (e.totalCost || e.amount || 0), 0);
        return revenue > 0 ? ((revenue - costs) / revenue * 100) : 0;
      });
      
      return {
        cashFlow: {
          labels: months,
          income: Object.values(monthlyData).map(d => d.income),
          expenses: Object.values(monthlyData).map(d => d.expenses),
        },
        profitMargin: {
          labels: Object.keys(projectRevenue),
          data: projectProfitMargins
        },
        cropDistribution: {
          labels: revenueByCrop.map(item => item.crop),
          data: revenueByCrop.map(item => item.totalRevenue || 0),
        },
        expenseBreakdown: {
          labels: [...new Set(expenses.map(e => e.category || 'Other'))],
          data: [...new Set(expenses.map(e => e.category || 'Other'))].map(category => 
            expenses.filter(e => (e.category || 'Other') === category).reduce((sum, e) => sum + (e.totalCost || e.amount || 0), 0)
          ),
        },
        monthlyTrend: {
          labels: months,
          income: Object.values(monthlyData).map(d => d.income),
          expenses: Object.values(monthlyData).map(d => d.expenses)
        },
        projectRevenue: {
          labels: Object.keys(projectRevenue),
          data: Object.values(projectRevenue)
        }
      };
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact'
            }).format(value);
          }
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Define chart data objects based on chartData state
  const cashFlowData = {
    labels: chartData.cashFlow?.labels || [],
    datasets: [
      {
        label: 'Income',
        data: chartData.cashFlow?.income || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Expenses',
        data: chartData.cashFlow?.expenses || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const profitMarginData = {
    labels: chartData.profitMargin?.labels || [],
    datasets: [
      {
        label: 'Profit Margin %',
        data: chartData.profitMargin?.data || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const cropDistributionData = {
    labels: chartData.cropDistribution?.labels || [],
    datasets: [
      {
        data: chartData.cropDistribution?.data || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const expenseBreakdownData = {
    labels: chartData.expenseBreakdown?.labels || [],
    datasets: [
      {
        data: chartData.expenseBreakdown?.data || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Enhanced Dashboard Analytics</h2>
        <p className="text-blue-100">Interactive charts and real-time insights for your farm operations</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-gray-900">
                ${chartData.cashFlow.income.reduce((sum, val) => sum + val, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                ${chartData.cashFlow.expenses.reduce((sum, val) => sum + val, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(chartData.cashFlow.income.reduce((sum, val) => sum + val, 0) - 
                   chartData.cashFlow.expenses.reduce((sum, val) => sum + val, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {chartData.projectRevenue.labels.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Cash Flow Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Interactive Cash Flow</h3>
          <div className="h-96">
            <Bar data={cashFlowData} options={chartOptions} />
          </div>
        </div>
        
        {/* Real-time Profit Margin */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Profit Margin Trend</h3>
          <div className="h-96">
            <Line data={profitMarginData} options={chartOptions} />
          </div>
        </div>
        
        {/* Crop Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Revenue by Crop</h3>
          <div className="h-96">
            <Doughnut data={cropDistributionData} options={pieOptions} />
          </div>
        </div>
        
        {/* Expense Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Expense Breakdown</h3>
          <div className="h-96">
            <Pie data={expenseBreakdownData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Monthly Trend Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Financial Trend</h3>
        <div className="h-96">
          <Line data={{
            labels: chartData.monthlyTrend.labels,
            datasets: [
              {
                label: 'Income',
                data: chartData.monthlyTrend.income,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Expenses',
                data: chartData.monthlyTrend.expenses,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                tension: 0.4,
                fill: true
              }
            ]
          }} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default EnhancedCharts;
