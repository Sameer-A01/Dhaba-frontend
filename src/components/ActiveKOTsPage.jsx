import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../utils/api";
import { X, Printer, CheckCircle, Utensils, List, MapPin, Clock, Filter, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const ActiveKOTsPage = () => {
  const [activeKOTs, setActiveKOTs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [companyInfo] = useState({
    name: localStorage.getItem("company_name") || "ROYAL KING DHABA",
    address: localStorage.getItem("company_address") || "Purvanchal Highway Road, UP, Azamgarh 276001",
    phone: localStorage.getItem("company_phone") || "+91-7398549531",
  });
   const user = JSON.parse(localStorage.getItem("ims_user"));
  const userName = user?.name;

  // Fetch rooms and active KOTs
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const [roomsResponse, kotsResponse] = await Promise.all([
        axiosInstance.get("/rooms", {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        }),
        axiosInstance.get("/kot?status=preparing,ready", {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        }),
      ]);
      setRooms(roomsResponse.data.filter((room) => room.isActive));
      setActiveKOTs(kotsResponse.data.kots);
    } catch (error) {
      alert("Failed to fetch data: " + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle KOT status change to "ready"
  const handleKOTStatusChange = async (kotId) => {
    try {
      await axiosInstance.put(`/kot/${kotId}/status`, { status: "ready" }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
      });
      setActiveKOTs((prev) =>
        prev.map((kot) =>
          kot._id === kotId ? { ...kot, status: "ready", updatedAt: new Date().toISOString() } : kot
        )
      );
      await fetchData(true);
    } catch (error) {
      alert("Failed to update KOT status: " + error.message);
    }
  };

  // Handle printing KOT
const handlePrintKOT = (kot) => {
  const printWindow = window.open("", "_blank", "width=800,height=1000,scrollbars=yes,resizable=yes");
  if (!printWindow) {
    alert("Pop-up blocked! Please allow pop-ups to print KOT.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>KOT - ${kot.kotNumber}</title>
      <meta charset="UTF-8">
      <style>
        @page { size: 80mm auto; margin: 2mm; }
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 2mm 5mm;
          color: #000;
          font-size: 14px;
          width: 70mm;
        }
        .kot-details {
          font-size: 12px;
          margin: 0;
          padding: 0;
          line-height: 1.1;
        }
        .kot-details p {
          margin: 0;
          padding: 0;
          line-height: 1.1;
        }
        .items {
          font-size: 18px;
          font-weight: bold;
          line-height: 1.3;
          margin: 4px 0 0 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div class="kot-details">
        <p>KOT No: ${kot.kotNumber}</p>
        <p>Date: ${new Date(kot.createdAt).toLocaleDateString()}</p>
        <p>Time: ${new Date(kot.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <p>Bill No: ${kot.billNumber || 'N/A'}</p>
        <p>Table: ${rooms.find((r) => r._id === kot.roomId)?.roomName || "N/A"} Table ${rooms.find((r) => r._id === kot.roomId)?.tables.find((t) => t._id === kot.tableId)?.tableNumber || "N/A"}</p>
      </div>

      <div class="items">
        ${kot.orderItems.map(item => `<div>${item.product.name.toUpperCase()}&nbsp;(${item.quantity})</div>`).join('')}
      </div>

      <script>
        setTimeout(() => window.print(), 100);
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

  // Group KOTs by room and table
  const groupedKOTs = useMemo(() => {
    const grouped = {};
    activeKOTs.forEach((kot) => {
      if (selectedRoomFilter !== "all" && kot.roomId !== selectedRoomFilter) return;
      const key = `${kot.roomId}-${kot.tableId}`;
      if (!grouped[key]) {
        grouped[key] = {
          roomId: kot.roomId,
          tableId: kot.tableId,
          roomName: rooms.find((r) => r._id === kot.roomId)?.roomName || "N/A",
          tableNumber: rooms.find((r) => r._id === kot.roomId)?.tables.find((t) => t._id === kot.tableId)?.tableNumber || "N/A",
          kots: [],
          totalItems: 0,
        };
      }
      grouped[key].kots.push(kot);
      grouped[key].totalItems += kot.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });
    return Object.values(grouped);
  }, [activeKOTs, selectedRoomFilter, rooms]);

  const totalActiveKOTs = activeKOTs.length;
  const preparingKOTs = activeKOTs.filter(kot => kot.status === "preparing").length;
  const readyKOTs = activeKOTs.filter(kot => kot.status === "ready").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                <List className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Active Kitchen Orders</h1>
                <p className="text-sm text-gray-600 mt-1">Monitor and manage your kitchen operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </motion.button>
              <Link
                to="/employee-dashboard"
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all duration-200"
              >
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Back to Tables</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total KOTs</p>
                <p className="text-3xl font-bold text-gray-900">{totalActiveKOTs}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <List className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Preparing</p>
                <p className="text-3xl font-bold text-orange-600">{preparingKOTs}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-3xl font-bold text-green-600">{readyKOTs}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tables</p>
                <p className="text-3xl font-bold text-purple-600">{groupedKOTs.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Utensils className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Section */}
        <motion.div
          className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Filter by Room:</label>
            </div>
            <select
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
            >
              <option value="all">All Rooms ({totalActiveKOTs} KOTs)</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomName} ({activeKOTs.filter(kot => kot.roomId === room._id).length} KOTs)
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="inline-block mb-4"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full">
                <Utensils className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Kitchen Orders</h3>
            <p className="text-gray-500">Please wait while we fetch the latest data...</p>
          </div>
        ) : groupedKOTs.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gray-100 p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Utensils className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Orders</h3>
            <p className="text-gray-500 mb-6">There are currently no KOTs being prepared in the kitchen.</p>
            <button
              onClick={() => fetchData(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Refresh Orders
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {groupedKOTs.map((group, index) => (
                <motion.div
                  key={`${group.roomId}-${group.tableId}`}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            {group.roomName}
                          </div>
                          <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Table {group.tableNumber}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {group.totalItems} items • {group.kots.length} order{group.kots.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* KOTs List */}
                  <div className="p-6 space-y-4">
                    {group.kots.map((kot, kotIndex) => (
                      <motion.div
                        key={kot._id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index * 0.1) + (kotIndex * 0.05) }}
                      >
                        {/* KOT Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                              KOT #{kot.kotNumber}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                kot.status === "preparing"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {kot.status === "preparing" ? "🔥 Preparing" : "✅ Ready"}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <motion.button
                              onClick={() => handlePrintKOT(kot)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Print KOT"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Printer className="w-4 h-4" />
                            </motion.button>
                            {kot.status === "preparing" && (
                              <motion.button
                                onClick={() => handleKOTStatusChange(kot._id)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Mark as Ready"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* Time Info */}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Created: {new Date(kot.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          {kot.updatedAt && (
                            <div className="flex items-center space-x-1">
                              <span>Updated: {new Date(kot.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          )}
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Order Items:</h5>
                          <div className="space-y-1">
                            {kot.orderItems.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-sm"
                              >
                                <span className="font-medium text-gray-700">{item.product.name}</span>
                                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">
                                  ×{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveKOTsPage;