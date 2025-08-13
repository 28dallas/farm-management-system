import React from 'react';
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
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ filters }) => {
  const [chartData, setChartData] = React.useState({
    cashFlow: { income: [], expenses: [], labels: [] },
    projectRevenue: { data: [], labels: [] },
    profitMargin: { data: [], labels: [] }
  });

  React.useEffect(() => {
    const fetchChartData = async () => {
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
        
        const [incomeRes, expensesRes] = await Promise.all([
          fetch(`${API_URL}/api/income?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/expenses?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        if (incomeRes.ok && expensesRes.ok) {
          const incomeData = await incomeRes.json();
          const expensesData = await expensesRes.json();
          
          // Process data for charts
          const processedData = processChartData(incomeData, expensesData, filters);
          setChartData(processedData);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      }
    };
    
    fetchChartData();
  }, [filters]);

  const processChartData = (income, expenses, filters) => {
    // Group data by date or month based on filter range
    const labels = [];
    const incomeByPeriod = [];
    const expensesByPeriod = [];
    const revenueByPeriod = [];
    const profitMarginByPeriod = [];
    
    if (filters?.fromDate && filters?.toDate) {
      // Daily data for specific date range
      const start = new Date(filters.fromDate);
      const end = new Date(filters.toDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        labels.push(dateStr);
        
        const dayIncome = income.filter(i => i.date === dateStr).reduce((sum, i) => sum + (i.amount || 0), 0);
        const dayExpenses = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + (e.amount || 0), 0);
        
        incomeByPeriod.push(dayIncome);
        expensesByPeriod.push(dayExpenses);
        revenueByPeriod.push(dayIncome);
        profitMarginByPeriod.push(dayIncome > 0 ? ((dayIncome - dayExpenses) / dayIncome * 100) : 0);
      }
    } else {
      // Monthly data for broader view
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      
      months.forEach((month, index) => {
        labels.push(month);
        
        const monthIncome = income.filter(i => {
          const itemDate = new Date(i.date);
          return itemDate.getMonth() === index && itemDate.getFullYear() === currentYear;
        }).reduce((sum, i) => sum + (i.amount || 0), 0);
        
        const monthExpenses = expenses.filter(e => {
          const itemDate = new Date(e.date);
          return itemDate.getMonth() === index && itemDate.getFullYear() === currentYear;
        }).reduce((sum, e) => sum + (e.amount || 0), 0);
        
        incomeByPeriod.push(monthIncome);
        expensesByPeriod.push(monthExpenses);
        revenueByPeriod.push(monthIncome);
        profitMarginByPeriod.push(monthIncome > 0 ? ((monthIncome - monthExpenses) / monthIncome * 100) : 0);
      });
    }
    
    return {
      cashFlow: { income: incomeByPeriod, expenses: expensesByPeriod, labels },
      projectRevenue: { data: revenueByPeriod, labels },
      profitMargin: { data: profitMarginByPeriod, labels }
    };
  };

  const cashFlowData = {
    labels: chartData.cashFlow.labels,
    datasets: [
      {
        label: 'Income',
        data: chartData.cashFlow.income,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Expenses',
        data: chartData.cashFlow.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      },
    ],
  };

  const projectRevenueData = {
    labels: chartData.projectRevenue.labels,
    datasets: [
      {
        label: 'Revenue',
        data: chartData.projectRevenue.data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
    ],
  };

  const profitMarginData = {
    labels: chartData.profitMargin.labels,
    datasets: [
      {
        label: 'Profit Margin %',
        data: chartData.profitMargin.data,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash Flow</h3>
        <Bar data={cashFlowData} options={options} />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Revenue</h3>
        <Bar data={projectRevenueData} options={options} />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit Margin %</h3>
        <Line data={profitMarginData} options={options} />
      </div>
    </div>
  );
};

export default Charts;