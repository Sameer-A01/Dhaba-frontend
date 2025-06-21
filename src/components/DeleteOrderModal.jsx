import React, { useState } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

const DeleteOrderModal = ({ isDeleteModalOpen, setIsDeleteModalOpen, deletingOrder, handleDeleteOrder }) => {
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await handleDeleteOrder(deletingOrder._id, reason);
      setReason('');
    } catch (err) {
      console.error('Error in handleConfirmDelete:', err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleClose = () => {
    setIsDeleteModalOpen(false);
    setReason('');
  };

  if (!isDeleteModalOpen || !deletingOrder) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FiTrash2 className="mr-2 text-red-600" /> Delete Order
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
            disabled={isDeleting}
          >
            <FiX size={20} />
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete order #{deletingOrder._id.slice(-6).toUpperCase()}? This action cannot be undone.
        </p>
        <div className="mb-4">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Deletion
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows="4"
            placeholder="Enter reason for deletion..."
            disabled={isDeleting}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;