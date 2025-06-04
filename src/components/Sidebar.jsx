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
  FaBoxOpen,
  FaTable,
} from 'react-icons/fa';
import { MdTableRestaurant } from 'react-icons/md';

const Sidebar = () => {
  const [itemsToRender, setItemsToRender] = useState([]);

  const adminMenuItems = [
    { name: 'Dashboard', path: '/', icon: <FaHome /> },

    // 🧑‍🍳 Kitchen Management
    { name: 'Menu', path: '/admin-dashboard/products', icon: <FaUtensils /> },
    { name: 'Categories', path: '/admin-dashboard/categories', icon: <FaListAlt /> },
    { name: 'Chef', path: '/admin-dashboard/supplier', icon: <FaUserTie /> },

    // 📦 Stock & Orders
    { name: 'Orders', path: '/admin-dashboard/orders', icon: <FaShoppingCart /> },
    { name: 'Inventory', path: '/admin-dashboard/Inventory', icon: <FaWarehouse /> },
    { name: 'Suppliers', path: '/admin-dashboard/InventorySupplier', icon: <FaTruckLoading /> },

    // 👥 Team & Users
    { name: 'Staff', path: '/admin-dashboard/Staff', icon: <FaUserFriends /> },
    { name: 'Users', path: '/admin-dashboard/users', icon: <FaUsers /> },

    // 💸 Finances
    { name: 'Expenses', path: '/admin-dashboard/Expense', icon: <FaMoneyBillWave /> },
    { name: 'Tables', path: '/admin-dashboard/Table', icon: <MdTableRestaurant /> },

    // ⚙️ Others
    { name: 'Profile', path: '/admin-dashboard/profile', icon: <FaCog /> },
    { name: 'Logout', path: '/logout', icon: <FaSignOutAlt /> },
  ];

  const userMenuItems = [
    { name: 'POS', path: '/employee-dashboard', icon: <FaCashRegister />, isParent: true },  // exact match
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
    <div className="fixed h-screen bg-[#2e2e2e] text-white w-16 md:w-64 flex flex-col shadow-lg">
     <div className="h-16 flex items-center justify-center md:justify-start md:px-4 overflow-hidden">
  <span className="text-xl md:text-2xl font-bold tracking-wide text-yellow-400 truncate">
    🍛 <span className="hidden md:inline">Royal King Dhaba</span>
    <span className="inline md:hidden">RKD</span>
  </span>
</div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2 text-sm">
          {itemsToRender.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                end={item.isParent}  // only use 'end' if it's a parent route needing exact match
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition duration-150 ${
                    isActive ? 'bg-yellow-600 text-black font-semibold' : 'hover:bg-gray-700'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="ml-4 hidden md:block">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
