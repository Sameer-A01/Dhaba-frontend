import React, { useState, useEffect } from 'react';
import axiosInstance from "../utils/api";
import { toast } from 'react-toastify';
import {
  PlusCircle, Edit2, Trash2, AlertTriangle, Truck, ShoppingBag, Calendar,
  Package, Thermometer, Clock, Filter, RefreshCw, Save, X, Info, Activity, User
} from 'react-feather';

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]); // Initialized as empty array
  const [usageHistory, setUsageHistory] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Ingredient',
    quantity: 0,
    unit: 'kg',
    minStockLevel: 0,
    supplier: '',
    costPerUnit: 0,
    expiryDate: '',
    notes: '',
    reorderFrequency: 'As Needed',
    storageConditions: 'Dry',
    stockResetDate: ''
  });
  const [usageFormData, setUsageFormData] = useState({
    inventoryItem: '',
    quantityUsed: 0,
    purpose: 'Production',
    user: '',
    notes: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [showUsageHistory, setShowUsageHistory] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statsFilters, setStatsFilters] = useState({
    startDate: '',
    endDate: '',
    category: ''
  });

  const categories = [
    "Ingredient", "Beverage", "Equipment", "Cleaning",
    "Packaging", "Storage", "Other"
  ];
  const units = [
    "kg", "g", "l", "ml", "unit", "pack",
    "box", "bottle", "can", "bag", "other"
  ];
  const purposes = ["Production", "Maintenance", "Testing", "Waste", "Other"];

  const statusTags = {
    lowStock: { color: "red", label: "Low Stock" },
    expired: { color: "red", label: "Expired" },
    expiringSoon: { color: "orange", label: "Expiring Soon" },
    stockReset: { color: "purple", label: "Reset Scheduled" },
    wellStocked: { color: "green", label: "Well Stocked" },
    refrigerated: { color: "blue", label: "Refrigerated" },
    frozen: { color: "cyan", label: "Frozen" },
    dry: { color: "amber", label: "Dry" },
    ambient: { color: "teal", label: "Ambient" },
    reorderAlert: { color: "red", label: "Reorder Alert" }
  };

  useEffect(() => {
    fetchInventoryItems();
    fetchSuppliers();
    fetchUsers();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/inventory');
      setInventoryItems(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
      toast.error('Failed to fetch inventory items');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get('/supply');
      setSuppliers(response.data.supplies || response.data);
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      console.log('Users API response:', response.data); // Debug log
      // Handle different response structures
      const usersData = Array.isArray(response.data) 
        ? response.data 
        : response.data.users || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Fetch Users Error:', error);
      toast.error('Failed to fetch users');
      setUsers([]); // Ensure users remains an array
    }
  };

  const fetchUsageHistory = async (itemId) => {
    try {
      const response = await axiosInstance.get(`/inventory/usage/${itemId}`);
      setUsageHistory(response.data);
      setShowUsageHistory(itemId);
    } catch (error) {
      toast.error('Failed to fetch usage history');
    }
  };

  const fetchUsageStats = async () => {
    try {
      const query = new URLSearchParams(statsFilters).toString();
      const response = await axiosInstance.get(`/inventory/usage-statistics?${query}`);
      setUsageStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch usage statistics');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUsageInputChange = (e) => {
    const { name, value } = e.target;
    setUsageFormData({
      ...usageFormData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        stockResetDate: formData.stockResetDate || null
      };

      if (editMode) {
        await axiosInstance.put(`/inventory/${currentItemId}`, dataToSend);
        toast.success('Item updated successfully');
      } else {
        await axiosInstance.post('/inventory/add', dataToSend);
        toast.success('Item added successfully');
      }
      resetForm();
      fetchInventoryItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    }
  };

  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...usageFormData,
        user: usageFormData.user || null
      };
      await axiosInstance.post('/inventory/usage', dataToSend);
      toast.success('Usage recorded successfully');
      resetUsageForm();
      fetchInventoryItems();
      if (showUsageHistory) fetchUsageHistory(showUsageHistory);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record usage');
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minStockLevel: item.minStockLevel,
      supplier: item.supplier?._id || item.supplier || '',
      costPerUnit: item.costPerUnit,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      notes: item.notes || '',
      reorderFrequency: item.reorderFrequency || 'As Needed',
      storageConditions: item.storageConditions || 'Dry',
      stockResetDate: item.stockResetDate ? item.stockResetDate.split('T')[0] : ''
    });
    setCurrentItemId(item._id);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axiosInstance.delete(`/inventory/${id}`);
        toast.success('Item deleted successfully');
        fetchInventoryItems();
        if (showUsageHistory === id) setShowUsageHistory(null);
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Ingredient',
      quantity: 0,
      unit: 'kg',
      minStockLevel: 0,
      supplier: '',
      costPerUnit: 0,
      expiryDate: '',
      notes: '',
      reorderFrequency: 'As Needed',
      storageConditions: 'Dry',
      stockResetDate: ''
    });
    setEditMode(false);
    setCurrentItemId(null);
    setShowForm(false);
  };

  const resetUsageForm = () => {
    setUsageFormData({
      inventoryItem: '',
      quantityUsed: 0,
      purpose: 'Production',
      user: '',
      notes: ''
    });
    setShowUsageForm(false);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const applyFilters = () => {
    let filtered = [...inventoryItems];

    if (activeFilter === 'low-stock') {
      filtered = filtered.filter(item => item.quantity < item.minStockLevel);
    } else if (activeFilter === 'expiring-soon') {
      filtered = filtered.filter(item => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 10;
      });
    } else if (activeFilter === 'reset-scheduled') {
      filtered = filtered.filter(item => item.stockResetDate);
    } else if (activeFilter === 'reorder-alert') {
      filtered = filtered.filter(item => item.reorderAlert);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.category === activeFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        (item.supplier && (
          (typeof item.supplier === 'string' && item.supplier.toLowerCase().includes(search)) ||
          (item.supplier.name && item.supplier.name.toLowerCase().includes(search))
        )) ||
        (item.notes && item.notes.toLowerCase().includes(search))
      );
    }

    filtered.sort((a, b) => {
      let valueA, valueB;
      if (sortField === 'name') {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      } else if (sortField === 'quantity') {
        valueA = a.quantity;
        valueB = b.quantity;
      } else if (sortField === 'category') {
        valueA = a.category.toLowerCase();
        valueB = b.category.toLowerCase();
      } else if (sortField === 'expiryDate') {
        valueA = a.expiryDate ? new Date(a.expiryDate) : new Date(9999, 11, 31);
        valueB = b.expiryDate ? new Date(b.expiryDate) : new Date(9999, 11, 31);
      } else if (sortField === 'averageDailyUsage') {
        valueA = a.averageDailyUsage || 0;
        valueB = b.averageDailyUsage || 0;
      }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleStatsFilterChange = (e) => {
    const { name, value } = e.target;
    setStatsFilters({
      ...statsFilters,
      [name]: value
    });
  };

  const getItemTags = (item) => {
    const tags = [];
    const today = new Date();

    if (item.quantity < item.minStockLevel) {
      tags.push({
        type: 'lowStock',
        icon: <AlertTriangle size={14} />,
        ...statusTags.lowStock
      });
    } else {
      tags.push({
        type: 'wellStocked',
        icon: <ShoppingBag size={14} />,
        ...statusTags.wellStocked
      });
    }

    if (item.reorderAlert) {
      tags.push({
        type: 'reorderAlert',
        icon: <AlertTriangle size={14} />,
        ...statusTags.reorderAlert
      });
    }

    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) {
        tags.push({
          type: 'expired',
          icon: <AlertTriangle size={14} />,
          ...statusTags.expired
        });
      } else if (daysUntilExpiry <= 10) {
        tags.push({
          type: 'expiringSoon',
          icon: <Calendar size={14} />,
          ...statusTags.expiringSoon
        });
      }
    }

    if (item.stockResetDate) {
      tags.push({
        type: 'stockReset',
        icon: <RefreshCw size={14} />,
        ...statusTags.stockReset
      });
    }

    if (item.storageConditions) {
      const storageTag = item.storageConditions.toLowerCase();
      if (storageTag === 'refrigerated') {
        tags.push({
          type: 'refrigerated',
          icon: <Thermometer size={14} />,
          ...statusTags.refrigerated
        });
      } else if (storageTag === 'frozen') {
        tags.push({
          type: 'frozen',
          icon: <Thermometer size={14} />,
          ...statusTags.frozen
        });
      } else if (storageTag === 'dry') {
        tags.push({
          type: 'dry',
          icon: <Package size={14} />,
          ...statusTags.dry
        });
      } else if (storageTag === 'ambient') {
        tags.push({
          type: 'ambient',
          icon: <Package size={14} />,
          ...statusTags.ambient
        });
      }
    }

    return tags;
  };

  const getTagColor = (type) => {
    const colors = {
      lowStock: "bg-red-100 text-red-800 border-red-200",
      expired: "bg-red-100 text-red-800 border-red-200",
      expiringSoon: "bg-orange-100 text-orange-800 border-orange-200",
      stockReset: "bg-purple-100 text-purple-800 border-purple-200",
      wellStocked: "bg-green-100 text-green-800 border-green-200",
      refrigerated: "bg-blue-100 text-blue-800 border-blue-200",
      frozen: "bg-cyan-100 text-cyan-800 border-cyan-200",
      dry: "bg-amber-100 text-amber-800 border-amber-200",
      ambient: "bg-teal-100 text-teal-800 border-teal-200",
      reorderAlert: "bg-red-200 text-red-900 border-red-300"
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const calculateInventoryStats = () => {
    const stats = {
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(item => item.quantity < item.minStockLevel).length,
      reorderAlerts: inventoryItems.filter(item => item.reorderAlert).length,
      expiringItems: 0,
      totalValue: 0
    };

    const today = new Date();
    inventoryItems.forEach(item => {
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 10) {
          stats.expiringItems++;
        }
      }
      stats.totalValue += (item.quantity * item.costPerUnit);
    });

    return stats;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8">
      <div className="flex items-center">
        <AlertTriangle className="text-red-500 mr-2" />
        <p className="text-red-700">Error: {error}</p>
      </div>
    </div>
  );

  const filteredItems = applyFilters();
  const stats = calculateInventoryStats();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg mb-8 shadow-lg">
          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Inventory Management</h1>
            <p className="text-blue-100 mb-4">Track, manage, and optimize your inventory with usage tracking</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-1">Total Items</h3>
                <p className="text-3xl font-bold text-white">{stats.totalItems}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-1">Low Stock</h3>
                <p className="text-3xl font-bold text-white">{stats.lowStockItems}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-1">Reorder Alerts</h3>
                <p className="text-3xl font-bold text-white">{stats.reorderAlerts}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-1">Expiring Soon</h3>
                <p className="text-3xl font-bold text-white">{stats.expiringItems}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <h3 className="text-white text-lg font-semibold mb-1">Total Value</h3>
                <p className="text-3xl font-bold text-white">₹{stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md"
            >
              {showForm ? (
                <>
                  <X size={18} className="mr-2" /> Cancel
                </>
              ) : (
                <>
                  <PlusCircle size={18} className="mr-2" /> Add New Item
                </>
              )}
            </button>
            <button
              onClick={() => setShowUsageForm(!showUsageForm)}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-md"
            >
              {showUsageForm ? (
                <>
                  <X size={18} className="mr-2" /> Cancel Usage
                </>
              ) : (
                <>
                  <Activity size={18} className="mr-2" /> Record Usage
                </>
              )}
            </button>
            <button
              onClick={() => { setShowStats(!showStats); if (!showStats) fetchUsageStats(); }}
              className="flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition shadow-md"
            >
              {showStats ? (
                <>
                  <X size={18} className="mr-2" /> Hide Stats
                </>
              ) : (
                <>
                  <Activity size={18} className="mr-2" /> View Stats
                </>
              )}
            </button>
            <button
              onClick={() => fetchInventoryItems()}
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-md"
            >
              <RefreshCw size={18} className="mr-2" /> Refresh
            </button>
          </div>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center mb-3">
            <Filter size={18} className="mr-2 text-gray-500" />
            <h3 className="text-lg font-medium">Filters</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-full ${activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              All Items
            </button>
            <button
              onClick={() => handleFilterChange('low-stock')}
              className={`px-3 py-1.5 rounded-full ${activeFilter === 'low-stock'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Low Stock
            </button>
            <button
              onClick={() => handleFilterChange('reorder-alert')}
              className={`px-3 py-1.5 rounded-full ${activeFilter === 'reorder-alert'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Reorder Alerts
            </button>
            <button
              onClick={() => handleFilterChange('expiring-soon')}
              className={`px-3 py-1.5 rounded-full ${activeFilter === 'expiring-soon'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Expiring Soon
            </button>
            <button
              onClick={() => handleFilterChange('reset-scheduled')}
              className={`px-3 py-1.5 rounded-full ${activeFilter === 'reset-scheduled'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Reset Scheduled
            </button>
            <div className="w-full md:w-auto">
              <select
                className="mt-2 md:mt-0 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-none appearance-none pl-4 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={activeFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
              >
                <option value="" disabled>Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editMode ? 'Update Inventory Item' : 'Add New Inventory Item'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Item Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Supplier</label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                  <div className="flex">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-2/3 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      min="0"
                      step="0.01"
                      required
                    />
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-1/3 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Min Stock Level</label>
                  <input
                    type="number"
                    name="minStockLevel"
                    value={formData.minStockLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Cost Per Unit</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">₹</span>
                    </div>
                    <input
                      type="number"
                      name="costPerUnit"
                      value={formData.costPerUnit}
                      onChange={handleInputChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Stock Reset Date</label>
                  <input
                    type="date"
                    name="stockResetDate"
                    value={formData.stockResetDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Date when stock will be reset to min stock level
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Storage Conditions</label>
                  <select
                    name="storageConditions"
                    value={formData.storageConditions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Dry">Dry</option>
                    <option value="Ambient">Ambient</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Reorder Frequency</label>
                  <select
                    name="reorderFrequency"
                    value={formData.reorderFrequency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="As Needed">As Needed</option>
                  </select>
                </div>
                <div className="mb-4 md:col-span-3">
                  <label className="block text-gray-700 font-medium mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center"
                >
                  <X size={18} className="mr-2" /> Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                >
                  {editMode ? (
                    <>
                      <Save size={18} className="mr-2" /> Update Item
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} className="mr-2" /> Add Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {showUsageForm && (
          <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Record Inventory Usage</h2>
            </div>
            <form onSubmit={handleUsageSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Item</label>
                  <select
                    name="inventoryItem"
                    value={usageFormData.inventoryItem}
                    onChange={handleUsageInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="">Select Item</option>
                    {inventoryItems.map(item => (
                      <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Quantity Used</label>
                  <input
                    type="number"
                    name="quantityUsed"
                    value={usageFormData.quantityUsed}
                    onChange={handleUsageInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Purpose</label>
                  <select
                    name="purpose"
                    value={usageFormData.purpose}
                    onChange={handleUsageInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    {purposes.map(purpose => (
                      <option key={purpose} value={purpose}>{purpose}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">User (Optional)</label>
                  <select
                    name="user"
                    value={usageFormData.user}
                    onChange={handleUsageInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">No User</option>
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map(user => (
                        <option key={user._id} value={user._id}>{user.username}</option>
                      ))
                    ) : (
                      <option disabled>No users available</option>
                    )}
                  </select>
                </div>
                <div className="mb-4 md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={usageFormData.notes}
                    onChange={handleUsageInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="3"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={resetUsageForm}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center"
                >
                  <X size={18} className="mr-2" /> Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <Save size={18} className="mr-2" /> Record Usage
                </button>
              </div>
            </form>
          </div>
        )}

        {showStats && (
          <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Usage Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={statsFilters.startDate}
                    onChange={handleStatsFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={statsFilters.endDate}
                    onChange={handleStatsFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={statsFilters.category}
                    onChange={handleStatsFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={fetchUsageStats}
                className="mb-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center"
              >
                <RefreshCw size={18} className="mr-2" /> Update Stats
              </button>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity Used</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Count</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageStats.length > 0 ? (
                      usageStats.map(stat => (
                        <tr key={stat._id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{stat.itemName}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{stat.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{stat.totalQuantityUsed}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">₹{stat.totalCost.toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{stat.usageCount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Activity size={48} className="text-gray-300 mb-3" />
                            <p className="text-lg font-medium">No usage statistics found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Item Details
                      {sortField === 'name' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category
                      {sortField === 'category' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center">
                      Quantity
                      {sortField === 'quantity' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('averageDailyUsage')}
                  >
                    <div className="flex items-center">
                      Avg. Daily Usage
                      {sortField === 'averageDailyUsage' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const itemTags = getItemTags(item);
                    return (
                      <React.Fragment key={item._id}>
                        <tr
                          className={item.quantity < item.minStockLevel ? 'bg-red-50' : ''}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start">
                              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                item.category === 'Ingredient' ? 'bg-green-100' :
                                item.category === 'Beverage' ? 'bg-blue-100' :
                                item.category === 'Equipment' ? 'bg-yellow-100' :
                                item.category === 'Cleaning' ? 'bg-purple-100' :
                                item.category === 'Packaging' ? 'bg-orange-100' :
                                'bg-gray-100'
                              }`}>
                                {item.category === 'Ingredient' && <ShoppingBag size={20} className="text-green-600" />}
                                {item.category === 'Beverage' && <span className="text-blue-600">🥤</span>}
                                {item.category === 'Equipment' && <span className="text-yellow-600">⚙️</span>}
                                {item.category === 'Cleaning' && <span className="text-purple-600">🧼</span>}
                                {item.category === 'Packaging' && <Package size={20} className="text-orange-600" />}
                                {item.category === 'Storage' && <span className="text-gray-600">📦</span>}
                                {item.category === 'Other' && <Info size={20} className="text-gray-600" />}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                  {item.supplier?.name || "No supplier"}
                                </div>
                                {item.expiryDate && (
                                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                                    <Calendar size={12} className="mr-1" />
                                    Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs inline-flex items-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-medium">
                              {item.quantity} {item.unit}
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {item.minStockLevel} {item.unit}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  item.quantity < item.minStockLevel ? 'bg-red-500' :
                                  item.quantity < item.minStockLevel * 1.5 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, (item.quantity / (item.minStockLevel * 2)) * 100)}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-medium">
                              {item.averageDailyUsage ? item.averageDailyUsage.toFixed(2) : '0'} {item.unit}/day
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {itemTags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${getTagColor(tag.type)}`}
                                >
                                  <span className="mr-1">{tag.icon}</span> {tag.label}
                                </span>
                              ))}
                              {item.reorderFrequency && item.reorderFrequency !== 'As Needed' && (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border bg-indigo-100 text-indigo-800 border-indigo-200">
                                  <Clock size={14} className="mr-1" /> {item.reorderFrequency}
                                </span>
                              )}
                              {item.costPerUnit > 0 && (
                                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                                  ₹{item.costPerUnit}/{item.unit}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.notes ? (
                              <div className="max-w-xs truncate" title={item.notes}>
                                {item.notes}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No notes</span>
                            )}
                            {item.stockResetDate && (
                              <div className="text-xs flex items-center text-purple-700 mt-1">
                                <RefreshCw size={12} className="mr-1" />
                                Reset: {new Date(item.stockResetDate).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center mr-4"
                            >
                              <Edit2 size={16} className="mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => fetchUsageHistory(item._id)}
                              className="text-indigo-600 hover:text-indigo-900 inline-flex items-center mr-4"
                            >
                              <Activity size={16} className="mr-1" /> Usage History
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                            >
                              <Trash2 size={16} className="mr-1" /> Delete
                            </button>
                          </td>
                        </tr>
                        {showUsageHistory === item._id && (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 bg-gray-50">
                              <div className="bg-white rounded-lg shadow-inner p-4">
                                <h3 className="text-lg font-medium mb-3">Usage History for {item.name}</h3>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Used</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {usageHistory.length > 0 ? (
                                        usageHistory.map(usage => (
                                          <tr key={usage._id}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{new Date(usage.usageDate).toLocaleString()}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{usage.quantityUsed} {item.unit}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{usage.purpose}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">₹{usage.cost.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900">{usage.user?.username || 'None'}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{usage.notes || 'No notes'}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                                            No usage history found
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                <button
                                  onClick={() => setShowUsageHistory(null)}
                                  className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center"
                                >
                                  <X size={18} className="mr-2" /> Close
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Package size={48} className="text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No inventory items found</p>
                        <p className="text-sm">Try adjusting your filters or add new items</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-3 text-gray-500 text-sm flex justify-between items-center">
              <div>
                Showing {filteredItems.length} of {inventoryItems.length} items
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;