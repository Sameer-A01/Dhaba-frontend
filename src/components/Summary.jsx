import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/api";
import { useNavigate } from "react-router-dom";
import { 
  FiAlertTriangle, 
  FiTrendingUp, 
  FiPackage, 
  FiShoppingCart, 
  FiCreditCard,
  FiBox,
  FiDatabase,
  FiAward,
  FiRefreshCw,
  FiDollarSign,
  FiCalendar,
  FiPieChart,
  FiBarChart,
  FiTrendingDown
} from "react-icons/fi";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const Summary = () => {
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalStock: 0,
    ordersToday: 0,
    revenue: 0,
    outOfStock: [],
    highestSaleProduct: null,
    lowStock: [],
    expenses: {
      today: 0,
      thisMonth: 0,
      byCategory: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  // Color palette for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  // Format currency in Indian Rupees with proper symbol
  const formatRupee = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', '₹ ');
  };

  // Function to refresh dashboard data
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Calculate profit/loss
  const calculateProfitLoss = () => {
    const profit = dashboardData.revenue - dashboardData.expenses.today;
    return profit;
  };

  // Mock data for trend charts (you can replace this with real historical data)
  const revenueData = [
    { day: 'Mon', revenue: dashboardData.revenue * 0.8, expenses: dashboardData.expenses.today * 0.9 },
    { day: 'Tue', revenue: dashboardData.revenue * 0.9, expenses: dashboardData.expenses.today * 0.8 },
    { day: 'Wed', revenue: dashboardData.revenue * 1.1, expenses: dashboardData.expenses.today * 1.1 },
    { day: 'Thu', revenue: dashboardData.revenue * 0.7, expenses: dashboardData.expenses.today * 0.6 },
    { day: 'Fri', revenue: dashboardData.revenue * 1.3, expenses: dashboardData.expenses.today * 1.2 },
    { day: 'Sat', revenue: dashboardData.revenue * 1.5, expenses: dashboardData.expenses.today * 0.9 },
    { day: 'Today', revenue: dashboardData.revenue, expenses: dashboardData.expenses.today }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        });
        setDashboardData(response.data);
      } catch (err) {
        if(!err.response?.data?.success) {
          navigate('/login');
        }
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [refreshKey, navigate]);

  if(loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading Dashboard...</p>
      </div>
    </div>
  );

  const profitLoss = calculateProfitLoss();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
    {/* Header */}
    <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-2xl shadow-lg border-2 border-amber-200/50 p-6 mb-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-4 left-8 text-6xl">👑</div>
        <div className="absolute top-6 right-12 text-4xl">🏰</div>
        <div className="absolute bottom-4 left-1/4 text-3xl">✨</div>
        <div className="absolute bottom-6 right-1/3 text-5xl">👑</div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div className="flex-1">
          {/* Restaurant Name with Royal Styling */}
          <div className="mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl md:text-4xl animate-pulse">👑</div>
              <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 bg-clip-text text-transparent drop-shadow-sm">
                Royal King
              </h1>
            </div>
            <div className="flex items-center gap-2 ml-12 md:ml-16">
              <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-red-700 bg-clip-text text-transparent">
                Dhaba
              </h2>
              <div className="flex gap-1">
                <span className="text-amber-500 text-lg">⭐</span>
                <span className="text-amber-500 text-lg">⭐</span>
                <span className="text-amber-500 text-lg">⭐</span>
                <span className="text-amber-500 text-lg">⭐</span>
                <span className="text-amber-500 text-lg">⭐</span>
              </div>
            </div>
          </div>
          
          {/* Tagline */}
          <div className="ml-12 md:ml-16">
            <p className="text-gray-700 text-lg md:text-xl font-medium italic">
              "Where Royal Flavors Meet Authentic Taste"
            </p>
            <p className="text-gray-600 mt-1 text-base">Real-time business insights and analytics</p>
            <p className="relative z-10 text-[#000000] text-sm font-['Lora'] mt-4">  Designed and developed by <a href="https://webaziz.in" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition duration-200">webaziz.in</a></p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700 bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-3 rounded-xl shadow-md border-2 border-amber-200">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-amber-600" />
              <span className="font-semibold">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
          <button 
            onClick={refreshDashboard}
            className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 rounded-xl shadow-md border-2 border-amber-300 hover:border-amber-400 transition-all duration-300 group transform hover:scale-105"
            title="Refresh dashboard"
          >
            <FiRefreshCw className="text-amber-700 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>
      
      {/* Royal Border Design */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
    </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Total Menu</p>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{dashboardData.totalProducts}</h3>
              <p className="text-xs text-gray-500">Active items</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              <FiPackage size={24} />
            </div>
          </div>
        </div>
        
        {/* Total Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Stock</p>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{dashboardData.totalStock.toLocaleString()}</h3>
              <p className="text-xs text-gray-500">Units available</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
              <FiDatabase size={24} />
            </div>
          </div>
        </div>
        
        {/* Orders Today */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Orders</p>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{dashboardData.ordersToday}</h3>
              <p className="text-xs text-gray-500">Today's count</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 group-hover:scale-110 transition-transform duration-300">
              <FiShoppingCart size={24} />
            </div>
          </div>
        </div>
        
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Revenue</p>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">{formatRupee(dashboardData.revenue)}</h3>
              <p className="text-xs text-gray-500">Today's total</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <FiCreditCard size={24} />
            </div>
          </div>
        </div>

        {/* Profit/Loss */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Profit/Loss</p>
              <h3 className={`text-2xl font-bold mb-1 ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatRupee(Math.abs(profitLoss))}
              </h3>
              <p className="text-xs text-gray-500">Updated {profitLoss >= 0 ? 'profit' : 'loss'}</p>
            </div>
            <div className={`p-4 rounded-xl ${profitLoss >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600' : 'bg-gradient-to-br from-red-50 to-red-100 text-red-600'} group-hover:scale-110 transition-transform duration-300`}>
              {profitLoss >= 0 ? <FiTrendingUp size={24} /> : <FiTrendingDown size={24} />}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue vs Expenses Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Revenue vs Expenses</h3>
              <p className="text-sm text-gray-500">Weekly comparison</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
              <FiBarChart size={20} />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => formatRupee(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Expense Categories</h3>
              <p className="text-sm text-gray-500">This month's breakdown</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600">
              <FiPieChart size={20} />
            </div>
          </div>
          {dashboardData.expenses.byCategory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.expenses.byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="category"
                  >
                    {dashboardData.expenses.byCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => formatRupee(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full mb-4">
                  <FiPieChart size={32} />
                </div>
                <p className="text-gray-500 text-lg font-medium">No expense data</p>
                <p className="text-gray-400 text-sm mt-1">Start tracking expenses to see insights</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 mb-2 uppercase tracking-wide">Today's Expenses</p>
              <h3 className="text-3xl font-bold text-red-800">{formatRupee(dashboardData.expenses.today)}</h3>
            </div>
            <div className="p-4 rounded-xl bg-red-200 text-red-700">
              <FiDollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-2 uppercase tracking-wide">Monthly Expenses</p>
              <h3 className="text-3xl font-bold text-orange-800">{formatRupee(dashboardData.expenses.thisMonth)}</h3>
            </div>
            <div className="p-4 rounded-xl bg-orange-200 text-orange-700">
              <FiCalendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">Expense Categories</p>
              <h3 className="text-3xl font-bold text-blue-800">{dashboardData.expenses.byCategory.length}</h3>
            </div>
            <div className="p-4 rounded-xl bg-blue-200 text-blue-700">
              <FiPieChart size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Out of Stock Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Out of Stock</h3>
              <p className="text-sm text-gray-500">Critical inventory alerts</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100 text-red-600">
              <FiAlertTriangle size={20} />
            </div>
          </div>
          
          {dashboardData.outOfStock.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.outOfStock.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mr-4 flex items-center justify-center">
                      <FiBox className="text-gray-600" size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category?.name || 'General'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">Empty</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full mb-4">
                <FiAward size={32} />
              </div>
              <p className="text-gray-700 text-lg font-semibold">Perfect Stock Levels</p>
              <p className="text-gray-500 text-sm mt-1">All items are adequately stocked</p>
            </div>
          )}
        </div>

        {/* Top Performing Product */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Top Performer</h3>
              <p className="text-sm text-gray-500">Best selling item</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
              <FiTrendingUp size={20} />
            </div>
          </div>
          
          {dashboardData.highestSaleProduct?.name ? (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl mr-4 flex items-center justify-center border-2 border-blue-200">
                  <FiPackage className="text-blue-600" size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{dashboardData.highestSaleProduct.name}</h4>
                  <p className="text-sm text-gray-500">{dashboardData.highestSaleProduct.category || 'General'}</p>
                  <p className="text-sm font-semibold text-blue-600 mt-1">{dashboardData.highestSaleProduct.totalQuantity} units sold</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center mb-3">
                  {/* <span className="text-sm font-medium text-gray-700">Performance</span> */}
                  {/* <span className="text-sm font-bold text-blue-600">
                    {dashboardData.ordersToday > 0 ? 
                      Math.round((dashboardData.highestSaleProduct.totalQuantity / dashboardData.ordersToday) * 100) : 0}%
                  </span> */}
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000" 
                    style={{ 
                      width: `${Math.min(100, dashboardData.ordersToday > 0 ? 
                        (dashboardData.highestSaleProduct.totalQuantity / dashboardData.ordersToday) * 100 : 0)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full mb-4">
                <FiTrendingUp size={32} />
              </div>
              <p className="text-gray-700 text-lg font-semibold">No Sales Data</p>
              <p className="text-gray-500 text-sm mt-1">Sales analytics will appear here</p>
            </div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Low Stock Alert</h3>
              <p className="text-sm text-gray-500">Items need restocking</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600">
              <FiAlertTriangle size={20} />
            </div>
          </div>
          
          {dashboardData.lowStock.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.lowStock.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mr-4 flex items-center justify-center">
                      <FiBox className="text-gray-600" size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category?.name || 'General'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full mb-2 block ${
                      product.stock < 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {product.stock} left
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          product.stock < 3 ? 'bg-red-500' : 'bg-amber-500'
                        }`} 
                        style={{ width: `${Math.min(100, (product.stock / 10) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full mb-4">
                <FiAward size={32} />
              </div>
              <p className="text-gray-700 text-lg font-semibold">Healthy Stock Levels</p>
              <p className="text-gray-500 text-sm mt-1">All items are well stocked</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;