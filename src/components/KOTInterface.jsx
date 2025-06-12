import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { Printer, Plus, Minus, X, Utensils, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KOTInterface = ({ 
  tableId, 
  roomId, 
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

  // Fetch running KOTs for this table
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
    
    if (tableId) {
      fetchRunningKOTs();
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
      const response = await axiosInstance.post('/kot/add', {
        tableId,
        roomId,
        orderItems: kotItems.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        })),
        createdBy: 'pos'
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
      });
      
      // Refresh running KOTs after submission
      const kotResponse = await axiosInstance.get(`/kot?tableId=${tableId}&status=preparing,ready`);
      setRunningKOTs(kotResponse.data.kots);
      
      setKotItems([]);
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

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'new-order' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('new-order')}
        >
          New Order
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'running-kots' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('running-kots')}
        >
          Running KOTs ({runningKOTs.length})
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'new-order' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create New KOT</h3>
            
            {/* Product selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(product => (
                <motion.div
                  key={product._id}
                  onClick={() => handleAddItem(product)}
                  className="border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                  whileHover={{ y: -2 }}
                >
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-gray-500">₹{product.price}</div>
                </motion.div>
              ))}
            </div>
            
            {/* Current KOT items */}
            {kotItems.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Current KOT Items</h4>
                {kotItems.map(item => (
                  <div key={item.product._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <input
                        type="text"
                        placeholder="Special instructions"
                        className="text-xs w-full border-b border-gray-200 focus:border-blue-500 outline-none bg-transparent"
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
                    <div className="flex items-center ml-4">
                      <button 
                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="mx-2 w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => setKotItems([])}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSubmitKOT}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Submit KOT
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Running KOTs</h3>
            
            {runningKOTs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No running KOTs for this table
              </div>
            ) : (
              <div className="space-y-3">
                {runningKOTs.map(kot => (
                  <div key={kot._id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">
                            {kot.kotNumber}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            kot.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                            kot.status === 'ready' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {kot.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(kot.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => onPrintKOT(kot)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="Print KOT"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteKOT(kot._id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                          title="Delete KOT"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => setSelectedKOT(selectedKOT?._id === kot._id ? null : kot)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title={selectedKOT?._id === kot._id ? 'Hide items' : 'Show items'}
                        >
                          {selectedKOT?._id === kot._id ? <Minus size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    {selectedKOT?._id === kot._id && (
                      <div className="mt-3 border-t pt-3">
                        <div className="space-y-2">
                          {kot.orderItems.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <div>
                                <span>{item.product.name}</span>
                                {item.specialInstructions && (
                                  <span className="text-xs text-gray-500 block">{item.specialInstructions}</span>
                                )}
                              </div>
                              <div className="text-gray-700">x{item.quantity}</div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between mt-3 pt-2 border-t">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleKOTStatusChange(kot._id, 'preparing')}
                              className={`text-xs px-2 py-1 rounded ${
                                kot.status === 'pending' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 'bg-gray-100'
                              }`}
                              disabled={kot.status !== 'pending'}
                            >
                              Mark Preparing
                            </button>
                            <button
                              onClick={() => handleKOTStatusChange(kot._id, 'ready')}
                              className={`text-xs px-2 py-1 rounded ${
                                kot.status === 'preparing' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100'
                              }`}
                              disabled={kot.status !== 'preparing'}
                            >
                              Mark Ready
                            </button>
                          </div>
                          <button
                            onClick={() => onAddToBill(kot)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                          >
                            Add to Bill
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button
                onClick={onNewKOT}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create New KOT
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-3 flex justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
        >
          Back to Tables
        </button>
        <button
          onClick={() => onAddToBill(null, true)}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Generate Final Bill
        </button>
      </div>
    </div>
  );
};

export default KOTInterface;