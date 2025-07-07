import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import axiosInstance from "../utils/api";
import { ShoppingCart, X, Printer, Settings, MapPin, Users, RefreshCw, ChevronRight, ChevronLeft, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KOTInterface from "./KOTInterface";
import { Link } from "react-router-dom";

const POSPage = () => {
  // State declarations
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(localStorage.getItem("selectedRoom") || "");
  const [selectedTable, setSelectedTable] = useState("");
  const [showTableSelection, setShowTableSelection] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [companyInfo, setCompanyInfo] = useState({
    name: localStorage.getItem("company_name") || "ROYAL KING DHABA",
    address: localStorage.getItem("company_address") || "Purvanchal Highway Road, UP, Azamgarh 276001",
    phone: localStorage.getItem("company_phone") || "+91-7398549531",
    email: localStorage.getItem("company_email") || "royalkingdhaba9531@gmail.com",
    taxRate: localStorage.getItem("company_taxRate") || "5",
    discount: localStorage.getItem("company_discount") || "0",
  });
  const [showSettings, setShowSettings] = useState(false);
  const [refreshingRooms, setRefreshingRooms] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState({
    kots: [],
    totalAmount: 0,
    items: [],
    paymentMethod: "cash",
    discount: { type: "percentage", value: 0, reason: "Standard discount" },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const billRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("ims_user"));
  const userName = user?.name;
  const invoiceNum = `INV-${Date.now().toString().substr(-6)}`;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Optimized data fetching with cleanup
  const fetchData = useCallback(async () => {
    setRefreshingRooms(true);
    try {
      const [roomsResponse, productsResponse] = await Promise.all([
        axiosInstance.get("/rooms", {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        }),
        axiosInstance.get("/products", {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        }),
      ]);
      setRooms(roomsResponse.data.filter((room) => room.isActive));
      setCategories(productsResponse.data.categories);
      setProducts(productsResponse.data.products);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setRefreshingRooms(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const fetchDataWithCheck = async () => {
      if (!isMounted) return;
      await fetchData();
    };

    fetchDataWithCheck(); // Initial fetch

    // Set interval with cleanup
    intervalId = setInterval(fetchDataWithCheck, 6000); // 6 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchData]);

  // Persist selectedRoom to localStorage
  useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem("selectedRoom", selectedRoom);
    } else {
      localStorage.removeItem("selectedRoom");
    }
  }, [selectedRoom]);

  // Memoized room status calculation
  const getRoomStatus = useCallback((room) => {
    const tables = room.tables || [];
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const available = tables.filter((t) => t.status === "available").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    return { occupied, available, reserved };
  }, []);

  // Memoized filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.roomName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [rooms, debouncedSearchQuery]);

  // Room item component with memoization
  const RoomItem = useMemo(() => ({ room, selectedRoom, handleRoomSelect }) => {
    const { occupied, available, reserved } = getRoomStatus(room);
    
    return (
      <div key={room._id} className="border-b border-gray-700">
        <motion.button
          onClick={() => handleRoomSelect(room._id)}
          className={`w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-700 transition-colors ${
            selectedRoom === room._id ? "bg-gray-700" : ""
          }`}
          whileHover={{ x: 5 }}
        >
          <div className="flex items-center gap-2">
            <span>{room.roomName}</span>
            <div className="flex gap-1">
              {occupied > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {occupied}
                </span>
              )}
              {available > 0 && (
                <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  {available}
                </span>
              )}
              {reserved > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                  {reserved}
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={16} />
        </motion.button>
      </div>
    );
  }, [getRoomStatus]);

  // Handle room selection
  const handleRoomSelect = useCallback((roomId) => {
    setSelectedRoom(roomId);
    setShowTableSelection(true);
  }, []);

  // Handle table selection
  const handleTableSelect = useCallback((roomId, tableId) => {
    setSelectedRoom(roomId);
    setSelectedTable(tableId);
    setShowTableSelection(false);
    setIsSidebarOpen(false);
  }, []);

  // Handle back to table selection
  const handleBackToTables = useCallback(() => {
    setShowTableSelection(true);
    setSelectedTable("");
    setIsSidebarOpen(true);
  }, []);

  // Handle new KOT creation
  const handleNewKOT = useCallback(() => {
    setShowTableSelection(false);
    setIsSidebarOpen(false);
  }, []);

  // Handle adding KOT items to bill
  const handleAddToBill = useCallback(async (kot = null, generateFinalBill = false, paymentMethod = "cash", kotDiscount = null) => {
    try {
      const response = await axiosInstance.get(`/kot?tableId=${selectedTable}&status=preparing,ready`);
      const kots = response.data.kots;

      const itemMap = new Map();
      kots.forEach((kot) => {
        kot.orderItems.forEach((item) => {
          const product = products.find((p) => p._id === (item.product?._id || item.product));
          if (product) {
            const key = product._id;
            const existing = itemMap.get(key) || { product, quantity: 0, itemTotal: 0 };
            itemMap.set(key, {
              product,
              quantity: existing.quantity + item.quantity,
              itemTotal: existing.itemTotal + (product.price * item.quantity),
            });
          }
        });
      });

      const items = Array.from(itemMap.values());
      const totalAmount = items.reduce((sum, item) => sum + item.itemTotal, 0);

      const discountToUse = kotDiscount || {
        type: "percentage",
        value: parseFloat(companyInfo.discount) || 0,
        reason: "Standard discount",
      };

      if (generateFinalBill) {
        const orderData = {
          roomId: selectedRoom,
          tableId: selectedTable,
          kotIds: kots.map((kot) => kot._id),
          products: items.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          discount: discountToUse,
          paymentMethod,
        };

        await axiosInstance.post("/order/add", orderData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        });

        await axiosInstance.put(`/kot/close/${selectedTable}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        });

        await fetchData();
      }

      setBillData({
        kots,
        items,
        totalAmount,
        paymentMethod,
        discount: discountToUse,
      });

      setShowBill(true);
    } catch (error) {
      console.error("Error details:", error.response?.data || error.message);
      alert("Failed to generate bill: " + (error.response?.data?.message || error.message));
    }
  }, [selectedTable, products, companyInfo.discount, selectedRoom, fetchData]);

  // Handle printing KOT
  const handlePrintKOT = useCallback((kot) => {
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
          ${kot.orderItems.map(item => `<div>${item.product.name.toUpperCase()} (${item.quantity})</div>`).join('')}
        </div>
        <script>
          setTimeout(() => {
            window.print();
            setTimeout(() => window.close(), 1000);
          }, 100);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [rooms]);

  // Handle bill printing
  const handlePrintBill = useCallback(() => {
    const printWindow = window.open("", "_blank", "width=800,height=1000,scrollbars=yes,resizable=yes");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print the bill.");
      return;
    }

    const totalItems = billData.items.reduce((sum, item) => sum + item.quantity, 0);
    const discount = calculateDiscount();
    const subtotal = billData.totalAmount.toFixed(2);
    const afterDiscount = calculateSubtotalAfterDiscount();
    const gst = calculateTax();
    const grandTotal = calculateGrandTotal();
    const totalSavings = discount;

    const room = rooms.find(r => r._id === selectedRoom);
    const table = room?.tables.find(t => t._id === selectedTable);

printWindow.document.write(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Bill - ${companyInfo.name}</title>
    <style>
      @page { size: 80mm auto; margin: 1.5mm; }
      body {
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: 530;
        width: 76mm;
        padding: 3mm 2mm;
        margin: 0;
        color: #000;
        line-height: 1.8;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
      }
      .center { text-align: center; }
      .header-title {
        font-size: 18px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .line {
        border-bottom: 1px dashed #000;
        margin: 7px 0;
      }
      .item-row {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        white-space: nowrap;
      }
      .item-name { width: 42%; }
      .item-qty { width: 13%; text-align: right; }
      .item-rate { width: 20%; text-align: right; }
      .item-total { width: 25%; text-align: right; }
      .summary-line {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }
      .section {
        margin: 10px 0;
      }
      .highlight-label {
        font-weight: 700;
      }
      .summary-bold {
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="center header-title">${companyInfo.name}</div>
    <div class="center">${companyInfo.address}</div>
    <div class="center">GSTIN: 09ABKFR9647R1ZV</div>
    <div class="center">Phone: ${companyInfo.phone}</div>

    <div class="line"></div>
    <div class="section">
      <div><span class="highlight-label">Bill No:</span> ${invoiceNum}</div>
      <div><span class="highlight-label">Date:</span> ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div><span class="highlight-label">Table:</span> ${room?.roomName || "N/A"} - ${table?.tableNumber || "N/A"}</div>
      <div>Payment: ${billData.paymentMethod.charAt(0).toUpperCase() + billData.paymentMethod.slice(1)}</div>
    </div>

    <div class="line"></div>
    <div class="item-row summary-bold">
      <span class="item-name">Item</span>
      <span class="item-qty">Qty</span>
      <span class="item-rate">Rate</span>
      <span class="item-total">Total</span>
    </div>

    ${billData.items.map(item => `
      <div class="item-row">
        <span class="item-name">${item.product.name}</span>
        <span class="item-qty">${item.quantity}</span>
        <span class="item-rate">${item.product.price.toFixed(2)}</span>
        <span class="item-total">${item.itemTotal.toFixed(2)}</span>
      </div>
    `).join('')}

    <div class="line"></div>
    <div class="section"><span class="highlight-label">Qty:</span> ${totalItems}</div>
    <div class="line"></div>

    <div class="summary-line"><span>Sub Total:</span><span>₹${subtotal}</span></div>
    ${discount !== "0.00" ? `<div class="summary-line"><span>Discount:</span><span>-₹${discount}</span></div>` : ""}
    ${discount !== "0.00" ? `<div class="summary-line"><span>After Discount:</span><span>₹${afterDiscount}</span></div>` : ""}
    <div class="summary-line"><span>GST:</span><span>₹${gst}</span></div>
    <div class="summary-line summary-bold"><span>Total:</span><span>₹${grandTotal}</span></div>
    <div class="summary-line"><span>Balance:</span><span>₹${grandTotal}</span></div>

    <div class="line"></div>
    ${discount !== "0.00" ? `<div class="center summary-bold">You Saved ₹${totalSavings}</div>` : ""}
    <div class="center summary-bold">Thank You! Visit Again!</div>

    <script>
      window.onload = function() {
        setTimeout(() => {
          window.print();
          setTimeout(() => window.close(), 1000);
        }, 500);
      };
    </script>
  </body>
  </html>
`);



    printWindow.document.close();
  }, [billData, companyInfo, selectedRoom, rooms]);

  // Calculate bill totals with memoization
  const calculateDiscount = useCallback(() => {
    const discount = billData.discount || { type: "percentage", value: parseFloat(companyInfo.discount) || 0 };
    if (discount.type === "percentage") {
      return (billData.totalAmount * (discount.value / 100)).toFixed(2);
    } else {
      return Math.min(discount.value, billData.totalAmount).toFixed(2);
    }
  }, [billData, companyInfo.discount]);

  const calculateSubtotalAfterDiscount = useCallback(() => {
    return (parseFloat(billData.totalAmount) - parseFloat(calculateDiscount())).toFixed(2);
  }, [billData.totalAmount, calculateDiscount]);

  const calculateTax = useCallback(() => {
    const taxRatePercent = parseFloat(companyInfo.taxRate) || 0;
    const subtotalAfterDiscount = parseFloat(calculateSubtotalAfterDiscount());
    return (subtotalAfterDiscount * (taxRatePercent / 100)).toFixed(2);
  }, [companyInfo.taxRate, calculateSubtotalAfterDiscount]);

  const calculateGrandTotal = useCallback(() => {
    const subtotalAfterDiscount = parseFloat(calculateSubtotalAfterDiscount());
    const tax = parseFloat(calculateTax());
    return (subtotalAfterDiscount + tax).toFixed(2);
  }, [calculateSubtotalAfterDiscount, calculateTax]);

  // Handle company info change
  const handleCompanyInfoChange = useCallback((e) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem(`company_${name}`, value);
      return updated;
    });
  }, []);

  // Handle closing bill with cleanup
  const handleCloseBill = useCallback(() => {
    setShowBill(false);
    setBillData({
      kots: [],
      totalAmount: 0,
      items: [],
      paymentMethod: "cash",
      discount: { type: "percentage", value: 0, reason: "Standard discount" },
    });
    setShowTableSelection(true);
    setSelectedTable("");
    setIsSidebarOpen(true);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.1 }}
            className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-2xl flex flex-col"
          >
            <div className="p-4 flex justify-between items-center border-b border-gray-700">
              <h2 className="text-lg font-bold">Rooms</h2>
              <motion.button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft size={20} />
              </motion.button>
            </div>
            {/* Search Bar */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>
            {/* Room List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRooms.map((room) => (
                <RoomItem
                  key={room._id}
                  room={room}
                  selectedRoom={selectedRoom}
                  handleRoomSelect={handleRoomSelect}
                />
              ))}
              {filteredRooms.length === 0 && (
                <p className="px-4 py-3 text-gray-400 text-sm">No rooms found.</p>
              )}
            </div>
            {/* Footer with Color Legend */}
            <div className="p-4 border-t border-gray-700">
              <p className="text-xs font-semibold mb-2">Status Legend:</p>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span>Reserved</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {!isSidebarOpen && (
                <motion.button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-full hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight size={20} />
                </motion.button>
              )}
              <h1 className="text-xl md:text-2xl font-bold truncate max-w-[200px] md:max-w-none">
                {companyInfo.name} <span className="text-blue-200">POS</span>
              </h1>
              {userName && (
                <p className="hidden sm:inline-flex text-xs bg-blue-600 px-3 py-1 rounded-full">
                  Cashier: {userName}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm transition-colors"
                whileHover={{ y: -1 }}
                aria-label="Open settings"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Settings</span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Company Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close settings"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      name="name"
                      value={companyInfo.name}
                      onChange={handleCompanyInfoChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={companyInfo.address}
                      onChange={handleCompanyInfoChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={companyInfo.phone}
                      onChange={handleCompanyInfoChange}
                      className="w-full px-4 py-2 border-b border-gray-300 focus:border-blue-500 focus:ring-0 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={companyInfo.email}
                      onChange={handleCompanyInfoChange}
                      className="w-full px-4 py-2 border-b border-gray-300 focus:border-blue-500 focus:ring-0 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                    <input
                      type="number"
                      name="taxRate"
                      min="0"
                      max="100"
                      step="0.1"
                      value={companyInfo.taxRate}
                      onChange={handleCompanyInfoChange}
                      className="w-full px-4 py-2 border-b border-gray-300 focus:border-blue-500 focus:ring-0 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
                    <input
                      type="number"
                      name="discount"
                      min="0"
                      max="100"
                      step="0.1"
                      value={companyInfo.discount}
                      onChange={handleCompanyInfoChange}
                      className="w-full px-4 py-2 border-b border-gray-300 focus:border-blue-500 focus:ring-0 transition-all"
                    />
                  </div>
                  <motion.button
                    onClick={() => setShowSettings(false)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-full hover:bg-blue-700 transition-all duration-300 shadow-md"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Save Settings
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bill Modal */}
        <AnimatePresence>
          {showBill && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-1"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Invoice</h2>
                  <button
                    onClick={handleCloseBill}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close invoice"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div ref={billRef} className="p-6 border border-gray-200 rounded-lg bg-white">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">{companyInfo.name}</h1>
                    <p className="text-gray-600">{companyInfo.address}</p>
                    <p className="text-gray-600">Phone: {companyInfo.phone}</p>
                    <p className="text-gray-600">Email: {companyInfo.email}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
                    <div>
                      <p className="font-semibold">Invoice #: {invoiceNum}</p>
                      <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                      <p className="text-gray-600">Time: {new Date().toLocaleTimeString()}</p>
                      <p className="text-gray-600">Room: {rooms.find((r) => r._id === selectedRoom)?.roomName || "N/A"}</p>
                      <p className="text-gray-600">Table: {rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber || "N/A"}</p>
                      <p className="text-gray-600">
                        Payment Method:
                        <select
                          value={billData.paymentMethod}
                          onChange={(e) => setBillData({ ...billData, paymentMethod: e.target.value })}
                          className="ml-2 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="upi">UPI</option>
                        </select>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cashier: {userName}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full mb-6">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-3 text-gray-700">Item</th>
                          <th className="text-right py-3 text-gray-700">Price</th>
                          <th className="text-right py-3 text-gray-700">Qty</th>
                          <th className="text-right py-3 text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billData.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3">{item.product.name}</td>
                            <td className="text-right py-3">₹{item.product.price.toFixed(2)}</td>
                            <td className="text-right py-3">{item.quantity}</td>
                            <td className="text-right py-3">₹{item.itemTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <div className="w-64 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{billData.totalAmount.toFixed(2)}</span>
                      </div>
                      {calculateDiscount() !== "0.00" && (
                        <>
                          <div className="flex justify-between py-2">
                            <span className="text-gray-600">
                              Discount ({billData.discount?.type === "percentage" ? `${billData.discount?.value || 0}%` : `₹${billData.discount?.value || 0}`}):
                            </span>
                            <span className="font-medium text-green-600">₹{calculateDiscount()}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-gray-600">Subtotal after Discount:</span>
                            <span className="font-medium">₹{calculateSubtotalAfterDiscount()}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">GST ({companyInfo.taxRate}%):</span>
                        <span className="font-medium">₹{calculateTax()}</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold border-t border-gray-300 mt-2 pt-3">
                        <span>Grand Total:</span>
                        <span className="text-blue-600">₹{calculateGrandTotal()}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Total Items:</span>
                        <span className="font-medium">{billData.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-8 text-gray-500">
                    <p>Thank you for visiting!</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                  <motion.button
                    onClick={handlePrintBill}
                    className="flex items-center justify-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Printer size={18} />
                    <span>Print Invoice</span>
                  </motion.button>
                  <motion.button
                    onClick={handleCloseBill}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-md"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    New Order
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden p-6">
          {showTableSelection ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedRoom ? `Tables in ${rooms.find((r) => r._id === selectedRoom)?.roomName || "Room"}` : "Select a Room"}
                </h2>
                <div className="flex items-center gap-3">
                  <Link
                    to="/admin-dashboard/active-kots"
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <MapPin size={18} />
                    <span>Active KOTs</span>
                  </Link>
                  <motion.button
                    onClick={fetchData}
                    disabled={refreshingRooms}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw size={18} />
                    <span>Refresh</span>
                  </motion.button>
                </div>
              </div>
              <div className="space-y-6">
                {selectedRoom ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                     {rooms
  .find((r) => r._id === selectedRoom)
  ?.tables.map((table) => (
    <motion.div
      key={table._id}
      onClick={() => handleTableSelect(selectedRoom, table._id)}
      className={`p-4 border-2 rounded-xl transition-all ${
        table.status !== "available"
          ? "border-gray-300 bg-gray-100"
          : "border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {table.tableType === "booth" ? "🛋️" : 
               table.tableType === "high-top" ? "🍸" : 
               table.tableType === "outdoor" ? "🌳" : "🍽️"}
            </span>
            <div>
              <h4 className="font-semibold text-gray-800">Table {table.tableNumber}</h4>
              <p className="text-sm text-gray-600">{table.tableType}</p>
            </div>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium border ${
              table.status === "available"
                ? "bg-green-100 text-green-800 border-green-200"
                : table.status === "occupied"
                ? "bg-red-100 text-red-800 border-red-200"
                : table.status === "reserved"
                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                : "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            {table.status === "occupied" ? "KOT Running" : table.status}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{table.seatingCapacity} seats</span>
        </div>
      </div>
    </motion.div>
  ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Please select a room from the sidebar to view tables.</p>
                )}
              </div>
            </div>
          ) : (
            <KOTInterface
              tableId={selectedTable}
              roomId={selectedRoom}
              products={products}
              onBack={handleBackToTables}
              onNewKOT={handleNewKOT}
              onPrintKOT={handlePrintKOT}
              onAddToBill={handleAddToBill}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(POSPage);