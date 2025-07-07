import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/api';
import { useAuth } from '../context/AuthContext';
import EditOrderModal from '../components/EditModel';
import DeleteOrderModal from '../components/DeleteOrderModal';
import DeletedOrdersModal from './DeletedOrdersModal.jsx';
import { 
  FiPackage, FiUser, FiMapPin, FiCalendar, FiDollarSign, 
  FiFilter, FiSearch, FiChevronDown, FiChevronUp, 
  FiPrinter, FiTrendingUp, FiList, FiClock, 
  FiCheckCircle, FiXCircle, FiRefreshCw, FiEdit, FiTrash2, FiArchive
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// Helper functions
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

// Payment method styles
const getPaymentMethodStyle = (method) => {
  switch (method?.toLowerCase()) {
    case 'cash':
      return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    case 'card':
      return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
    case 'upi':
      return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
    case 'online':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
  }
};

// Company info from localStorage
const companyInfo = {
  name: localStorage.getItem("company_name") || "ROYAL KING DHABA",
  address: localStorage.getItem("company_address") || "Purvanchal Highway Road, UP, Azamgarh 276001",
  phone: localStorage.getItem("company_phone") || "+91-7398549531",
  email: localStorage.getItem("company_email") || "royalkingdhaba9531@gmail.com",
  taxRate: parseFloat(localStorage.getItem("company_taxRate")) || 5,
  discount: parseFloat(localStorage.getItem("company_discount")) || 0,
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'orderDate', direction: 'desc' });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletedOrdersModalOpen, setIsDeletedOrdersModalOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [editForm, setEditForm] = useState({ products: [], discount: null, notes: '' });
  const [productSearch, setProductSearch] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);
  const invoiceNum = `INV-${Date.now().toString().substr(-6)}`;

  const fetchOrders = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/order/${user.userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
      });
      if (response.data.success) {
        setOrders(response.data.orders.filter(order => order.status !== 'deleted') || []);
        setError(null);
      } else {
        throw new Error(response.data.error || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (retryCount < 3) {
        setTimeout(() => fetchOrders(retryCount + 1), 2000);
      } else {
        setError('Failed to fetch orders after multiple attempts. Please try again later.');
        toast.error('Failed to fetch orders. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products', {
        headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
      });
      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch products');
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error('Failed to fetch products. Please try again.');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    const interval = setInterval(() => {
      fetchOrders();
    }, 600000);
    returnIPAddress: () => clearInterval(interval);
  }, [user.userId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditModalOpen || isDeleteModalOpen || isDeletedOrdersModalOpen) {
        if (e.key === 'Escape') {
          setIsEditModalOpen(false);
          setIsDeleteModalOpen(false);
          setIsDeletedOrdersModalOpen(false);
        } else if (e.key === 'Enter' && document.activeElement !== searchInputRef.current) {
          if (isEditModalOpen) {
            addProductToEditForm();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, isDeleteModalOpen, isDeletedOrdersModalOpen]);

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
    return total + (order.totalAmount || 0);
  }, 0);

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const calculateDiscount = (subtotal, order) => {
    let discountAmount = 0;
    if (order.discount?.type && order.discount?.value) {
      if (order.discount.type === 'percentage') {
        discountAmount = (subtotal * order.discount.value) / 100;
      } else if (order.discount.type === 'fixed') {
        discountAmount = order.discount.value;
      }
    } else {
      const discountPercent = companyInfo.discount || 0;
      discountAmount = (subtotal * (discountPercent / 100));
    }
    return discountAmount.toFixed(2);
  };

  const printOrder = (order) => {
    const printWindow = window.open("", "_blank", "width=800,height=1000,scrollbars=yes,resizable=yes");
    if (!printWindow) {
      alert("Pop-up blocked! Please allow pop-ups to print invoice.");
      return;
    }

    const discountLabel = order.discount?.type === "percentage"
      ? `Discount (${order.discount?.value || 0}%):`
      : `Discount (₹${order.discount?.value || 0}):`;

    const subtotal = order.subTotal || 0;
    const discountAmount = parseFloat(calculateDiscount(subtotal, order));
    const subtotalAfterDiscount = (subtotal - discountAmount).toFixed(2);
    const taxAmount = (subtotalAfterDiscount * (companyInfo.taxRate / 100)).toFixed(2);

    const paymentStamp = order.paymentMethod?.toUpperCase() || "PAID";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${companyInfo.name}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm auto; margin: 1mm; }
          body {
            font-family: monospace, sans-serif;
            margin: 0 auto;
            padding: 1mm;
            color: #000;
            font-size: 14px;
            line-height: 1.6;
            width: 76mm;
            position: relative;
          }
          .invoice-container {
            max-width: 76mm;
            margin: 0 auto;
            padding: 1mm;
          }
          .company-header {
            text-align: center;
            margin-bottom: 2mm;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
          }
          .company-details {
            font-size: 13px;
          }
          .gst-number {
            font-size: 13px;
            font-weight: bold;
          }
          .invoice-details, .summary-section {
            font-size: 13px;
          }
          .detail-row, .summary-row {
            display: flex;
            justify-content: space-between;
          }
          .items-header {
            font-weight: bold;
            font-size: 15px;
            text-align: center;
            margin: 2mm 0;
          }
          .items-table {
            width: 100%;
            font-size: 13px;
          }
          .items-table th, .items-table td {
            text-align: left;
            padding: 0.5mm 0;
          }
          .align-right { text-align: right; }
          .total-row {
            font-weight: bold;
            font-size: 15px;
            margin-top: 2mm;
          }
          .footer {
            text-align: center;
            margin-top: 3mm;
            font-size: 13px;
          }
          .stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            font-size: 20px;
            font-weight: bold;
            border: 2px dashed black;
            padding: 10px 20px;
            border-radius: 50%;
            opacity: 0.15;
            z-index: 0;
          }
        </style>
      </head>
      <body>
        <div class="stamp">${paymentStamp}</div>
        <div class="invoice-container">
          <div class="company-header">
            <div class="company-name">${companyInfo.name.toUpperCase()}</div>
            <div class="company-details">
              ${companyInfo.address}<br>
              📞 ${companyInfo.phone} | ✉️ ${companyInfo.email}
            </div>
            <div class="gst-number">GSTIN: ${companyInfo.gstNumber || "09ABKFR9647R1ZV"}</div>
          </div>

          <div class="invoice-details">
            <div class="detail-row"><span>Bill No:</span><span>${order.invoiceNum || "N/A"}</span></div>
            <div class="detail-row"><span>Date:</span><span>${new Date(order.orderDate).toLocaleDateString()}</span></div>
            <div class="detail-row"><span>Time:</span><span>${new Date(order.orderDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
            <div class="detail-row"><span>Cashier:</span><span>${order.user?.name || "Admin"}</span></div>
            <div class="detail-row"><span>Payment:</span><span>${paymentStamp}</span></div>
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
              ${order.products
                .map(item => `
                <tr>
                  <td>${item.product?.name || "N/A"}</td>
                  <td class="align-right">${item.quantity || 0}</td>
                  <td class="align-right">₹${(item.price || 0).toFixed(2)}</td>
                  <td class="align-right">₹${((item.price || 0) * item.quantity || 0).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="summary-row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div class="summary-row"><span>${discountLabel}</span><span>- ₹${discountAmount.toFixed(2)}</span></div>
            <div class="summary-row"><span>After Discount:</span><span>₹${subtotalAfterDiscount}</span></div>
            <div class="summary-row"><span>GST (${companyInfo.taxRate}%):</span><span>₹${taxAmount}</span></div>
            <div class="summary-row total-row"><span>Total:</span><span>₹${(order.totalAmount || 0).toFixed(2)}</span></div>
          </div>

          <div class="footer">
            <div class="thank-you">Thank you! Visit Again!</div>
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

  const openEditModal = async (order) => {
    try {
      const response = await axiosInstance.get(`/order/single/${order._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
      });
      if (response.data.success) {
        setEditingOrder(response.data.order);
        setEditForm({
          products: response.data.order.products.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.price
          })),
          discount: response.data.order.discount || null,
          notes: response.data.order.notes || ''
        });
        setIsEditModalOpen(true);
        setProductSearch('');
        setIsPreviewOpen(false);
      } else {
        throw new Error(response.data.error || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      toast.error('Failed to load order details. Please try again.');
    }
  };

  const openDeleteModal = (order) => {
    setDeletingOrder(order);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteOrder = async (orderId, reason) => {
    try {
      const response = await axiosInstance.delete(`/order/delete/${orderId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
        data: { reason }
      });
      if (response.data.success) {
        setOrders(orders.filter(o => o._id !== orderId));
        setIsDeleteModalOpen(false);
        setDeletingOrder(null);
        toast.success('Order deleted successfully');
      } else {
        throw new Error(response.data.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error("Error deleting order:", err);
      toast.error('Failed to delete order. Please try again.');
    }
  };

  const handleEditFormChange = (index, field, value) => {
    const updatedProducts = [...editForm.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setEditForm({ ...editForm, products: updatedProducts });
  };

  const addProductToEditForm = () => {
    if (productSearch) {
      const product = products.find(p => p.name.toLowerCase() === productSearch.toLowerCase());
      if (product && product.stock > 0) {
        setEditForm({
          ...editForm,
          products: [...editForm.products, { productId: product._id, quantity: 1, price: product.price }]
        });
        setProductSearch('');
      } else {
        toast.error(product ? 'Product out of stock' : 'Product not found');
      }
    } else {
      setEditForm({
        ...editForm,
        products: [...editForm.products, { productId: '', quantity: 1, price: 0 }]
      });
    }
  };

  const removeProductFromEditForm = (index) => {
    setEditForm({
      ...editForm,
      products: editForm.products.filter((_, i) => i !== index)
    });
  };

  const handleDiscountChange = (field, value) => {
    setEditForm({
      ...editForm,
      discount: { ...editForm.discount, [field]: value }
    });
  };

  const handleNotesChange = (value) => {
    setEditForm({ ...editForm, notes: value });
  };

  const calculateOrderTotals = () => {
    const subtotal = editForm.products.reduce((total, item) => {
      const product = products.find(p => p._id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);

    let discountAmount = 0;
    if (editForm.discount?.type && editForm.discount?.value) {
      if (editForm.discount.type === 'percentage') {
        discountAmount = (subtotal * editForm.discount.value) / 100;
      } else if (editForm.discount.type === 'fixed') {
        discountAmount = editForm.discount.value;
      }
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = subtotalAfterDiscount * (companyInfo.taxRate / 100);
    const total = subtotalAfterDiscount + tax;
    return { subtotal, discountAmount, total };
  };

  const saveOrderChanges = async () => {
    try {
      const payload = {
        products: editForm.products.filter(p => p.productId && p.quantity > 0).map(p => ({
          productId: p.productId,
          quantity: p.quantity
        })),
        discount: editForm.discount,
        notes: editForm.notes
      };

      const response = await axiosInstance.put(`/order/update/${editingOrder._id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
      });

      if (response.data.success) {
        setOrders(orders.map(o => o._id === editingOrder._id ? response.data.order : o));
        setIsEditModalOpen(false);
        toast.success('Order updated successfully');
        printOrder(response.data.order);
      } else {
        throw new Error(response.data.error || 'Failed to update order');
      }
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error('Failed to update order. Please try again.');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) && product.stock > 0
  );

  const { subtotal, discountAmount, total } = calculateOrderTotals();

  const OrderCard = ({ order }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-gray-800">#{order._id.slice(-6).toUpperCase()}</h4>
          <div className="flex space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(order);
              }}
              className="text-yellow-600 hover:text-yellow-800 p-1"
              disabled={order.status === 'completed' || order.status === 'cancelled' || order.status === 'deleted'}
              aria-label="Edit order"
            >
              <FiEdit size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(order);
              }}
              className="text-red-600 hover:text-red-800 p-1"
              disabled={order.status === 'deleted'}
              aria-label="Delete order"
            >
              <FiTrash2 size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                printOrder(order);
              }}
              className="text-blue-600 hover:text-blue-800 p-1"
              aria-label="Print order"
            >
              <FiPrinter size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleOrderExpansion(order._id);
              }}
              className="text-gray-600 hover:text-gray-800 p-1"
              aria-label="Toggle order details"
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
              {formatRupee(order.totalAmount || 0)}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Payment Method</p>
            <span 
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium border transition-colors ${getPaymentMethodStyle(order.paymentMethod)}`}
            >
              {order.paymentMethod?.toUpperCase() || 'N/A'}
            </span>
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

          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-medium">{order.status || 'N/A'}</p>
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
                  <p className="font-medium text-gray-800">Subtotal</p>
                  <p className="font-medium text-gray-800">{formatRupee(order.subTotal || 0)}</p>
                </div>
                {order.discount && (
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800">
                      Discount {order.discount.reason ? `(${order.discount.reason})` : ''}
                    </p>
                    <p className="font-medium text-red-600">
                      -{formatRupee(calculateDiscount(order.subTotal || 0, order))}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <p className="font-medium text-gray-800">Total</p>
                  <p className="font-bold text-lg text-green-600">{formatRupee(order.totalAmount || 0)}</p>
                </div>
                {order.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {order.notes}
                    </p>
                  </div>
                )}
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
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsDeletedOrdersModalOpen(true)}
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="View deleted orders"
              aria-label="View deleted orders"
            >
              <FiArchive size={18} />
            </button>
            <button 
              onClick={refreshOrders}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Refresh orders"
              aria-label="Refresh orders"
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={18} />
            </button>
          </div>
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
              aria-label="Search orders"
            />
          </div>
          
          <div className="relative sm:w-auto">
            <button 
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center w-full"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              aria-label="Open sort menu"
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

      <EditOrderModal
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        editingOrder={editingOrder}
        editForm={editForm}
        setEditForm={setEditForm}
        products={products}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        filteredProducts={filteredProducts}
        handleEditFormChange={handleEditFormChange}
        handleDiscountChange={handleDiscountChange}
        handleNotesChange={handleNotesChange}
        addProductToEditForm={addProductToEditForm}
        removeProductFromEditForm={removeProductFromEditForm}
        saveOrderChanges={saveOrderChanges}
        formatRupee={formatRupee}
      />

      <DeleteOrderModal
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        deletingOrder={deletingOrder}
        handleDeleteOrder={handleDeleteOrder}
      />

      <DeletedOrdersModal
        isDeletedOrdersModalOpen={isDeletedOrdersModalOpen}
        setIsDeletedOrdersModalOpen={setIsDeletedOrdersModalOpen}
        formatRupee={formatRupee}
      />

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
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
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
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Items
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  KOTs
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Payment Method
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={user.role === 'admin' ? 9 : 6} className="px-6 py-4 text-center">
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
                        {formatRupee(order.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span 
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium border transition-colors ${getPaymentMethodStyle(order.paymentMethod)}`}
                        >
                          {order.paymentMethod?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(order);
                          }}
                          className="text-yellow-600 hover:text-yellow-800 mr-3"
                          disabled={order.status === 'completed' || order.status === 'cancelled' || order.status === 'deleted'}
                          aria-label="Edit order"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(order);
                          }}
                          className="text-red-600 hover:text-red-800 mr-3"
                          disabled={order.status === 'deleted'}
                          aria-label="Delete order"
                        >
                          <FiTrash2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            printOrder(order);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          aria-label="Print order"
                        >
                          <FiPrinter size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderExpansion(order._id);
                          }}
                          className="text-gray-600 hover:text-gray-800"
                          aria-label="Toggle order details"
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
                          <td colSpan={user.role === 'admin' ? 9 : 6} className="px-6 py-4">
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
                                <div className="flex justify-between items-center pt-2">
                                  <p className="font-medium text-gray-800">Subtotal</p>
                                  <p className="font-medium text-gray-800">{formatRupee(order.subTotal || 0)}</p>
                                </div>
                                {order.discount && (
                                  <div className="flex justify-between items-center">
                                    <p className="font-medium text-gray-800">
                                      Discount {order.discount.reason ? `(${order.discount.reason})` : ''}
                                    </p>
                                    <p className="font-medium text-red-600">
                                      -{formatRupee(calculateDiscount(order.subTotal || 0, order))}
                                    </p>
                                  </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                  <p className="font-medium text-gray-800">Total</p>
                                  <p className="font-bold text-lg text-green-600">{formatRupee(order.totalAmount || 0)}</p>
                                </div>
                                {order.notes && (
                                  <div className="mt-4">
                                    <p className="text-sm text-gray-600">
                                      <strong>Notes:</strong> {order.notes}
                                    </p>
                                  </div>
                                )}
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
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={user.role === 'admin' ? 9 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
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