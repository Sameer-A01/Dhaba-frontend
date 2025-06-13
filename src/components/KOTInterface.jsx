import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { Printer, Plus, Minus, X, Utensils, Clock, CheckCircle, Trash2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KOTInterface = ({ 
  tableId, 
  tableName,
  roomId, 
  roomName,
  products, 
  onBack, 
  onNewKOT, 
  onPrintKOT,
  onAddToBill 
}) => {
  const [activeTab, setActiveTab] = useState('new-order');
  const [kotItems, setKotItems] = useState([]);
  const [runningKOTs, setRunningKOTs] = useState([]);
  const [selectedKOT, setSelectedKOT] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [userName, setUserName] = useState('');

  // Fetch running KOTs and categories
  useEffect(() => {
    const fetchRunningKOTs = async () => {
      try {
        const response = await axiosInstance.get(`/kot?tableId=${tableId}&status=preparing,ready`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        });
        setRunningKOTs(response.data.kots);
      } catch (error) {
        console.error('Error fetching KOTs:', error);
        alert('Failed to fetch running KOTs');
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/category', {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        });
        setCategories([{ _id: 'all', name: 'All Categories' }, ...response.data.categories]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert('Failed to fetch categories');
      }
    };

    if (tableId) {
      fetchRunningKOTs();
      fetchCategories();
    }
  }, [tableId]);

  const handleAddItem = (product) => {
    setKotItems(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id 
            ? {...item, quantity: item.quantity + 1} 
            : item
        );
      }
      return [...prev, { product, quantity: 1, specialInstructions: '' }];
    });
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) {
      setKotItems(prev => prev.filter(item => item.product._id !== productId));
      return;
    }
    
    setKotItems(prev => 
      prev.map(item => 
        item.product._id === productId 
          ? {...item, quantity} 
          : item
      )
    );
  };

