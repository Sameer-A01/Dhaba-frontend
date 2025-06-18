import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/api";
import { ShoppingCart, X, Printer, Settings, MapPin, Users, RefreshCw, ChevronRight, ChevronLeft, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KOTInterface from "./KOTInterface";
import { Link } from "react-router-dom";

const POSPage = () => {
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

  const billRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("ims_user"));
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
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Persist selectedRoom to localStorage
  useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem("selectedRoom", selectedRoom);
    } else {
      localStorage.removeItem("selectedRoom");
    }
  }, [selectedRoom]);

  // Handle room selection
  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
    setShowTableSelection(true);
  };

  // Handle table selection
  const handleTableSelect = (roomId, tableId) => {
    setSelectedRoom(roomId);
    setSelectedTable(tableId);
    setShowTableSelection(false);
    setIsSidebarOpen(false);
  };

  // Handle back to table selection
  const handleBackToTables = () => {
    setShowTableSelection(true);
    setSelectedTable("");
    setIsSidebarOpen(true);
  };

  // Handle new KOT creation
  const handleNewKOT = () => {
    setShowTableSelection(false);
    setIsSidebarOpen(false);
  };

  // Handle adding KOT items to bill
const handleAddToBill = async (kot = null, generateFinalBill = false, paymentMethod = "cash", kotDiscount = null) => {
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

    // Use KOT-specific discount if provided, otherwise fall back to companyInfo.discount
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
      discount: discountToUse, // Store discount in billData
    });

    setShowBill(true);
  } catch (error) {
  console.error("Error details:", error.response?.data || error.message);
  alert("Failed to generate bill: " + (error.response?.data?.message || error.message));
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
          @page { size: 80mm 297mm; margin: 2mm; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 5mm; 
            color: #000; 
            font-size: 14px; 
            line-height: 1.4; 
            width: 70mm; 
            background: white; 
          }
          .kot-container { 
            max-width: 70mm; 
            margin: 0 auto; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 5mm; 
            border-bottom: 2px solid #333; 
            padding-bottom: 3mm; 
          }
          .header h1 { 
            font-size: 20px; 
            margin: 0 0 2mm 0; 
            font-weight: bold; 
            text-transform: uppercase;
          }
          .kot-details { 
            margin-bottom: 5mm; 
            border-bottom: 1px solid #333; 
            padding-bottom: 3mm; 
          }
          .kot-details p { 
            margin: 2mm 0; 
            font-size: 14px; 
            display: flex; 
            justify-content: space-between; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 13px; 
            margin-bottom: 5mm; 
          }
          th { 
            text-align: left; 
            font-weight: bold; 
            border-bottom: 2px solid #333; 
            padding: 2mm 0;
          }
          td { 
            padding: 1.5mm 0; 
            vertical-align: top;
          }
          .footer { 
            text-align: center; 
            margin-top: 5mm; 
            font-size: 12px; 
            padding-top: 3mm; 
            border-top: 1px solid #333; 
            font-weight: bold;
          }
          .item-name {
            font-weight: bold;
          }
          .instructions {
            color: #555;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="kot-container">
          <div class="header">
            <h1>Kitchen Order Ticket</h1>
          </div>
          <div class="kot-details">
            <p><strong>KOT No:</strong> <span>${kot.kotNumber}</span></p>
            <p><strong>Room:</strong> <span>${rooms.find((r) => r._id === kot.roomId)?.roomName || "N/A"}</span></p>
            <p><strong>Table:</strong> <span>${rooms.find((r) => r._id === kot.roomId)?.tables.find((t) => t._id === kot.tableId)?.tableNumber || "N/A"}</span></p>
            <p><strong>Time:</strong> <span>${new Date(kot.createdAt).toLocaleTimeString()}</span></p>
            <p><strong>Staff:</strong> <span>${userName || "N/A"}</span></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="width: 15%;">Qty</th>
                <th style="width: 35%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${kot.orderItems
                .map(
                  (item) => `
                <tr>
                  <td class="item-name">${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td class="instructions">${item.specialInstructions || "-"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>Thank you!</p>
          </div>
        </div>
        <script>
          setTimeout(() => window.print(), 100);
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
  const discountLabel = billData.discount?.type === "percentage"
    ? `Discount (${billData.discount?.value || 0}%):`
    : `Discount (₹${billData.discount?.value || 0}):`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${companyInfo.name}</title>
      <meta charset="UTF-8">
      <style>
        @page { 
          size: 80mm auto; 
          margin: 2mm; 
        }
        
        @media print {
          body { 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        body { 
          font-family: 'Arial', sans-serif; 
          margin: 0 auto; 
          padding: 2mm; 
          color: #333; 
          font-size: 11px; 
          line-height: 1.4; 
          width: 76mm; 
          background: white; 
        }
        
        .invoice-container { 
          width: 100%; 
          max-width: 76mm; 
          margin: 0 auto; 
          border: 1px solid #e0e0e0;
          padding: 3mm;
          box-sizing: border-box;
        }
        
        .company-header { 
          text-align: center; 
          margin-bottom: 4mm; 
          padding-bottom: 3mm; 
          border-bottom: 1px solid #e0e0e0;
        }
        
        .company-name { 
          font-size: 16px; 
          margin: 0 0 2mm 0; 
          font-weight: bold; 
          color: #222;
          letter-spacing: 0.5px;
        }
        
        .company-details { 
          margin: 1.5mm 0; 
          font-size: 10px; 
          color: #555;
          line-height: 1.4;
        }
        
        .gst-number {
          font-weight: bold;
          font-size: 10px;
          margin-top: 2mm;
          color: #555;
        }
        
        .invoice-details { 
          margin-bottom: 4mm; 
          padding-bottom: 3mm; 
          border-bottom: 1px dashed #e0e0e0;
          font-size: 10px;
        }
        
        .detail-row { 
          display: flex; 
          justify-content: space-between;
          margin: 1.5mm 0;
        }
        
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        
        .items-header {
          font-weight: bold;
          font-size: 12px;
          text-align: center;
          margin: 3mm 0;
          padding: 2mm 0;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          background-color: #f8f8f8;
        }
        
        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 4mm; 
          font-size: 10px;
        }
        
        .items-table th { 
          text-align: left; 
          font-weight: bold; 
          padding: 2mm 0;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .items-table td { 
          padding: 1.5mm 0; 
          border-bottom: 1px dotted #e0e0e0;
          vertical-align: top;
        }
        
        .item-name {
          max-width: 35mm;
          word-break: break-word;
          font-weight: 500;
        }
        
        .align-right {
          text-align: right;
        }
        
        .summary-section { 
          margin-top: 3mm;
          font-size: 11px;
        }
        
        .summary-row { 
          display: flex; 
          justify-content: space-between;
          margin: 2mm 0;
          padding: 1mm 0;
        }
        
        .summary-label {
          color: #555;
        }
        
        .summary-value {
          font-weight: bold;
        }
        
        .subtotal-row {
          border-top: 1px dashed #e0e0e0;
          padding-top: 2mm;
        }
        
        .total-row {
          border-top: 2px solid #e0e0e0;
          border-bottom: 2px solid #e0e0e0;
          margin: 3mm 0;
          padding: 2.5mm 0;
          font-size: 12px;
          font-weight: bold;
          background-color: #f8f8f8;
        }
        
        .footer { 
          text-align: center; 
          margin-top: 4mm; 
          font-size: 10px; 
          padding-top: 3mm; 
          border-top: 1px solid #e0e0e0;
          color: #555;
        }
        
        .thank-you {
          font-weight: bold;
          font-size: 12px;
          color: #333;
          margin-bottom: 2mm;
          letter-spacing: 0.5px;
        }
        
        .return-policy {
          font-size: 9px;
          margin-top: 2mm;
          font-style: italic;
        }
        
        /* Print-specific adjustments */
        @media print {
          .invoice-container {
            border: none;
            padding: 2mm;
          }
          
          body {
            padding: 0;
            font-size: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="company-header">
          <div class="company-name">${companyInfo.name.toUpperCase()}</div>
          <div class="company-details">
            ${companyInfo.address}<br>
            📞 ${companyInfo.phone} | ✉️ ${companyInfo.email}
          </div>
          <div class="gst-number">GSTIN: 09ABKFR9647R1ZV</div>
        </div>
        
        <div class="invoice-details">
          <div class="detail-row">
            <span class="detail-label">Invoice #:</span>
            <span>${invoiceNum}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span>${new Date().toLocaleDateString('en-IN')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span>${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Cashier:</span>
            <span>${userName || "Admin"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Room:</span>
            <span>${rooms.find((r) => r._id === selectedRoom)?.roomName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Table:</span>
            <span>${rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span>${billData.paymentMethod.charAt(0).toUpperCase() + billData.paymentMethod.slice(1)}</span>
          </div>
        </div>
        
        <div class="items-header">ORDER DETAILS</div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th class="align-right">QTY</th>
              <th class="align-right">PRICE</th>
              <th class="align-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${billData.items
              .map(
                (item) => `
              <tr>
                <td class="item-name">${item.product.name}</td>
                <td class="align-right">${item.quantity}</td>
                <td class="align-right">₹${item.product.price.toFixed(2)}</td>
                <td class="align-right">₹${item.itemTotal.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="summary-section">
          <div class="summary-row">
            <span class="summary-label">Subtotal:</span>
            <span class="summary-value">₹${billData.totalAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">${discountLabel}</span>
            <span class="summary-value">- ₹${calculateDiscount()}</span>
          </div>
          <div class="summary-row subtotal-row">
            <span class="summary-label">After Discount:</span>
            <span class="summary-value">₹${calculateSubtotalAfterDiscount()}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">GST (${companyInfo.taxRate}%):</span>
            <span class="summary-value">₹${calculateTax()}</span>
          </div>
          <div class="summary-row total-row">
            <span>GRAND TOTAL:</span>
            <span>₹${calculateGrandTotal()}</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="thank-you">THANK YOU FOR YOUR VISIT</div>
          <div>We appreciate your business!</div>
        </div>
      </div>
      
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
};
  // Calculate bill totals
 const calculateDiscount = () => {
  const discount = billData.discount || { type: "percentage", value: parseFloat(companyInfo.discount) || 0 };
  if (discount.type === "percentage") {
    return (billData.totalAmount * (discount.value / 100)).toFixed(2);
  } else {
    return Math.min(discount.value, billData.totalAmount).toFixed(2); // Ensure fixed discount doesn't exceed total
  }
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

  // Get room status summary
  const getRoomStatus = (room) => {
    const tables = room.tables || [];
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const available = tables.filter((t) => t.status === "available").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    return { occupied, available, reserved };
  };

  // Filter rooms based on search query
  const filteredRooms = rooms.filter((room) =>
    room.roomName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {filteredRooms.map((room) => {
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
              })}
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
                      <p className="text-gray-600">Room: {rooms.find((r) => r._id === selectedRoom)?.roomName || "N/A"}</p>
                      <p className="text-gray-600">Table: {rooms.find((r) => r._id === selectedRoom)?.tables.find((t) => t._id === selectedTable)?.tableNumber || "N/A"}</p>
                      <p className="text-gray-600">Payment Method: {billData.paymentMethod.charAt(0).toUpperCase() + billData.paymentMethod.slice(1)}</p>
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
  <span className="text-gray-600">
    Discount ({billData.discount?.type === "percentage" ? `${billData.discount?.value || 0}%` : `₹${billData.discount?.value || 0}`}):
  </span>
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
                    onClick={() => {
                      setShowBill(false);
                      setShowTableSelection(true);
                      setSelectedTable("");
                      setIsSidebarOpen(true);
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
                                ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                                : "border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
                            }`}
                            whileHover={table.status === "available" ? { scale: 1.02 } : {}}
                            whileTap={table.status === "available" ? { scale: 0.98 } : {}}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">
                                    {table.tableType === "booth" ? "🛋️" : table.tableType === "high-top" ? "🍸" : table.tableType === "outdoor" ? "🌳" : "🍽️"}
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
                                  {table.status === "occupied" ? "KOT Running (Occupied)" : table.status}
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

export default POSPage;