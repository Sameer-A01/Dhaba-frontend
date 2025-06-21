import React, { useState, useEffect } from 'react';
import { FiX, FiArchive } from 'react-icons/fi';
import axiosInstance from '../utils/api';
import { toast } from 'react-toastify';

const DeletedOrdersModal = ({ isDeletedOrdersModalOpen, setIsDeletedOrdersModalOpen, formatRupee }) => {
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDeletedOrdersModalOpen) {
      const fetchDeletedOrders = async () => {
        try {
          setLoading(true);
          const response = await axiosInstance.get('/order/deletions/history', {
            headers: { Authorization: `Bearer ${localStorage.getItem('ims_token')}` },
          });
          if (response.data.success) {
            setDeletedOrders(response.data.orders || []);
          } else {
            throw new Error(response.data.error || 'Failed to fetch deleted orders');
          }
        } catch (err) {
          console.error('Error fetching deleted orders:', err);
          toast.error('Failed to load deleted orders. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchDeletedOrders();
    }
  }, [isDeletedOrdersModalOpen]);

  const handleClose = () => {
    setIsDeletedOrdersModalOpen(false);
    setDeletedOrders([]);
  };

  if (!isDeletedOrdersModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FiArchive className="mr-2 text-purple-600" /> Deleted Orders History
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : deletedOrders.length > 0 ? (
          <div className="space-y-4">
            {deletedOrders.map((order) => (
              <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800">#{order._id.slice(-6).toUpperCase()}</h4>
                  <span className="text-sm text-gray-500">
                    Deleted on {new Date(order.deletionInfo?.deletedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <p className="text-gray-500">Deleted By</p>
                    <p className="font-medium">{order.deletionInfo?.deletedBy?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reason</p>
                    <p className="font-medium">{order.deletionInfo?.reason || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium text-green-600">{formatRupee(order.totalAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Items</p>
                    <p className="font-medium">{order.products?.length || 0} item{(order.products?.length || 0) !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <strong>Products:</strong> {order.products?.map(p => p.product?.name || 'N/A').join(', ') || 'No products'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No deleted orders found</p>
        )}
      </div>
    </div>
  );
};

export default DeletedOrdersModal;