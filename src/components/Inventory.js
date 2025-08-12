import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const Inventory = () => {
  const [items, setItems] = useState([]);
  // Placeholder for chart data and summary
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  useEffect(() => {
    apiService.getInventory()
      .then(data => setItems(data || []))
      .catch(err => {
        console.error('Failed to fetch inventory:', err);
        setItems([]);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Add Item</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="text-lg font-semibold mb-2">Total Items</div>
          <div className="text-3xl font-bold">{totalItems}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <div className="text-lg font-semibold mb-2">Total Value</div>
          <div className="text-3xl font-bold">KShs {totalValue.toLocaleString()}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold mb-2">Items by Category</div>
          {/* Placeholder for category chart or list */}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="font-semibold mb-2">Value by Category</div>
          {/* Placeholder for value chart */}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-teal-700 text-white">
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Category</th>
              <th className="px-2 py-1 text-left">Quantity</th>
              <th className="px-2 py-1 text-left">Unit</th>
              <th className="px-2 py-1 text-left">Unit Cost</th>
              <th className="px-2 py-1 text-left">Total Value</th>
              <th className="px-2 py-1 text-left">Location</th>
              <th className="px-2 py-1 text-left">Last Updated</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center text-gray-500 py-4">No items found</td>
              </tr>
            )}
            {items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-2 py-1">{item.name}</td>
                <td className="px-2 py-1">{item.category}</td>
                <td className="px-2 py-1">{item.quantity}</td>
                <td className="px-2 py-1">{item.unit}</td>
                <td className="px-2 py-1">{item.unitCost}</td>
                <td className="px-2 py-1">{item.totalValue}</td>
                <td className="px-2 py-1">{item.location}</td>
                <td className="px-2 py-1">{item.lastUpdated}</td>
                <td className="px-2 py-1">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2">Edit</button>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
