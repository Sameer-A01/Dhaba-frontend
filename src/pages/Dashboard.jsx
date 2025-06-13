import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Default collapsed

  useEffect(() => {
    const storedState = localStorage.getItem('sidebar_collapsed');
    if (storedState !== null) {
      setIsCollapsed(storedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      localStorage.setItem('sidebar_collapsed', !prev);
      return !prev;
    });
  };

  return (
    <div className="flex">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        } bg-gray-100 h-screen`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
