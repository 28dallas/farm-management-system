import React, { useState, useEffect } from 'react';

const Filters = ({ onFilterChange }) => {
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const projects = ['All Projects', 'Project A', 'Project B', 'Project C'];

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        project: selectedProject,
        fromDate,
        toDate
      });
    }
  };

  // Auto-apply filters when values change
  useEffect(() => {
    handleApplyFilters();
  }, [selectedProject, fromDate, toDate]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[140px]"
          >
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="pt-6">
          <button 
            onClick={handleApplyFilters}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;