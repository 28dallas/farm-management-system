import React, { useState, useEffect } from 'react';
import AddExpenseModal from './AddExpenseModal';
import apiService from '../services/api';


const defaultCategories = ['Utilities', 'Supplies', 'Labor', 'Transport'];
const defaultUoMs = ['kg', 'litre', 'piece', 'hour'];
const projects = ['All Projects', 'Project A', 'Project B', 'Project C'];

const ExpensesReport = ({ filters = {} }) => {
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Select Filter Type');
  const [filterValue, setFilterValue] = useState('');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [categories, setCategories] = useState([...defaultCategories]);
  const [uoms, setUoms] = useState([...defaultUoMs]);
  const [newCategory, setNewCategory] = useState('');
  const [newUom, setNewUom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUom, setSelectedUom] = useState('');
  const [localExpenses, setLocalExpenses] = useState([]);
  const [projectSummary, setProjectSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalCrops: 0,
    totalAcreage: 0,
    totalYield: 0
  });

  const handleAddExpense = (newExpense) => {
    setLocalExpenses(prev => [...prev, newExpense]);
    // Refresh expenses from backend to get the latest data
    setTimeout(() => {
      fetchExpenses();
    }, 500);
  };

  const fetchExpenses = async () => {
    try {
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
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/expenses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExpenses(data || []);
        // Clear local expenses since they're now in the backend data
        setLocalExpenses([]);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  // Filter expenses based on selected project
  const filteredExpenses = [...expenses, ...localExpenses].filter(expense => {
    if (selectedProject === 'All Projects') {
      return true;
    }
    return expense.project === selectedProject;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || expense.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Project Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {filters.project === 'All Projects' ? 'All Projects' : filters.project} Summary
          </h3>
          <div className="space-y-2">
            <p className="text-xl font-bold text-gray-800">
              KShs {projectSummary.totalIncome.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-xl font-bold text-red-600">
              KShs {projectSummary.totalExpenses.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-xl font-bold text-green-600">
              KShs {projectSummary.totalProfit.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Profit</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Project Overview</h3>
          <div className="space-y-2">
            <p className="text-xl font-bold text-blue-600">
              {projectSummary.totalCrops}
            </p>
            <p className="text-sm text-gray-600">Total Crops</p>
            <p className="text-xl font-bold text-purple-600">
              {projectSummary.totalAcreage}
            </p>
            <p className="text-sm text-gray-600">Total Acreage</p>
            <p className="text-xl font-bold text-orange-600">
              {projectSummary.totalYield}
            </p>
            <p className="text-sm text-gray-600">Total Yield</p>
          </div>
        </div>
      </div>


      {/* Add Expense Button and Modal */}
      <AddExpenseModal
        categories={categories}
        setCategories={setCategories}
        uoms={uoms}
        setUoms={setUoms}
        projects={projects.map(project => ({ name: project }))}
        onAddExpense={handleAddExpense}
      />

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-64"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
        <span className="text-gray-700">Filter By:</span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        >
          <option>Select Filter Type</option>
          <option>Category</option>
          <option>Date</option>
          <option>Amount</option>
        </select>
        <input
          type="text"
          placeholder="Enter filter value"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
        <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg">
          Apply Filters
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Project</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium">UoM</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Units</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Cost/Unit</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Other Costs</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Total Cost</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Paid</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-4 py-8 text-center text-gray-500">
                  {selectedProject === 'All Projects' 
                    ? 'No expenses recorded yet' 
                    : `No expenses found for ${selectedProject}`}
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense, index) => (
                <tr key={expense?.id || `expense-${index}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.date || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.project || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.description || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.category || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.uom || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.units || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.costPerUnit ? `KShs ${expense.costPerUnit}` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.otherCosts ? `KShs ${expense.otherCosts}` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.totalCost ? `KShs ${expense.totalCost.toLocaleString()}` : expense?.amount ? `KShs ${expense.amount.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.status === 'Paid' ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2 text-xs">Edit</button>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Page 1 of {Math.max(1, Math.ceil((expenses.length + 10) / 10))}
        </div>
      </div>

      {/* Total Summary */}
      <div className="text-right">
        <div className="bg-white rounded-lg shadow p-4 inline-block">
          <h4 className="font-semibold text-gray-800 mb-2">Total Summary</h4>
          <p className="text-lg">Total Expenses: <span className="font-bold">KShs {totalExpenses.toLocaleString()}</span></p>
        </div>
      </div>
    </div>
  );
};

export default ExpensesReport;