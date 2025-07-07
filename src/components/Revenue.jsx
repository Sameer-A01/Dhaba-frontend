import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/api';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement, Filler } from 'chart.js';
import { TrendingUp, TrendingDown, DollarSign, Receipt, CreditCard, Calendar, Download, RefreshCw, Filter, Eye, Target, PieChart, BarChart3, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement, Filler);

const Revenue = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [totalData, setTotalData] = useState({ totalRevenue: 0, totalTax: 0, totalOrders: 0 });
  const [dailyData, setDailyData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [discountData, setDiscountData] = useState({ totalDiscount: 0, discountCount: 0 });
  const [taxData, setTaxData] = useState({ totalTax: 0, orderCount: 0 });
  const [taxByPaymentMethod, setTaxByPaymentMethod] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [chartType, setChartType] = useState('bar');
  const [showFilters, setShowFilters] = useState(false);

  const paymentMethods = ['cash', 'card', 'upi', 'wallet'];

  // Your original API integration
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = new Date(startDate).toISOString().split('T')[0];
        params.endDate = new Date(endDate).toISOString().split('T')[0];
      }
      if (paymentMethod) {
        params.paymentMethod = paymentMethod;
      }

      // Fetch total revenue
      const totalResponse = await axiosInstance.get('/revenue/total', { params });
      setTotalData(totalResponse.data);

      // Fetch daily revenue
      const dailyResponse = await axiosInstance.get('/revenue/daily', { params });
      setDailyData(dailyResponse.data);

      // Fetch revenue by payment method
      const paymentMethodResponse = await axiosInstance.get('/revenue/payment-method', { params });
      setPaymentMethodData(paymentMethodResponse.data);

      // Fetch total discounts
      const discountResponse = await axiosInstance.get('/revenue/discounts', { params });
      setDiscountData(discountResponse.data);

      // Fetch total taxes
      const taxResponse = await axiosInstance.get('/revenue/taxes', { params });
      setTaxData(taxResponse.data);

      // Fetch taxes by payment method
      const taxByPaymentMethodResponse = await axiosInstance.get('/revenue/taxes/payment-method', { params });
      setTaxByPaymentMethod(taxByPaymentMethodResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, paymentMethod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (type) => {
    const data = {
      totalData,
      dailyData,
      paymentMethodData,
      taxByPaymentMethod,
      discountData,
      taxData,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateGrowth = useMemo(() => {
    if (dailyData.length < 2) return 0;
    const latest = dailyData[dailyData.length - 1]?.dailyRevenue || 0;
    const previous = dailyData[dailyData.length - 2]?.dailyRevenue || 0;
    return previous > 0 ? ((latest - previous) / previous * 100) : 0;
  }, [dailyData]);

  const averageOrderValue = useMemo(() => {
    return totalData.totalOrders > 0 ? totalData.totalRevenue / totalData.totalOrders : 0;
  }, [totalData]);

  // Enhanced chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          font: { size: 12, weight: 'bold' },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 }
        }
      }
    }
  };

  const dailyChartData = {
    labels: dailyData.map(item => new Date(item._id).toLocaleDateString()),
    datasets: [
      {
        label: 'Daily Revenue (₹)',
        data: dailyData.map(item => item.dailyRevenue),
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'Daily Tax (₹)',
        data: dailyData.map(item => item.dailyTax),
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const paymentMethodChartData = {
    labels: paymentMethodData.map(item => item._id.toUpperCase()),
    datasets: [{
      data: paymentMethodData.map(item => item.totalRevenue),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2,
      hoverOffset: 10
    }]
  };

  const StatCard = ({ title, value, icon: Icon, growth, color = 'blue' }) => (
    <div className={`bg-white p-6 rounded-2xl shadow-lg border-l-4 border-${color}-500 transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          {growth !== undefined && (
            <div className="flex items-center mt-2">
              {growth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(growth).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
                <p className="text-sm text-gray-500">Professional Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              
              <button
                onClick={fetchData}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              <button
                onClick={() => handleExport('json')}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200 transform animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filters & Controls</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Methods</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-lg font-medium text-gray-700">Loading analytics...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${totalData.totalRevenue?.toLocaleString()}`}
            icon={DollarSign}
            growth={calculateGrowth}
            color="blue"
          />
          <StatCard
            title="Total Orders"
            value={totalData.totalOrders?.toLocaleString()}
            icon={Receipt}
            color="green"
          />
          <StatCard
            title="Total Tax"
            value={`₹${totalData.totalTax?.toLocaleString()}`}
            icon={Target}
            color="yellow"
          />
          <StatCard
            title="Avg. Order Value"
            value={`₹${averageOrderValue?.toFixed(0)}`}
            icon={CreditCard}
            color="purple"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Analytics</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">₹{discountData.totalDiscount?.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Discounts Given</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Efficiency</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {((totalData.totalTax / totalData.totalRevenue) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Tax Rate</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <PieChart className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Daily Trends */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Daily Revenue Trends</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <Line data={dailyChartData} options={chartOptions} />
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Payment Method Distribution</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <Doughnut 
                data={paymentMethodChartData} 
                options={{
                  ...chartOptions,
                  cutout: '60%',
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Payment Method Revenue Bar */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Payment Method</h3>
            <div className="h-80">
              <Bar 
                data={{
                  labels: paymentMethodData.map(item => item._id.toUpperCase()),
                  datasets: [{
                    label: 'Revenue (₹)',
                    data: paymentMethodData.map(item => item.totalRevenue),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                  }]
                }}
                options={chartOptions}
              />
            </div>
          </div>

          {/* Tax Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tax Distribution</h3>
            <div className="h-80">
              <Pie 
                data={{
                  labels: taxByPaymentMethod.map(item => item._id.toUpperCase()),
                  datasets: [{
                    data: taxByPaymentMethod.map(item => item.totalTax),
                    backgroundColor: [
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(139, 92, 246, 0.8)'
                    ],
                    borderColor: [
                      'rgba(16, 185, 129, 1)',
                      'rgba(245, 158, 11, 1)',
                      'rgba(239, 68, 68, 1)',
                      'rgba(139, 92, 246, 1)'
                    ],
                    borderWidth: 2
                  }]
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Order</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyData.map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(day._id).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{day.dailyRevenue?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{day.dailyTax?.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.orderCount || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{day.orderCount > 0 ? (day.dailyRevenue / day.orderCount).toFixed(0) : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;