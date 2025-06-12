import React, { useState, useEffect, useRef, useMemo } from "react";
import axiosInstance from "../utils/api";
import { ShoppingCart, X, Plus, Minus, Printer, Settings, Search, Tag, Package, DollarSign, ChevronLeft, RefreshCw, ChevronDown, MapPin, Users, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KOTInterface from "./KOTInterface";

const POSPage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [showTableSelection, setShowTableSelection] = useState(true);
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
  const [billData, setBillData] = useState({ kots: [], totalAmount: 0, items: [] });

  const billRef = useRef(null);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("ims_user"));
  const userId = user?._id;
  const userName = user?.name;
  const invoiceNum = `INV-${Date.now().toString().substr(-6)}`;

  // Fetch rooms and products
  const fetchData = async () => {
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
      alert("Failed to fetch data: " + error.message);
    } finally {
      setRefreshingRooms(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle table selection
  const handleTableSelect = (roomId, tableId) => {
    setSelectedRoom(roomId);
    setSelectedTable(tableId);
    setShowTableSelection(false);
  };

  // Handle back to table selection
  const handleBackToTables = () => {
    setShowTableSelection(true);
    setSelectedRoom("");
    setSelectedTable("");
  };

  // Handle new KOT creation
  const handleNewKOT = () => {
    setShowTableSelection(false);
  };

  // Handle adding KOT items to bill
  const handleAddToBill = async (kot = null, generateFinalBill = false) => {
    try {
      const response = await axiosInstance.get(`/kot?tableId=${selectedTable}&status=preparing,ready`);
      const kots = response.data.kots;

      // Aggregate items across all KOTs
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
              itemTotal: existing.itemTotal + (product.price * item.quantity)
            });
          }
        });
      });

      const items = Array.from(itemMap.values());
      const totalAmount = items.reduce((sum, item) => sum + item.itemTotal, 0);

      // If generating final bill, close all KOTs
      if (generateFinalBill) {
        await axiosInstance.put(`/kot/close/${selectedTable}`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem("ims_token")}` },
        });
      }

      setBillData({ 
        kots,
        items,
        totalAmount
      });

      setShowBill(true);
    } catch (error) {
      console.error("Error fetching KOTs for bill:", error);
      alert("Failed to generate bill");
    }
  };

  // Handle printing KOT
  const handlePrintKOT = (kot) => {
    const printWindow = window.open("", "_blank", "width=800,height=1000,scrollbars=yes,resizable=yes");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print KOT.");
      return;
    }

    const qrData = `KOT:${kot.kotNumber},TABLE:${rooms.find((r) => r._id === kot.roomId)?.tables.find((t) => t._id === kot.tableId)?.tableNumber || 'N/A'}`;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT - ${kot.kotNumber}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm 297mm; margin: 2mm; }
          body { font-family: 'Courier New', monospace; margin: 0; padding: 5mm; color: #000; font-size: 12px; line-height: 1.3; width: 70mm; background: white; }
          .kot-container { max-width: 70mm; margin: 0 auto; }
          .company-header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed #333; padding-bottom: 3mm; }
          .company-header h1 { font-size: 16px; margin: 0 0 2mm 0; font-weight: bold; }
          .company-header p { margin: 1mm 0; font-size: 10px; }
          .kot-details { margin-bottom: 5mm; border-bottom: 1px dashed #333; padding-bottom: 3mm; }
          .kot-details p { margin: 1mm 0; font-size: 10px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 3mm; }
          th { text-align: left; font-weight: bold; border-bottom: 1px solid #333; padding: 1mm 0; }
          td { padding: 0.5mm 0; }
          .footer { text-align: center; margin-top: 5mm; font-size: 9px; padding-top: 3mm; border-top: 1px dashed #333; }
          .qr-container { display: flex; justify-content: center; margin: 3mm 0; min-height: 80px; }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="kot-container">
          <div class="company-header">
            <h1>${companyInfo.name}</h1>
            <p>${companyInfo.address}</p>
            <p>Tel: ${companyInfo.phone}</p>
          </div>
          <div class="kot-details">
            <p><strong>KOT:</strong> <span>${kot.kotNumber}</span></p>
            <p><strong>Room:</strong> <span>${rooms.find((r) => r._id === kot.roomId)?.roomName || 'N/A'}</span></p>
            <p><strong>Table:</strong> <span>${rooms.find((r) => r._id === kot.roomId)?.tables.find((t) => t._id === kot.tableId)?.tableNumber || 'N/A'}</span></p>
            <p><strong>Time:</strong> <span>${new Date(kot.createdAt).toLocaleTimeString()}</span></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${kot.orderItems.map((item) => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.specialInstructions || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="qr-container" id="qrcode"></div>
          <div class="footer">
            <p>Kitchen Order Ticket</p>
          </div>
        </div>
        <script>
          new QRCode(document.getElementById("qrcode"), {
            text: "${qrData}",
            width: 80,
            height: 80,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
          setTimeout(() => window.print(), 1000);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle bill printing
  const handlePrintBill = () => {
    const printWindow = window.open("", "_blank", "width=800,height=1000,scrollbars=yes,resizable=yes");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print invoice.");
      return;
    }

    const totalItems = billData.items.reduce((sum, item) => sum + item.quantity, 0);
    const qrData = `INV:${invoiceNum},AMT:${calculateGrandTotal()},COMP:${companyInfo.name},ROOM:${rooms.find((r) => r._id === selectedRoom)?.roomName},TABLE:${rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${companyInfo.name}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm 297mm; margin: 2mm; }
          body { font-family: 'Courier New', monospace; margin: 0; padding: 5mm; color: #000; font-size: 12px; line-height: 1.3; width: 70mm; background: white; }
          .invoice-container { max-width: 70mm; margin: 0 auto; }
          .company-header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed #333; padding-bottom: 3mm; }
          .company-header h1 { font-size: 16px; margin: 0 0 2mm 0; font-weight: bold; }
          .company-header p { margin: 1mm 0; font-size: 10px; }
          .invoice-details { margin-bottom: 5mm; border-bottom: 1px dashed #333; padding-bottom: 3mm; }
          .invoice-details p { margin: 1mm 0; font-size: 10px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 3mm; }
          th { text-align: left; font-weight: bold; border-bottom: 1px solid #333; padding: 1mm 0; }
          td { padding: 0.5mm 0; }
          .summary-section { border-top: 1px dashed #333; padding-top: 3mm; margin-top: 3mm; }
          .summary-row { display: flex; justify-content: space-between; padding: 0.5mm 0; font-size: 10px; }
          .summary-row.total { font-weight: bold; font-size: 12px; border-top: 1px solid #333; margin-top: 2mm; padding-top: 2mm; }
          .footer { text-align: center; margin-top: 5mm; font-size: 9px; padding-top: 3mm; border-top: 1px dashed #333; }
          .qr-container { display: flex; justify-content: center; margin: 3mm 0; min-height: 80px; }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="invoice-container">
          <div class="company-header">
            <h1>${companyInfo.name}</h1>
            <p>${companyInfo.address}</p>
            <p>Tel: ${companyInfo.phone}</p>
            <p>Email: ${companyInfo.email}</p>
          </div>
          <div class="invoice-details">
            <p><strong>Invoice:</strong> <span>${invoiceNum}</span></p>
            <p><strong>Date:</strong> <span>${new Date().toLocaleDateString()}</span></p>
            <p><strong>Time:</strong> <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
            <p><strong>Cashier:</strong> <span>${userName || 'Admin'}</span></p>
            <p><strong>Room:</strong> <span>${rooms.find((r) => r._id === selectedRoom)?.roomName || 'N/A'}</span></p>
            <p><strong>Table:</strong> <span>${rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber || 'N/A'}</span></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${billData.items.map((item) => `
                <tr>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.product.price.toFixed(2)}</td>
                  <td>₹${item.itemTotal.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary-section">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₹${billData.totalAmount.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Discount (${companyInfo.discount}%):</span>
              <span>-₹${calculateDiscount()}</span>
            </div>
            <div class="summary-row">
              <span>Subtotal after Discount:</span>
              <span>₹${calculateSubtotalAfterDiscount()}</span>
            </div>
            <div class="summary-row">
              <span>GST (${companyInfo.taxRate}%):</span>
              <span>₹${calculateTax()}</span>
            </div>
            <div class="summary-row total">
              <span>GRAND TOTAL:</span>
              <span>₹${calculateGrandTotal()}</span>
            </div>
            <div class="summary-row">
              <span>Total Items:</span>
              <span>${totalItems}</span>
            </div>
          </div>
          <div class="qr-container" id="qrcode"></div>
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </div>
        <script>
          new QRCode(document.getElementById("qrcode"), {
            text: "${qrData}",
            width: 80,
            height: 80,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });
          setTimeout(() => window.print(), 1000);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Calculate bill totals
  const calculateDiscount = () => {
    const discountPercent = parseFloat(companyInfo.discount) || 0;
    return (billData.totalAmount * (discountPercent / 100)).toFixed(2);
  };

  const calculateSubtotalAfterDiscount = () => {
    return (parseFloat(billData.totalAmount) - parseFloat(calculateDiscount())).toFixed(2);
  };

  const calculateTax = () => {
    const taxRatePercent = parseFloat(companyInfo.taxRate) || 0;
    const subtotalAfterDiscount = parseFloat(calculateSubtotalAfterDiscount());
    return (subtotalAfterDiscount * (taxRatePercent / 100)).toFixed(2);
  };

  const calculateGrandTotal = () => {
    const subtotalAfterDiscount = parseFloat(calculateSubtotalAfterDiscount());
    const tax = parseFloat(calculateTax());
    return (subtotalAfterDiscount + tax).toFixed(2);
  };

  // Handle company info change
  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem(`company_${name}`, value);
      return updated;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={companyInfo.email}
                    onChange={handleCompanyInfoChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <motion.button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Invoice</h2>
                <button
                  onClick={() => setShowBill(false)}
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
                    <p className="text-gray-600">Room: {rooms.find((r) => r._id === selectedRoom)?.roomName || 'N/A'}</p>
                    <p className="text-gray-600">Table: {rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber || 'N/A'}</p>
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
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Discount ({companyInfo.discount}%):</span>
                      <span className="font-medium text-green-600">₹{calculateDiscount()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal after Discount:</span>
                      <span className="font-medium">₹{calculateSubtotalAfterDiscount()}</span>
                    </div>
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
                  <p>Thank you for your business!</p>
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
                  onClick={() => {
                    setShowBill(false);
                    setShowTableSelection(true);
                    setSelectedRoom("");
                    setSelectedTable("");
                  }}
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
      <div className="flex-1 overflow-hidden">
        {showTableSelection ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Select a Table</h2>
              <motion.button
                onClick={fetchData}
                disabled={refreshingRooms}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw size={18} className={refreshingRooms ? "animate-spin" : ""} />
                <span>Refresh</span>
              </motion.button>
            </div>
            <div className="space-y-6">
              {rooms.map((room) => (
                <div key={room._id} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800">{room.roomName}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {room.tables.map((table) => (
                      <motion.div
                        key={table._id}
                        onClick={() => table.status === 'available' && handleTableSelect(room._id, table._id)}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          table.status !== 'available'
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                        }`}
                        whileHover={table.status === 'available' ? { scale: 1.02 } : {}}
                        whileTap={table.status === 'available' ? { scale: 0.98 } : {}}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{table.tableType === 'Window' ? '🪟' : table.tableType === 'Corner' ? '🏠' : table.tableType === 'Booth' ? '🛋️' : '🍽️'}</span>
                              <div>
                                <h4 className="font-semibold text-gray-800">Table {table.tableNumber}</h4>
                                <p className="text-sm text-gray-600">{table.tableType}</p>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              table.status === 'available' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : table.status === 'occupied'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}>
                              {table.status}
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
              ))}
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
  );
};

export default POSPage;