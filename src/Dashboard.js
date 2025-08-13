import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Filters from './components/Filters';
import Actions from './components/Actions';
import SummaryCards from './components/SummaryCards';
import Charts from './components/Charts';
import Projects from './components/Projects';
import Crops from './components/Crops';
import Income from './components/Income';
import Inventory from './components/Inventory';
import ExpensesReport from './components/ExpensesReport';

import Reports from './components/Reports';
import Settings from './components/Settings';
import FinanceTab from './components/FinanceTab';
import LoadingSpinner from './components/LoadingSpinner';
import { useSidebar } from './context/SidebarContext';
import apiService from './services/api';

const Dashboard = ({ user, onLogout }) => {
  const { isOpen, toggleSidebar, currentView, isCollapsed, setIsCollapsed } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    project: 'All Projects',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiService.healthCheck();
        setError(null);
      } catch (err) {
        console.error('Health check failed:', err);
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);

  const handleMainClick = () => {
    if (!isCollapsed) {
      setIsCollapsed(true);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} onLogout={onLogout} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6" onClick={handleMainClick}>
          {loading && <LoadingSpinner text="Loading dashboard..." />}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
          {!loading && !error && (
            <>
              {currentView === 'Dashboard' && (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <Filters onFilterChange={setFilters} />
                    <Actions />
                  </div>
                  <SummaryCards filters={filters} />
                  <Charts filters={filters} />
                  <div className="mt-8">
                    <Projects filters={filters} />
                  </div>
                </>
              )}
              {currentView === 'Projects' && <Projects />}
              {currentView === 'Crops' && <Crops />}
              {currentView === 'Income' && <Income />}
              {currentView === 'Inventory' && <Inventory />}
              {currentView === 'Expenses' && <ExpensesReport />}
              {currentView === 'Finance' && <FinanceTab />}
              {currentView === 'Reports' && <Reports />}
              {currentView === 'Settings' && <Settings />}
              {!['Dashboard', 'Projects', 'Crops', 'Income', 'Inventory', 'Expenses', 'Finance', 'Reports', 'Settings'].includes(currentView) && (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">{currentView}</h2>
                  <p className="text-gray-600">This section is coming soon...</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;