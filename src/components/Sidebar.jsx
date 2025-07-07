import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaUtensils,
  FaListAlt,
  FaShoppingCart,
  FaUserTie,
  FaWarehouse,
  FaTruckLoading,
  FaUserFriends,
  FaMoneyBillWave,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaCashRegister,
  FaTable,
  FaBars,
} from 'react-icons/fa';
import { MdTableRestaurant } from 'react-icons/md';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const [itemsToRender, setItemsToRender] = useState([]);

  const adminMenuItems = [
    { name: 'Dashboard', path: '/', icon: <FaHome /> },
    { name: 'Menu', path: '/admin-dashboard/products', icon: <FaUtensils /> },
    { name: 'Categories', path: '/admin-dashboard/categories', icon: <FaListAlt /> },
    { name: 'Chef', path: '/admin-dashboard/supplier', icon: <FaUserTie /> },
    { name: 'Orders', path: '/admin-dashboard/orders', icon: <FaShoppingCart /> },
    { name: 'Inventory', path: '/admin-dashboard/Inventory', icon: <FaWarehouse /> },
    { name: 'Suppliers', path: '/admin-dashboard/InventorySupplier', icon: <FaTruckLoading /> },
    { name: 'Staff', path: '/admin-dashboard/Staff', icon: <FaUserFriends /> },
    { name: 'Users', path: '/admin-dashboard/users', icon: <FaUsers /> },
    { name: 'Expenses', path: '/admin-dashboard/Expense', icon: <FaMoneyBillWave /> },
    { name: 'Revenue', path: '/admin-dashboard/Revenue', icon: <FaMoneyBillWave /> },
    { name: 'Tables', path: '/admin-dashboard/Table', icon: <MdTableRestaurant /> },
    { name: 'Profile', path: '/admin-dashboard/profile', icon: <FaCog /> },
    { name: 'Logout', path: '/logout', icon: <FaSignOutAlt /> },
  ];

  const userMenuItems = [
    { name: 'POS', path: '/employee-dashboard', icon: <FaCashRegister />, isParent: true },
    { name: 'My Orders', path: '/employee-dashboard/orders', icon: <FaShoppingCart />, isParent: false },
    { name: 'Menu', path: '/admin-dashboard/products', icon: <FaUtensils />, isParent: false },
    { name: 'Categories', path: '/admin-dashboard/categories', icon: <FaTable />, isParent: false },
    { name: 'Tables', path: '/admin-dashboard/Table', icon: <MdTableRestaurant /> },
    { name: 'Chef', path: '/admin-dashboard/supplier', icon: <FaUserTie />, isParent: false },
    { name: 'Logout', path: '/logout', icon: <FaSignOutAlt />, isParent: true },
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('ims_user'));
    setItemsToRender(user?.role === 'admin' ? adminMenuItems : userMenuItems);
  }, []);

  return (
    <div className={`fixed h-screen bg-[#2e2e2e] text-white ${isCollapsed ? 'w-16' : 'w-64'} flex flex-col shadow-lg transition-all duration-300`}>
      <div className="h-16 flex items-center justify-between px-2 md:px-4">
        <span className="text-xl font-bold text-yellow-400 truncate">
          🍛 {!isCollapsed && <span className="ml-1">Royal King Dhaba</span>}
        </span>
        <button onClick={toggleSidebar} className="text-white focus:outline-none">
          <FaBars />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2 text-sm">
          {itemsToRender.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                end={item.isParent}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition duration-150 ${
                    isActive ? 'bg-yellow-600 text-black font-semibold' : 'hover:bg-gray-700'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span className="ml-4">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