const handleSubmitKOT = async () => {
  if (kotItems.length === 0) {
    alert('No items in KOT');
    return;
  }
  
  try {
    const user = JSON.parse(localStorage.getItem("ims_user"));
    const response = await axiosInstance.post('/kot/add', {
      tableId,
      roomId,
      orderItems: kotItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      user: user?._id, // Add user reference to KOT
      createdBy: 'pos'
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
    });
    
    // Fetch the updated list of KOTs
    const kotResponse = await axiosInstance.get(`/kot?tableId=${tableId}&status=preparing,ready`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
    });
    setRunningKOTs(kotResponse.data.kots);
    
    // Clear the current KOT items
    setKotItems([]);
    
    // Switch to the Running KOTs tab
    setActiveTab('running-kots');
    
    alert('KOT created successfully!');
  } catch (error) {
    console.error('Error creating KOT:', error);
    alert('Failed to create KOT');
  }
};

  const handleKOTStatusChange = async (kotId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/kot/${kotId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
      });
      setRunningKOTs(prev => 
        prev.map(kot => 
          kot._id === kotId ? {...kot, status: newStatus} : kot
        )
      );
    } catch (error) {
      console.error('Error updating KOT status:', error);
      alert('Failed to update KOT status');
    }
  };

  const handleDeleteKOT = async (kotId) => {
    if (!window.confirm('Are you sure you want to delete this KOT?')) return;
    
    try {
      await axiosInstance.delete(`/kot/${kotId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
      });
      setRunningKOTs(prev => prev.filter(kot => kot._id !== kotId));
      setSelectedKOT(null);
      alert('KOT deleted successfully!');
    } catch (error) {
      console.error('Error deleting KOT:', error);
      alert('Failed to delete KOT');
    }
  };

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category?._id === selectedCategory);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with glass effect */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {activeTab === 'new-order' ? 'New KOT Order' : 'Running KOTs'}
          </h2>
          <div className="flex items-center space-x-2">
            {tableName && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Table: {tableName}
              </span>
            )}
            {roomName && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Room: {roomName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs with modern styling */}
      <div className="flex px-4 pt-2">
        <button
          className={`relative px-4 py-3 font-medium text-sm rounded-t-lg transition-all duration-200 ${
            activeTab === 'new-order' 
              ? 'bg-white text-blue-600 shadow-md' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('new-order')}
        >
          New Order
          {activeTab === 'new-order' && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b"
              layoutId="tabIndicator"
            />
          )}
        </button>
        <button
          className={`relative px-4 py-3 font-medium text-sm rounded-t-lg transition-all duration-200 ${
            activeTab === 'running-kots' 
              ? 'bg-white text-blue-600 shadow-md' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
          onClick={() => setActiveTab('running-kots')}
        >
          Running KOTs
          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
            {runningKOTs.length}
          </span>
          {activeTab === 'running-kots' && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b"
              layoutId="tabIndicator"
            />
          )}
        </button>
      </div>
      
      {/* Main content area with sidebar layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Product selection area */}
        <div className={`${activeTab === 'new-order' ? 'flex-1 overflow-auto' : 'hidden'} p-4 bg-white`}>
          <AnimatePresence mode="wait">
            <motion.div
              key="new-order-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <div className="space-y-6 h-full">
                {/* Category Filter with modern dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    <span className="font-medium">
                      {categories.find(c => c._id === selectedCategory)?.name || 'Select Category'}
                    </span>
                    {isCategoryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  <AnimatePresence>
                    {isCategoryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                      >
                        <div className="max-h-60 overflow-y-auto">
                          {categories.map(category => (
                            <button
                              key={category._id}
                              onClick={() => {
                                setSelectedCategory(category._id);
                                setIsCategoryOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 ${
                                selectedCategory === category._id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Product selection with card grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <motion.div
                        key={product._id}
                        onClick={() => handleAddItem(product)}
                        className="relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-4">
                          <div className="font-medium text-gray-800 truncate">{product.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{product.category?.name}</div>
                          <div className="mt-2 text-lg font-bold text-blue-600">₹{product.price}</div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-blue-600 text-white rounded-full p-1 shadow-md">
                            <Plus size={16} />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <div className="text-lg">No products found</div>
                      <div className="text-sm">Select a different category or add products</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Running KOTs area */}
        <div className={`${activeTab === 'running-kots' ? 'flex-1 overflow-auto' : 'hidden'} p-4 bg-white`}>
          <AnimatePresence mode="wait">
            <motion.div
              key="running-kots-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <div className="space-y-4 h-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Running KOTs</h3>
                  <motion.button
                    onClick={onNewKOT}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-md transition-all flex items-center"
                  >
                    <Plus size={18} className="mr-2" />
                    New KOT
                  </motion.button>
                </div>
                
                {runningKOTs.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 h-full flex flex-col justify-center"
                  >
                    <div className="text-gray-400 mb-4">
                      <Utensils size={48} className="mx-auto" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-500">No active KOTs</h4>
                    <p className="text-gray-400 mt-1">Create a new KOT to get started</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {runningKOTs.map(kot => (
                      <motion.div 
                        key={kot._id} 
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-3">
                                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                                  KOT #{kot.kotNumber}
                                </span>
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  kot.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                                  kot.status === 'ready' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {kot.status.charAt(0).toUpperCase() + kot.status.slice(1)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 flex items-center">
                                <Clock size={14} className="mr-1" />
                                {new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              {kot.user?.name && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center">
                                  <User size={14} className="mr-1" />
                                  <span>User: {kot.user.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => onPrintKOT(kot)}
                                className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                title="Print KOT"
                              >
                                <Printer size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteKOT(kot._id)}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete KOT"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button 
                                onClick={() => setSelectedKOT(selectedKOT?._id === kot._id ? null : kot)}
                                className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                title={selectedKOT?._id === kot._id ? 'Hide items' : 'Show items'}
                              >
                                {selectedKOT?._id === kot._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {selectedKOT?._id === kot._id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4"
                              >
                                <div className="border-t pt-4">
                                  <div className="space-y-3">
                                    {kot.orderItems.map((item, index) => (
                                      <div key={index} className="flex justify-between text-sm">
                                        <div>
                                          <span className="font-medium">{item.product.name}</span>
                                          {item.specialInstructions && (
                                            <div className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                                              <span className="font-medium">Note: </span>
                                              {item.specialInstructions}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-gray-700 font-medium">x{item.quantity}</div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <div className="flex justify-between mt-4 pt-3 border-t">
                                    <div className="flex space-x-2">
                                      <motion.button
                                        onClick={() => handleKOTStatusChange(kot._id, 'preparing')}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`text-xs px-3 py-2 rounded-lg ${
                                          kot.status === 'pending' 
                                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        } flex items-center`}
                                        disabled={kot.status !== 'pending'}
                                      >
                                        <Clock size={14} className="mr-1" />
                                        Preparing
                                      </motion.button>
                                      <motion.button
                                        onClick={() => handleKOTStatusChange(kot._id, 'ready')}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`text-xs px-3 py-2 rounded-lg ${
                                          kot.status === 'preparing' 
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        } flex items-center`}
                                        disabled={kot.status !== 'preparing'}
                                      >
                                        <CheckCircle size={14} className="mr-1" />
                                        Ready
                                      </motion.button>
                                    </div>
                                    <motion.button
                                      onClick={() => onAddToBill(kot)}
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      className="text-xs px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 flex items-center"
                                    >
                                      <Plus size={14} className="mr-1" />
                                      Add to Bill
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* KOT sidebar - only visible in new-order tab */}
        {activeTab === 'new-order' && (
          <div className="w-80 border-l border-gray-200 bg-white shadow-inner flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Current Order</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-500">
                  {kotItems.length} {kotItems.length === 1 ? 'item' : 'items'}
                </span>
                {kotItems.length > 0 && (
                  <button 
                    onClick={() => setKotItems([])}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {kotItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Utensils size={32} className="mb-2" />
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs mt-1">Click on products to add them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kotItems.map(item => (
                    <motion.div 
                      key={item.product._id} 
                      className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors duration-150"
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center">
                            <span>{item.product.name}</span>
                            <span className="ml-2 text-sm text-gray-500">₹{item.product.price}</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Add special instructions..."
                            className="mt-1 text-sm w-full px-2 py-1 border-b border-gray-200 focus:border-blue-500 outline-none bg-transparent placeholder-gray-400"
                            value={item.specialInstructions}
                            onChange={(e) => 
                              setKotItems(prev => 
                                prev.map(i => 
                                  i.product._id === item.product._id 
                                    ? {...i, specialInstructions: e.target.value} 
                                    : i
                                )
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center ml-4 bg-white rounded-full shadow-inner">
                          <button 
                            onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="mx-2 w-6 text-center font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                            className="p-1 text-gray-500 hover:text-green-500 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {kotItems.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <motion.button
                  onClick={handleSubmitKOT}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-md transition-all flex items-center justify-center"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Submit KOT ({kotItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer with action buttons and payment method */}
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-200 p-3 flex justify-between shadow-sm">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
        >
          <ChevronDown size={18} className="mr-2 transform rotate-90" />
          Back to Tables
        </motion.button>
        
        <div className="flex items-center space-x-4">
          {/* Payment Method Selection */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-gray-700">Payment:</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          
          <motion.button
            onClick={() => onAddToBill(null, true, paymentMethod)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 shadow-md transition-all flex items-center"
          >
            <CheckCircle size={18} className="mr-2" />
            Generate Final Bill
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default KOTInterface;