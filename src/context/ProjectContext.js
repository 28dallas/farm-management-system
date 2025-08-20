import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [projects, setProjects] = useState([]);
  const [projectData, setProjectData] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects(['Project A', 'Project B', 'Project C']);
    }
  };

  const getProjectData = (projectName) => {
    return projectData[projectName] || {};
  };

  const updateProjectData = (projectName, data) => {
    setProjectData(prev => ({
      ...prev,
      [projectName]: data
    }));
  };

  const getProjectSummary = (projectName) => {
    if (projectName === 'All Projects') {
      return getAllProjectsSummary();
    }
    
    const data = getProjectData(projectName);
    return {
      totalIncome: data.totalIncome || 0,
      totalExpenses: data.totalExpenses || 0,
      totalProfit: (data.totalIncome || 0) - (data.totalExpenses || 0),
      totalCrops: data.totalCrops || 0,
      totalAcreage: data.totalAcreage || 0,
      totalYield: data.totalYield || 0
    };
  };

  const getAllProjectsSummary = () => {
    let summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalProfit: 0,
      totalCrops: 0,
      totalAcreage: 0,
      totalYield: 0
    };

    Object.keys(projectData).forEach(project => {
      const data = projectData[project];
      summary.totalIncome += data.totalIncome || 0;
      summary.totalExpenses += data.totalExpenses || 0;
      summary.totalProfit += (data.totalIncome || 0) - (data.totalExpenses || 0);
      summary.totalCrops += data.totalCrops || 0;
      summary.totalAcreage += data.totalAcreage || 0;
      summary.totalYield += data.totalYield || 0;
    });

    return summary;
  };

  return (
    <ProjectContext.Provider value={{
      selectedProject,
      setSelectedProject,
      projects,
      getProjectData,
      setProjectData,
      getProjectSummary,
      getAllProjectsSummary
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
