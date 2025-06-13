import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  FiPackage, FiUser, FiMapPin, FiCalendar, FiDollarSign, 
  FiFilter, FiSearch, FiChevronDown, FiChevronUp, 
  FiPrinter, FiTrendingUp, FiList, FiClock, 
  FiCheckCircle, FiXCircle, FiRefreshCw 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify'; // Assuming you have react-toastify for notifications

// Helper functions (unchanged from original)
const calculateTodaySales = (orders) => {
  const today = new Date().toISOString().split('T')[0];
  return orders.reduce((total, order) => {
    const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
    if (orderDate === today) {
      return total + order.products.reduce((orderTotal, item) => {
        return orderTotal + (item.price * item.quantity);
      }, 0);
    }
    return total;
  }, 0);
};

const calculatePercentageChange = (orders) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todaySales = calculateTodaySales(orders);
  const yesterdaySales = calculateDateSales(orders, yesterday.toISOString().split('T')[0]);
  
  if (yesterdaySales === 0) return '∞';
  return Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
};

const calculateDateSales = (orders, dateString) => {
  return orders.reduce((total, order) => {
    const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
    if (orderDate === dateString) {
      return total + order.products.reduce((orderTotal, item) => {
        return orderTotal + (item.price * item.quantity);
      }, 0);
    }
    return total;
  }, 0);
};

const formatRupee = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('₹', '₹ ');
};

