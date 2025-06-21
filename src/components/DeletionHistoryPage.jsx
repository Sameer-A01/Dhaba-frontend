import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiPackage, FiDollarSign, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRupee } from './Orders'; // Import formatRupee from Orders

const DeletionHistoryPage = () => {
  const [deletionHistory, setDeletionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'deletionInfo.deletedAt', direction: 'desc' });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch deleted orders
  const fetchDeletedOrders = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/order/deleted/${user.userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
      });
      if (response.data.success) {
        setDeletionHistory(response.data.orders || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch deleted orders');
      }
    } catch (err) {
      console.error('Error fetching deleted orders:', err);
      if (retryCount < 3) {
        setTimeout(() => fetchDeletedOrders(retryCount + 1), 2000);
      } else {
        toast.error('Failed to fetch deleted orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedOrders();
  }, [user.userId]);

  // Sorting logic
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = React.useMemo(() => {
    let sortableOrders = [...deletionHistory];
    if (sortConfig.key) {
      sortableOrders.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key] || '', a);
          bValue = keys.reduce((obj, key) => obj?.[key] || '', b);
        } else {
          aValue = a[sortConfig.key] || '';
          bValue = b[sortConfig.key] || '';
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableOrders;
  }, [deletionHistory, sortConfig]);

  // Filtering logic
  const filteredOrders = sortedOrders.filter((order) => {
    const searchContent = `
      ${order._id || ''} 
      ${order.deletionInfo?.deletedBy?.name || ''} 
      ${order.deletionInfo?.reason || ''} 
      ${order.deletionInfo?.deletedAt ? new Date(order.deletionInfo.deletedAt).toLocaleString() : ''}
    `.toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });

  // Calculate total deleted order value
  const totalDeletedValue = deletionHistory.reduce((total, order) => total + (order.totalAmount || 0), 0);

  // Deleted Order Card for mobile view
  const DeletedOrderCard = ({ order }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-800">#{order._id?.slice(-6).toUpperCase() || 'N/A'}</h4>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-gray-500">Deleted Date</p>
          <p className="font-medium">
            {order.deletionInfo?.deletedAt
              ? new Date(order.deletionInfo.deletedAt).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Total</p>
          <p className="font-medium text-green-600">{formatRupee(order.totalAmount || 0)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Deleted By</p>
          <p className="font-medium">{order.deletionInfo?.deletedBy?.name || 'Unknown'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Reason</p>
          <p className="font-medium">{order.deletionInfo?.reason || 'No reason provided'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="flex flex-col mb-6 gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Deletion History</h1>
            <p className="text-gray-600 text-sm">View all deleted orders</p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Back to Orders"
            aria-label="Back to Orders"
          >
            <FiArrowLeft size={18} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search deleted orders..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search deleted orders"
            />
          </div>
          <div className="relative sm:w-auto">
            <button
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center w-full"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              aria-label="Open sort menu"
            >
              <FiFilter className="mr-2" />
              <span>Sort</span>
              {isFilterMenuOpen ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
            </button>
            {isFilterMenuOpen && (
              <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20 border border-gray-100">
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => {
                    requestSort('deletionInfo.deletedAt');
                    setIsFilterMenuOpen(false);
                  }}
                >
                  Date {sortConfig.key === 'deletionInfo.deletedAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => {
                    requestSort('_id');
                    setIsFilterMenuOpen(false);
                  }}
                >
                  Order ID {sortConfig.key === '_id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => {
                    requestSort('deletionInfo.deletedBy.name');
                    setIsFilterMenuOpen(false);
                  }}
                >
                  Deleted By{' '}
                  {sortConfig.key === 'deletionInfo.deletedBy.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deleted Orders</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{deletionHistory.length}</h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <FiPackage size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deleted Value</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{formatRupee(totalDeletedValue)}</h3>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <FiDollarSign size={18} />
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => <DeletedOrderCard key={order._id} order={order} />)
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">No deleted orders found</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="mt-2 text-blue-600 text-sm hover:underline">
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('_id')}
                >
                  <div className="flex items-center">
                    Order ID
                    {sortConfig.key === '_id' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('deletionInfo.deletedBy.name')}
                >
                  <div className="flex items-center">
                    Deleted By
                    {sortConfig.key === 'deletionInfo.deletedBy.name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('deletionInfo.deletedAt')}
                >
                  <div className="flex items-center">
                    Deleted Date
                    {sortConfig.key === 'deletionInfo.deletedAt' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Reason
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order._id?.slice(-6).toUpperCase() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.deletionInfo?.deletedBy?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.deletionInfo?.deletedAt
                        ? new Date(order.deletionInfo.deletedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.deletionInfo?.reason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatRupee(order.totalAmount || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    <p>No deleted orders found</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-blue-600 text-sm hover:underline"
                      >
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeletionHistoryPage;