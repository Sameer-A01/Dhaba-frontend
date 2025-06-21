import React from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';

const DeletionHistory = ({ isOpen, onClose, deletionHistory, loading, formatRupee }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Deletion History</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <FiX size={24} />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : Array.isArray(deletionHistory) && deletionHistory.length > 0 ? (
          <div className="space-y-4">
            {deletionHistory.map((order) => (
              <div key={order._id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Order #{order._id?.slice(-6).toUpperCase() || 'N/A'}</p>
                    <p className="text-sm text-gray-500">
                      Deleted by: {order.deletionInfo?.deletedBy?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {order.deletionInfo?.deletedAt ? new Date(order.deletionInfo.deletedAt).toLocaleString() : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">Reason: {order.deletionInfo?.reason || 'No reason provided'}</p>
                  </div>
                  <p className="font-medium text-green-600">{formatRupee(order.totalAmount || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No deleted orders found</p>
        )}
      </div>
    </motion.div>
  );
};

export default DeletionHistory;