const getKOTStatusBadge = (status) => {
  switch (status) {
    case 'preparing':
      return { color: 'bg-yellow-100 text-yellow-800', icon: <FiClock className="mr-1" /> };
    case 'ready':
      return { color: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="mr-1" /> };
    case 'closed':
      return { color: 'bg-gray-100 text-gray-800', icon: <FiXCircle className="mr-1" /> };
    default:
      return { color: 'bg-blue-100 text-blue-800', icon: <FiList className="mr-1" /> };
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'orderDate', direction: 'desc' });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const { user } = useAuth();
  const [error, setError] = useState(null);

  const fetchOrders = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/order/${user.userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
      });
      if (response.data.success) {
        setOrders(response.data.orders || []);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (retryCount < 3) {
        setTimeout(() => fetchOrders(retryCount + 1), 2000); // Retry after 2 seconds
      } else {
        setError('Failed to fetch orders after multiple attempts. Please try again later.');
        toast.error('Failed to fetch orders. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [user.userId]);

  const refreshOrders = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = React.useMemo(() => {
    let sortableOrders = [...orders];
    if (sortConfig.key) {
      sortableOrders.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key] || '', a);
          bValue = keys.reduce((obj, key) => obj?.[key] || '', b);
        } else if (sortConfig.key === 'kots.length') {
          aValue = (a.kots || []).length;
          bValue = (b.kots || []).length;
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
  }, [orders, sortConfig]);

  const filteredOrders = sortedOrders.filter(order => {
    const searchContent = `${order.user?.name || ''} ${order.user?.address || ''} ${
      order.products?.map(p => p.product?.name || '').join(' ')
    } ${order.orderDate || ''} ${
      order.kots?.map(k => k.kotNumber || '').join(' ')
    }`.toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });

  const totalOrderValue = orders.reduce((total, order) => {
    return total + (order.products?.reduce((orderTotal, item) => {
      return orderTotal + ((item.price || 0) * (item.quantity || 0));
    }, 0) || 0);
  }, 0);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const printOrder = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order._id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; margin-top: 20px; }
            .kot-section { margin-top: 30px; border-top: 1px dashed #333; padding-top: 15px; }
            .kot-header { font-weight: bold; margin-bottom: 5px; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Order Receipt</h1>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
          ${user.role === 'admin' ? `<p><strong>Customer:</strong> ${order.user?.name || 'N/A'}</p>` : ''}
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.products?.map(item => `
                <tr>
                  <td>${item.product?.name || 'N/A'}</td>
                  <td>${item.product?.category?.name || 'N/A'}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${formatRupee(item.price || 0)}</td>
                  <td>${formatRupee((item.price || 0) * (item.quantity || 0))}</td>
                </tr>
              `).join('') || '<tr><td colspan="5">No products</td></tr>'}
            </tbody>
          </table>
          
          <div class="total">
            <p>Order Total: ${formatRupee(order.products?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0)}</p>
          </div>

          ${order.kots && order.kots.length > 0 ? `
            <div class="kot-section">
              <h2>KOT Details</h2>
              ${order.kots.map(kot => {
                const statusBadge = getKOTStatusBadge(kot.status);
                return `
                  <div class="kot-details" style="margin-bottom: 15px;">
                    <div class="kot-header">
                      <span style="font-weight: bold;">${kot.kotNumber || 'N/A'}</span>
                      <span class="status-badge ${statusBadge.color}">
                        ${statusBadge.icon}
                        ${kot.status || 'Unknown'}
                      </span>
                    </div>
                    <p><strong>Created:</strong> ${new Date(kot.createdAt).toLocaleString()}</p>
                    <table style="margin-top: 5px;">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${kot.orderItems?.map(item => `
                          <tr>
                            <td>${item.product?.name || 'N/A'}</td>
                            <td>${item.quantity || 0}</td>
                            <td>${formatRupee(item.product?.price || 0)}</td>
                          </tr>
                        `).join('') || '<tr><td colspan="3">No items</td></tr>'}
                      </tbody>
                    </table>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<p>No KOTs associated</p>'}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Mobile Card View for Orders
  const OrderCard = ({ order }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-800">#{order._id.slice(-6).toUpperCase()}</h4>
          <div className="flex space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                printOrder(order);
              }}
              className="text-blue-600 hover:text-blue-800 p-1"
            >
              <FiPrinter size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleOrderExpansion(order._id);
              }}
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              {expandedOrder === order._id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
          
          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-medium text-green-600">
              {formatRupee(order.products?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0)}
            </p>
          </div>
          
          {user.role === 'admin' && (
            <>
              <div className="col-span-2">
                <p className="text-gray-500">Cashier</p>
                <p className="font-medium">{order.user?.name || 'N/A'}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{order.user?.address || 'N/A'}</p>
              </div>
            </>
          )}
          
          <div>
            <p className="text-gray-500">Items</p>
            <p className="font-medium">{order.products?.length || 0} item{(order.products?.length || 0) !== 1 ? 's' : ''}</p>
          </div>

          <div>
            <p className="text-gray-500">KOTs</p>
            <p className="font-medium">{order.kots?.length || 0} KOT{(order.kots?.length || 0) !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <AnimatePresence>
          {expandedOrder === order._id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-100 pt-3"
            >
              <h5 className="font-medium text-gray-800 mb-2">Order Details</h5>
              <div className="space-y-3">
                {order.products?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <p className="font-medium text-gray-800">{item.product?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{item.product?.category?.name || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{item.quantity || 0} × {formatRupee(item.price || 0)}</p>
                      <p className="font-medium text-gray-800">{formatRupee((item.price || 0) * (item.quantity || 0))}</p>
                    </div>
                  </div>
                )) || <p>No products</p>}
                <div className="flex justify-between items-center pt-2">
                  <p className="font-medium text-gray-800">Order Total</p>
                  <p className="font-bold text-lg text-green-600">
                    {formatRupee(order.products?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0)}
                  </p>
                </div>
              </div>

              {order.kots && order.kots.length > 0 ? (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-800 mb-2">KOT Details</h5>
                  <div className="space-y-2">
                    {order.kots.map((kot, idx) => {
                      const statusBadge = getKOTStatusBadge(kot.status);
                      return (
                        <div key={idx} className="border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                                  {kot.kotNumber || 'N/A'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded flex items-center ${statusBadge.color}`}>
                                  {statusBadge.icon}
                                  {kot.status || 'Unknown'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(kot.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            {kot.orderItems?.map((item, i) => (
                              <div key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                                <span>{item.product?.name || 'N/A'}</span>
                                <span>{item.quantity || 0} × {formatRupee(item.product?.price || 0)}</span>
                              </div>
                            )) || <p>No items</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No KOTs associated</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
          <button 
            onClick={refreshOrders}
            className="ml-4 text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex flex-col mb-6 gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {user.role === 'admin' ? 'Order Management' : 'My Orders'}
            </h1>
            <p className="text-gray-600 text-sm">
              {user.role === 'admin' ? 'View and manage all orders with KOT details' : 'Track your order history'}
            </p>
          </div>
          <button 
            onClick={refreshOrders}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Refresh orders"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders or KOTs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative sm:w-auto">
            <button 
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center w-full"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
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
                    requestSort('orderDate');
                    setIsFilterMenuOpen(false);
                  }}
                >
                  Date {sortConfig.key === 'orderDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                {user.role === 'admin' && (
                  <button 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      requestSort('user.name');
                      setIsFilterMenuOpen(false);
                    }}
                  >
                    Cashier {sortConfig.key === 'user.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </button>
                )}
                <button 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => {
                    requestSort('kots.length');
                    setIsFilterMenuOpen(false);
                  }}
                >
                  KOT Count {sortConfig.key === 'kots.length' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{orders.length}</h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <FiPackage size={18} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Sales</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                {formatRupee(calculateTodaySales(orders))}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {calculatePercentageChange(orders) >= 0 ? '↑' : '↓'} {Math.abs(calculatePercentageChange(orders))}% from yesterday
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <FiDollarSign size={18} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                {orders.length > 0 ? formatRupee(totalOrderValue / orders.length) : formatRupee(0)}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <FiTrendingUp size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Order Cards (Shown on small screens) */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderCard key={order._id} order={order} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-500">No orders found</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Orders Table (Hidden on small screens) */}
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
                {user.role === 'admin' && (
                  <>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('user.name')}
                    >
                      <div className="flex items-center">
                        <FiUser className="mr-1" size={14} />
                        Cashier
                        {sortConfig.key === 'user.name' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FiMapPin className="mr-1" size={14} />
                        Address
                      </div>
                    </th>
                  </>
                )}
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('orderDate')}
                >
                  <div className="flex items-center">
                    <FiCalendar className="mr-1" size={14} />
                    Date
                    {sortConfig.key === 'orderDate' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KOTs
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={user.role === 'admin' ? 8 : 6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <React.Fragment key={order._id}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => toggleOrderExpansion(order._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </td>
                      {user.role === 'admin' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.user?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.user?.address ? `${order.user.address.slice(0, 20)}...` : 'N/A'}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.products?.length || 0} item{(order.products?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.kots?.length || 0} KOT{(order.kots?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatRupee(order.products?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            printOrder(order);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <FiPrinter size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderExpansion(order._id);
                          }}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          {expandedOrder === order._id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedOrder === order._id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gray-50"
                        >
                          <td colSpan={user.role === 'admin' ? 8 : 6} className="px-6 py-4">
                            <div className="bg-white rounded-lg shadow-xs p-4">
                              <h4 className="font-medium text-gray-800 mb-3">Order Details</h4>
                              <div className="space-y-3">
                                {order.products?.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <div>
                                      <p className="font-medium text-gray-800">{item.product?.name || 'N/A'}</p>
                                      <p className="text-sm text-gray-500">{item.product?.category?.name || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-600">{item.quantity || 0} × {formatRupee(item.price || 0)}</p>
                                      <p className="font-medium text-gray-800">{formatRupee((item.price || 0) * (item.quantity || 0))}</p>
                                    </div>
                                  </div>
                                )) || <p>No products</p>}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                  <p className="font-medium text-gray-800">Order Total</p>
                                  <p className="font-bold text-lg text-green-600">
                                    {formatRupee(order.products?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0)}
                                  </p>
                                </div>
                              </div>

                              {order.kots && order.kots.length > 0 ? (
                                <div className="mt-6">
                                  <h4 className="font-medium text-gray-800 mb-3">KOT Details</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {order.kots.map((kot, idx) => {
                                      const statusBadge = getKOTStatusBadge(kot.status);
                                      return (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-3">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium">{kot.kotNumber || 'N/A'}</span>
                                            <span className={`text-xs px-2 py-1 rounded flex items-center ${statusBadge.color}`}>
                                              {statusBadge.icon}
                                              {kot.status || 'Unknown'}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-600 mb-3">
                                            Created: {new Date(kot.createdAt).toLocaleString()}
                                          </div>
                                          <div className="space-y-2">
                                            {kot.orderItems?.map((item, i) => (
                                              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                                                <span className="font-medium">{item.product?.name || 'N/A'}</span>
                                                <span className="text-gray-600">
                                                  {item.quantity || 0} × {formatRupee(item.product?.price || 0)}
                                                </span>
                                              </div>
                                            )) || <p>No items</p>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-4 text-sm text-gray-500">No KOTs associated</p>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={user.role === 'admin' ? 8 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                    <p>No orders found</p>
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

      {/* Pagination for future use */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 flex justify-center sm:justify-end">
          <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
            <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              Previous
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              1
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100">
              2
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default Orders;