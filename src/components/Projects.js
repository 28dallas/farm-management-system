
import React, { useState, useEffect } from 'react';
import AddProjectModal from './AddProjectModal';

const Projects = ({ filters }) => {
  const [projects, setProjects] = useState([]);
  const [localProjects, setLocalProjects] = useState([]);

  const handleAddProject = (newProject) => {
    setLocalProjects(prev => [...prev, newProject]);
  };

  useEffect(() => {
    const fetchProjects = async () => {
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
        
        const response = await fetch(`${API_URL}/api/projects?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProjects(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch projects:', response.status);
          setProjects([]);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setProjects([]);
      }
    };
    fetchProjects();
  }, [filters]);

  // Filter local projects based on filters
  const filteredLocalProjects = localProjects.filter(project => {
    if (filters?.project && filters.project !== 'All Projects' && project.name !== filters.project) {
      return false;
    }
    if (filters?.fromDate && project.startDate < filters.fromDate) {
      return false;
    }
    if (filters?.toDate && project.startDate > filters.toDate) {
      return false;
    }
    return true;
  });

  const allProjects = [...projects, ...filteredLocalProjects];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex gap-2 mb-4">
        <AddProjectModal onAddProject={handleAddProject} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-teal-700 text-white">
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Crop</th>
              <th className="px-2 py-1 text-left">Acreage</th>
              <th className="px-2 py-1 text-left">Yield/Acre</th>
              <th className="px-2 py-1 text-left">Market Price</th>
              <th className="px-2 py-1 text-left">Cost/Acre</th>
              <th className="px-2 py-1 text-left">Est. Income</th>
              <th className="px-2 py-1 text-left">Est. Cost</th>
              <th className="px-2 py-1 text-left">Status</th>
              <th className="px-2 py-1 text-left">Start Date</th>
              <th className="px-2 py-1 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allProjects.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center text-gray-500 py-4">No projects found</td>
              </tr>
            )}
            {allProjects.map((project, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-2 py-1">{project.name}</td>
                <td className="px-2 py-1">{project.crop}</td>
                <td className="px-2 py-1">{project.acreage}</td>
                <td className="px-2 py-1">{project.yieldAcre}</td>
                <td className="px-2 py-1">{project.marketPrice}</td>
                <td className="px-2 py-1">{project.costAcre}</td>
                <td className="px-2 py-1">{project.estIncome}</td>
                <td className="px-2 py-1">{project.estCost}</td>
                <td className="px-2 py-1">{project.status}</td>
                <td className="px-2 py-1">{project.startDate}</td>
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

export default Projects;