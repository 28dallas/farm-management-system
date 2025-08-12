import React, { useState, useEffect } from 'react';
import AddExpenseModal from './AddExpenseModal';
import apiService from '../services/api';


const defaultCategories = ['Utilities', 'Supplies', 'Labor', 'Transport'];
const defaultUoMs = ['kg', 'litre', 'piece', 'hour'];

const ExpensesReport = () => {
  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Select Filter Type');
  const [filterValue, setFilterValue] = useState('');
  const [categories, setCategories] = useState([...defaultCategories]);
  const [uoms, setUoms] = useState([...defaultUoMs]);
  const [newCategory, setNewCategory] = useState('');
  const [newUom, setNewUom] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUom, setSelectedUom] = useState('');
  const [localExpenses, setLocalExpenses] = useState([]);

  const handleAddExpense = (newExpense) => {
    setLocalExpenses(prev => [...prev, newExpense]);
  };

  useEffect(() => {
    apiService.getExpenses()
      .then(data => setExpenses(data || []))
      .catch(err => console.error('Error fetching expenses:', err));
  }, []);

  const allExpenses = [...expenses, ...localExpenses];
  const totalExpenses = allExpenses.reduce((sum, expense) => sum + (expense.amount || expense.totalCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-gray-800">KShs {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Payable</h3>
          <p className="text-3xl font-bold text-gray-800">KShs 0.00</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Paid</h3>
          <p className="text-3xl font-bold text-gray-800">KShs {totalExpenses.toLocaleString()}</p>
        </div>
      </div>


      {/* Add Expense Button and Modal */}
      <AddExpenseModal
        categories={categories}
        setCategories={setCategories}
        uoms={uoms}
        setUoms={setUoms}
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
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                  No expenses recorded yet
                </td>
              </tr>
            ) : (
              [...allExpenses, ...Array(Math.max(0, 3 - allExpenses.length)).fill(null)].map((expense, index) => (
                <tr key={expense?.id || `empty-${index}`}>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.date || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.category || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.category || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.amount ? `KShs ${expense.amount.toLocaleString()}` : expense?.totalCost ? `KShs ${expense.totalCost.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense?.status === 'Paid' ? 'Yes' : expense ? 'No' : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">-</td>
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